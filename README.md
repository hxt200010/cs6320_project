# 🧠 Python Documentation RAG Chatbot

An intelligent, context-aware chatbot that helps users improve their coding skills through interactive conversations. Powered by **Retrieval-Augmented Generation (RAG)**, the system pulls information from official Python documentation to provide accurate and relevant responses.

---

## 📌 About the Project

Our project is an intelligent chatbot designed to help users improve their Python coding skills through conversation-based learning. The chatbot leverages **Retrieval-Augmented Generative (RAG)** techniques to fetch information from official Python documentation and provide accurate, grounded, and context-aware answers.

The chatbot is trained on Python 3.13 documentation and enables:

- Conversational search
- Programming guidance
- Real-time assistance using language models and document retrieval

---

## 🎯 Goal

Our goal is to fulfill the following core functionalities that assist users in everyday learning:

- **Interactive Learning**  
  Engage users in real-world conversations that enhance learning.

- **Library Assistance**  
  Suggest Python libraries based on user needs and queries.

- **Programming Correction**  
  Help users debug, understand, or improve their code using relevant documentation.

---

## 🔍 Scope

- **🖥️ More Prettier UI**  
  Build a clean, modern UI using **Next.js** for a better user experience.

- **📚 One-Stop Shop for Python Library**  
  The bot will support multiple Python libraries and fetch accurate documentation in response to user questions.

- **⚙️ Check Program Efficiency**
  - Retrieve and rank the top 3 most relevant documents from the vector database.
  - Provide suggestions with context and explanations.

---

## 🏗️ Tech Stack

| Component          | Tech                                     |
| ------------------ | ---------------------------------------- |
| Frontend (Planned) | Next.js                                  |
| Backend            | LangChain, FastAPI                       |
| LLM                | OpenAI GPT-3.5 / GPT-4                   |
| Embeddings         | OpenAI Embeddings                        |
| Vector Store       | FAISS (local) or Pinecone/Chroma (cloud) |
| Data Source        | Python 3.13 Documentation (Plain Text)   |
| Tools              | Jupyter, Git, Databricks (for data prep) |

---

## 👨‍👩‍👧‍👦 Team Members

- We will collaborate to implement the RAG pipeline and improve answer accuracy.
- We will use vector databases to support semantic document search.
- We will spread out data collection, aggregation, and cleaning.
- We will use **Databricks** for large-scale processing and feature exploration.
- We will iterate to handle real-world issues like ambiguity, noise, or conflicting documentation.

---

## 🧪 What the Code Does / Steps to Run

### 🔄 Pipeline Breakdown

1. **Unzip Python 3.13 documentation**  
   The plain-text `.zip` file is extracted into a local folder using Python's `zipfile`.

2. **Load all `.txt` files**  
   Reads every file in the extracted folder into memory using LangChain's `Document` class.

3. **Split documents into chunks**  
   Uses `RecursiveCharacterTextSplitter` to break content into small, overlapping pieces for better semantic matching.

4. **Generate embeddings**  
   OpenAI Embeddings are created for each chunk and stored in a FAISS vector store for fast retrieval.

5. **Run Retrieval-Augmented Generation**  
   A LangChain RetrievalQA or ConversationalRetrievalChain is used to answer user questions based on retrieved content.

6. **Interactive chat**  
   A loop runs in the notebook where the user can ask questions about Python, and the bot responds using official docs.

---

---

## 🔐 How to Get OpenAI API Key & Run the Bot

To use OpenAI’s GPT models for answering questions, you'll need to generate an API key from your OpenAI account.

### 🧾 Step-by-Step Instructions

1. **Create/Open an OpenAI account**  
   Go to: https://platform.openai.com/signup  
   (Sign up or log in with your existing credentials)

2. **Generate your API key**

   - Go to: https://platform.openai.com/account/api-keys
   - Click **“Create new secret key”**
   - Copy and save the key somewhere safe (you won’t be able to see it again!)

3. **Set the API key in your code**  
   You can pass it securely using Python:

   ```python
   import os
   from getpass import getpass

   os.environ["OPENAI_API_KEY"] = getpass("🔐 Enter your OpenAI API key: ")
   ```

---

## 🚀 Setup Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/python-rag-chatbot.git
   cd python-rag-chatbot
   ```
