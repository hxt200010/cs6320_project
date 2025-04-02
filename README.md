# 🧠 CS6320 AI Chatbot for Python Library Support

An intelligent, conversational chatbot designed to help users improve their coding skills through natural language interaction. Our project uses **Retrieval Augmented Generation (RAG)** to provide relevant documentation, explain code, suggest libraries, and help debug Python programs.

---

## 🚀 About the Project

Our chatbot helps users learn and code smarter by engaging them in real-time conversations. Using a combination of natural language processing (NLP), semantic search, and generative AI, it pulls accurate and context-aware information from Python documentation.

It is built with:

- **Retrieval Augmented Generation (RAG)**
- **Vector search over library documentation**
- **Transformer models for understanding and generating text/code**

---

## 🎯 Goals

- **Interactive Learning:** Engage users in meaningful, real-world programming conversations
- **Library Assistance:** Suggest Python libraries based on user needs and queries
- **Programming Correction:** Help debug and optimize user code with explanations

---

## 🔍 Features

- ✅ Conversational chatbot interface
- ✅ Python library recommendation via semantic search
- ✅ Inline code correction and suggestions
- ✅ Top 3 document match display with citations
- ✅ Clean and modern frontend UI (built with Next.js)
- ✅ One-stop Python library assistance for beginners and intermediate coders

---

## 📚 NLP Pipeline Overview

1. **Intent Detection:** Classifies the user's question type (learn/help/debug)
2. **Query Embedding:** Embeds user input using `sentence-transformers`
3. **Document Retrieval:** Searches vector DB (e.g., FAISS/Chroma) for relevant Python docs
4. **RAG Generation:** Uses a language model to generate a context-aware response
5. **Code Correction (optional):** Parses and refines user-submitted code

---

## 🛠️ Tech Stack

| Layer      | Tools/Frameworks                                |
| ---------- | ----------------------------------------------- |
| Frontend   | Next.js, Tailwind CSS                           |
| Backend    | FastAPI / Flask (for chatbot API)               |
| NLP Models | HuggingFace Transformers, Sentence Transformers |
| Retrieval  | FAISS / ChromaDB                                |
| Generator  | OpenAI GPT / Mistral / Local LLMs via LangChain |
| Parsing    | AST, Tree-sitter, Python's `ast` module         |

---

## 📦 Installation

### 1. Clone the repository

```bash
git clone https://github.com/hxt200010/cs6320_project.git
cd cs6320_project
```
