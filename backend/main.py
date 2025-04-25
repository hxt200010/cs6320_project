from fastapi import FastAPI, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import zipfile
from dotenv import load_dotenv
from PIL import Image
import pytesseract
from io import BytesIO
import ast
from typing import Dict

from langchain.docstore.document import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain.vectorstores import FAISS
from langchain.chains import ConversationalRetrievalChain
from langchain.prompts import PromptTemplate
from langchain.memory import ConversationBufferMemory

# Load .env
load_dotenv()

# Set Tesseract path
pytesseract.pytesseract.tesseract_cmd = r"C:\\Program Files\\Tesseract-OCR\\tesseract.exe"

# FastAPI app
app = FastAPI()

# Enable frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load docs if not already extracted
zip_path = "python-3.13-docs-text.zip"
extract_dir = "python_docs"

if not os.path.exists(extract_dir):
    with zipfile.ZipFile(zip_path, "r") as zip_ref:
        zip_ref.extractall(extract_dir)

# Convert text files into LangChain documents
documents = []
for root, _, files in os.walk(extract_dir):
    for file in files:
        if file.lower().endswith(".txt"):
            with open(os.path.join(root, file), "r", encoding="utf-8") as f:
                text = f.read()
                documents.append(Document(page_content=text, metadata={"source": file}))

print(f"✅ Loaded {len(documents)} raw Python doc files.")
if documents:
    print("📄 Sample doc preview:\n", documents[0].page_content[:500])

# Split and embed documents
splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
split_docs = splitter.split_documents(documents)

embeddings = OpenAIEmbeddings()
vectorstore = FAISS.from_documents(split_docs, embeddings)
retriever = vectorstore.as_retriever(search_kwargs={"k": 8})

# Prompt template
prompt_template = PromptTemplate(
    input_variables=["context", "question"],
    template="""
You are a helpful assistant that ONLY answers questions using the provided Python documentation. Answer naturally like a human being.
Pretend you know nothing about any other programming language like you have never heard of it. If the user ask about anything else other than Python, say "I have never heard of it (the object). 
If the answer is not in the documentation and not Python related, you are not allowed to answer them but don't say "I'm not allowed to answer", just say
ONLY answer if it's Python programming language related question! for every question the user ask, refer to the documentation (where you get the information from, how is it related to user question)
help the user if they don't know the content from text / image, and refer where the content from the doc
if the question related to Python but not in the doc, try to answer it in python knowledge and try to compare the question if it's related to the doc at all, which part in the doc can solve the problem
In the end, try to recommend user the best option for specified inquiry. 
Context:
{context}

Question: {question}
Answer:
"""
)

# LLM
llm = ChatOpenAI(model_name="gpt-4o", temperature=0)

# Store chat memory per chat_id
memory_store: Dict[str, ConversationBufferMemory] = {}

def get_conversation_chain(chat_id: str):
    if chat_id not in memory_store:
        memory_store[chat_id] = ConversationBufferMemory(memory_key="chat_history", return_messages=True, output_key="answer")

    memory = memory_store[chat_id]
    return ConversationalRetrievalChain.from_llm(
        llm=llm,
        retriever=retriever,
        memory=memory,
        return_source_documents=True,
        combine_docs_chain_kwargs={"prompt": prompt_template},
        output_key="answer"
    )

# Schema
class Query(BaseModel):
    question: str

# Ask endpoint
@app.post("/ask")
async def ask_question(query: Query, request: Request):
    chat_id = request.query_params.get("chat_id", "default")
    chain = get_conversation_chain(chat_id)
    result = chain({"question": query.question})
    return {
        "answer": result["answer"],
        "sources": [doc.metadata["source"] for doc in result["source_documents"]]
    }

# Ask from image
@app.post("/ask-image")
async def ask_image(request: Request, file: UploadFile = File(...)):
    chat_id = request.query_params.get("chat_id", "default")
    chain = get_conversation_chain(chat_id)

    image_bytes = await file.read()
    image = Image.open(BytesIO(image_bytes))
    extracted_text = pytesseract.image_to_string(image)

    try:
        ast.parse(extracted_text)
        is_python = True
    except Exception:
        is_python = False

    if is_python:
        combined_query = f"Here is a code snippet extracted from an image:\n\n{extracted_text.strip()}\n\nWhat does this code do?"
    else:
        combined_query = f"The following text was extracted from an image, but it might not be Python code:\n\n{extracted_text.strip()}\n\nCan you still try to interpret it?"

    result = chain({"question": combined_query})

    return {
        "answer": result["answer"],
        "is_python": is_python,
        "extracted_text": extracted_text,
        "sources": [doc.metadata["source"] for doc in result["source_documents"]]
    }

# Optional CLI
def read_image_ask(path: str):
    if not os.path.exists(path):
        print("❌ Image file not found.")
        return
    image = Image.open(path)
    extracted_text = pytesseract.image_to_string(image)
    print("📸 OCR extracted:", extracted_text[:300])

    try:
        ast.parse(extracted_text)
        is_python = True
    except Exception:
        is_python = False

    if is_python:
        combined_query = f"Here is a code snippet extracted from an image:\n\n{extracted_text.strip()}\n\nWhat does this code do?"
    else:
        combined_query = f"The following text was extracted from an image, but it might not be Python code:\n\n{extracted_text.strip()}\n\nCan you still try to interpret it?"

    result = get_conversation_chain("cli")({"question": combined_query})
    print("\n🤖 Answer:", result["answer"])
    print("\n📚 Sources:")
    for doc in result["source_documents"]:
        print(" -", doc.metadata["source"])
    print("\n---")

if __name__ == "__main__":
    print("🤖 Ask me anything about Python docs! Type 'exit' to quit.\n")
    while True:
        query = input("🧑 You: ")
        if query.lower() in ["exit", "quit", "bye"]:
            print("👋 Goodbye!")
            break
        elif query.startswith("img:"):
            path = query[4:].strip()
            read_image_ask(path)
            continue

        result = get_conversation_chain("cli")({"question": query})

        print("\n🤖 Answer:\n" + result["answer"])
        print("\n📚 Sources:")
        for doc in result["source_documents"]:
            print(" -", doc.metadata["source"])
        print("\n---")
