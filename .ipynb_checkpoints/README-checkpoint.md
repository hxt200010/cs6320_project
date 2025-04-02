# 🤖 CS6320 Project: Python Library Chatbot using RAG

An intelligent chatbot designed to help users improve their coding skills through natural conversation. The bot retrieves accurate documentation and suggestions using **Retrieval Augmented Generation (RAG)** — combining NLP and a Python knowledge base to offer context-aware, interactive help.

---

## 🧠 About the Project

Our project is an intelligent chatbot that helps users improve their coding skills through conversation practice and interaction. It provides users with information from the relevant documentation using **Retrieval Augmented Generative (RAG)** models, pulling data from a knowledge base of Python library documentation to ensure accurate and context-aware responses.

---

## 🎯 Goal

Our goal is to fulfill these three key features that assist users in everyday learning:

- **Interactive Learning:** Engages users in real-world conversation
- **Library Assistance:** Recommends Python libraries based on user needs
- **Programming Correction:** Helps users troubleshoot and resolve code-related questions

---

## 📌 Scope

- ### 🖼 More Prettier UI

  - Build a clean, user-friendly interface using **Next.js**

- ### 📚 One-Stop Shop for Python Library

  - The bot can handle any popular Python library and recommend it to users based on their queries

- ### ⚙️ Check Program Efficiency
  - Choose the **top 3 best documents** based on user inquiry
  - AI will provide suggestions with explanation based on retrieved content

---

## 👥 Team Members Responsibilities

- Collaboratively implement Retrieval Augmented Generation to improve the model's accuracy
- Handle ongoing issues and errors during development
- Integrate vector database APIs to support document retrieval
- Spread out and combine data gathering responsibilities
- Use **Databricks** for data aggregation and cleaning

---

## 📦 Tech Stack

| Layer      | Tools/Frameworks                                  |
| ---------- | ------------------------------------------------- |
| UI         | Next.js                                           |
| Backend    | FastAPI / Flask                                   |
| Retrieval  | FAISS / ChromaDB                                  |
| Embedding  | Sentence Transformers (`all-MiniLM-L6-v2`)        |
| Generation | OpenAI GPT / Local LLMs via LangChain or Haystack |
| Data Tools | Databricks, Pandas, Python                        |

---

## 🛠️ Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/cs6320_project.git
cd cs6320_project
```
