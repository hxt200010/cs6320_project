from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import zipfile
from dotenv import load_dotenv
from PIL import Image
import pytesseract
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

from io import BytesIO

from langchain.docstore.document import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain.vectorstores import FAISS
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory

# Load .env
load_dotenv()

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
        if file.endswith(".txt"):
            with open(os.path.join(root, file), "r", encoding="utf-8") as f:
                text = f.read()
                documents.append(Document(page_content=text, metadata={"source": file}))

# Split and embed documents
splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
split_docs = splitter.split_documents(documents)

embeddings = OpenAIEmbeddings()
vectorstore = FAISS.from_documents(split_docs, embeddings)
retriever = vectorstore.as_retriever(search_kwargs={"k": 4})

# Set up conversational memory
llm = ChatOpenAI(model_name="gpt-4o", temperature=0)
memory = ConversationBufferMemory(
    memory_key="chat_history",
    return_messages=True,
    output_key="answer"
)

qa_chain = ConversationalRetrievalChain.from_llm(
    llm=llm,
    retriever=retriever,
    memory=memory,
    return_source_documents=True,
    output_key="answer"
)

# Original Request schema
class Query(BaseModel):
    question: str

# Original endpoint for asking questions (unchanged)
@app.post("/ask")
async def ask_question(query: Query):
    result = qa_chain({"question": query.question})
    return {
        "answer": result["answer"],
        "sources": [doc.metadata["source"] for doc in result["source_documents"]]
    }

# --- New functionality starts here ---

# New endpoint for handling image uploads independently
@app.post("/ask-image")
async def ask_image(file: UploadFile = File(...)):
    image_bytes = await file.read()
    image = Image.open(BytesIO(image_bytes))
    
    # Perform OCR using pytesseract
    extracted_text = pytesseract.image_to_string(image)

    # Ask QA chain using extracted text from image
    result = qa_chain({"question": extracted_text})

    return {
        "answer": result["answer"],
        "extracted_text": extracted_text,  # optionally returning OCR result
        "sources": [doc.metadata["source"] for doc in result["source_documents"]]
    }
