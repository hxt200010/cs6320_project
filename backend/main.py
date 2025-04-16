from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import zipfile
from dotenv import load_dotenv
from PIL import Image
import pytesseract
from io import BytesIO
import ast

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

# Define strict prompt template
prompt_template = PromptTemplate(
    input_variables=["context", "question"],
    template="""
You are a helpful assistant that ONLY answers questions using the provided Python documentation.
If the answer is not in the documentation and not Python related, say \"I'm only allowed to answer Python question in the document\"
ONLY answer Python programming language related question, answer if it's Python related!

Context:
{context}

Question: {question}
Answer:
"""
)

# Set up conversational QA chain
llm = ChatOpenAI(model_name="gpt-4o", temperature=0)
memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True, output_key="answer")
conversation_chain = ConversationalRetrievalChain.from_llm(
    llm=llm,
    retriever=retriever,
    memory=memory,
    return_source_documents=True,
    combine_docs_chain_kwargs={"prompt": prompt_template},
    output_key="answer"
)

# Query schema
class Query(BaseModel):
    question: str

@app.post("/ask")
async def ask_question(query: Query):
    result = conversation_chain({"question": query.question})
    return {
        "answer": result["answer"],
        "sources": [doc.metadata["source"] for doc in result["source_documents"]]
    }

@app.post("/ask-image")
async def ask_image(file: UploadFile = File(...)):
    image_bytes = await file.read()
    image = Image.open(BytesIO(image_bytes))
    extracted_text = pytesseract.image_to_string(image)

    # Try parsing to verify if it looks like Python code
    is_python = False
    try:
        ast.parse(extracted_text)
        is_python = True
    except Exception:
        is_python = False

    if is_python:
        combined_query = f"Here is a code snippet extracted from an image:\n\n{extracted_text.strip()}\n\nWhat does this code do?"
    else:
        combined_query = f"The following text was extracted from an image, but it might not be Python code:\n\n{extracted_text.strip()}\n\nCan you still try to interpret it?"

    result = conversation_chain({"question": combined_query})

    return {
        "answer": result["answer"],
        "is_python": is_python,
        "extracted_text": extracted_text,
        "sources": [doc.metadata["source"] for doc in result["source_documents"]]
    }

# Optional function to read image and ask via script
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

    result = conversation_chain({"question": combined_query})
    print("\n🤖 Answer:", result["answer"])
    print("\n📚 Sources:")
    for doc in result["source_documents"]:
        print(" -", doc.metadata["source"])
    print("\n---")

# 🧪 Script mode for testing without frontend
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

        result = conversation_chain({"question": query})

        print("\n🤖 Answer:\n" + result["answer"])

        print("\n📚 Sources:")
        for doc in result["source_documents"]:
            print(" -", doc.metadata["source"])
        print("\n---")