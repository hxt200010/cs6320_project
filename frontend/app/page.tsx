// frontend/app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

interface Message {
  sender: 'user' | 'bot';
  text: string;
}

interface ChatSession {
  title: string;
  messages: Message[];
}

export default function Home() {
  const [sessions, setSessions] = useState<ChatSession[]>([
    { title: 'New Chat', messages: [] }
  ]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const ask = async () => {
    if (!question.trim()) return;

    const userMessage: Message = { sender: 'user', text: question };
    const updatedSessions = [...sessions];
    updatedSessions[activeIndex].messages.push(userMessage);
    setSessions(updatedSessions);
    setLoading(true);

    try {
      const res = await axios.post('http://127.0.0.1:8000/ask', { question });
      const botMessage: Message = { sender: 'bot', text: res.data.answer };
      updatedSessions[activeIndex].messages.push(botMessage);
      setSessions([...updatedSessions]);
    } catch (err) {
      updatedSessions[activeIndex].messages.push({ sender: 'bot', text: '❌ Something went wrong.' });
      setSessions([...updatedSessions]);
    }

    setQuestion('');
    setLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') ask();
  };

  return (
    <main className={`min-h-screen flex font-sans ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-black'}`}>
      {/* Sidebar */}
      <div className={`w-60 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-r'} border-r p-4 space-y-3 shadow-sm`}>
        <h2 className="text-lg font-semibold text-blue-600">💬 Chats</h2>
        {sessions.map((s, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`block w-full text-left px-3 py-2 rounded-md text-sm ${
              i === activeIndex ? 'bg-blue-100 font-semibold' : 'hover:bg-gray-100'
            }`}
          >
            {s.title || `Chat ${i + 1}`}
          </button>
        ))}
        <button
          onClick={() => {
            setSessions([...sessions, { title: `Chat ${sessions.length + 1}`, messages: [] }]);
            setActiveIndex(sessions.length);
          }}
          className={`w-full text-sm mt-4 underline ${darkMode ? 'text-blue-300 hover:text-white' : 'text-blue-600 hover:text-blue-800'}`}
        >
          ➕ New Chat
        </button>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="mt-6 w-full text-sm text-blue-500 underline"
        >
          Toggle {darkMode ? 'Light' : 'Dark'} Mode
        </button>
      </div>

      {/* Chat UI */}
      <div className="flex-1 p-6 flex flex-col items-center">
        <div className={`w-full max-w-2xl shadow rounded-lg p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <h1 className="text-2xl font-bold text-blue-500 mb-4 flex items-center gap-2">
            <span>🐍 Ask me about Python Docs</span>
          </h1>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 mb-6">
            {sessions[activeIndex].messages.map((msg, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg w-fit max-w-[80%] ${
                  msg.sender === 'user' ? 'bg-blue-100 self-end ml-auto text-black' : darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-black'
                }`}
              >
                {msg.sender === 'bot' ? (
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="text-sm mb-2 leading-relaxed">{children}</p>,
                      code: ({ children }) => (
                        <code className="bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-100 p-1 rounded text-xs font-mono">{children}</code>
                      ),
                      pre: ({ children }) => (
                        <pre className="bg-gray-200 dark:bg-gray-700 text-sm rounded p-3 overflow-x-auto"><code>{children}</code></pre>
                      ),
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
                ) : (
                  <span className="text-sm whitespace-pre-line">{msg.text}</span>
                )}
              </div>
            ))}
            {loading && (
              <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700 w-fit max-w-[80%]">
                <span className="text-sm">🤖 Thinking...</span>
              </div>
            )}
          </div>

          <div className="flex">
            <input
              type="text"
              className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white dark:bg-gray-900 text-black dark:text-white"
              placeholder="Ask something like 'show me a sample python code?'"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyPress}
            />
            <button
              onClick={ask}
              className="bg-blue-600 text-white px-5 rounded-r-lg hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              Ask
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
