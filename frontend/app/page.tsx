'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { FaRobot, FaUser, FaImage, FaTimes, FaTrashAlt, FaArrowDown } from 'react-icons/fa';

interface Message {
  sender: 'user' | 'bot';
  text: string;
}

interface ChatSession {
  title: string;
  messages: Message[];
}

export default function Home() {
  const [sessions, setSessions] = useState<ChatSession[]>([{ title: 'New Chat', messages: [] }]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [typingIndicator, setTypingIndicator] = useState('');
  const [pastedImages, setPastedImages] = useState<File[]>([]);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    scrollToBottom();
  }, [sessions, loading]);

  const scrollToBottom = () => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  };

  const handleScroll = () => {
    if (chatScrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatScrollRef.current;
      setShowScrollToBottom(scrollTop + clientHeight < scrollHeight - 100);
    }
  };

  const ask = async () => {
    if (!question.trim() && pastedImages.length === 0) return;

    const userMessage: Message = { sender: 'user', text: pastedImages.length ? `🖼️ + ${question}` : question };
    const updatedSessions = [...sessions];
    updatedSessions[activeIndex].messages.push(userMessage);
    setSessions(updatedSessions);
    setLoading(true);
    setTypingIndicator('hmmmmmm...');

    try {
      let res;
      if (pastedImages.length > 0) {
        const formData = new FormData();
        pastedImages.forEach((file) => formData.append('file', file, file.name));
        formData.append('question', question);
        res = await axios.post('http://127.0.0.1:8000/ask-image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        res = await axios.post('http://127.0.0.1:8000/ask', { question });
      }

      const botMessage: Message = { sender: 'bot', text: res.data.answer };
      updatedSessions[activeIndex].messages.push(botMessage);
      if (res.data.answer.length > 40) {
        updatedSessions[activeIndex].title = res.data.answer.split(/[.?!\n]/)[0].slice(0, 40);
      }
      setSessions([...updatedSessions]);
    } catch (err) {
      updatedSessions[activeIndex].messages.push({ sender: 'bot', text: '❌ Something went wrong.' });
      setSessions([...updatedSessions]);
    }

    setQuestion('');
    setPastedImages([]);
    setLoading(false);
    setTypingIndicator('');
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') ask();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPastedImages(prev => [...prev, file]);
  };

  const handlePaste = (e: ClipboardEvent) => {
    if (e.clipboardData) {
      const items = e.clipboardData.items;
      for (let item of items) {
        if (item.type.startsWith('image')) {
          const file = item.getAsFile();
          if (file) setPastedImages(prev => [...prev, file]);
        }
      }
    }
  };

  const removeImage = (index: number) => {
    setPastedImages(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllImages = () => setPastedImages([]);

  useEffect(() => {
    window.addEventListener('paste', handlePaste as any);
    return () => window.removeEventListener('paste', handlePaste as any);
  }, []);

  return (
    <main className={`min-h-screen w-full flex flex-col font-sans transition-colors duration-300 overflow-y-auto ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-black'} relative`}>
      <div className="absolute inset-0 -z-10">
        <div className="animated-bg h-full w-full"></div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className={`w-60 h-full ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-r'} border-r p-4 space-y-3 shadow-sm overflow-y-auto`}>
          <h2 className="text-lg font-semibold text-blue-600 flex items-center gap-2">💬 Chats</h2>
          {sessions.map((s, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`block w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-all ${i === activeIndex ? 'bg-blue-500 text-white scale-105 dark:bg-blue-400 dark:text-gray-900' : 'hover:bg-gray-100 hover:scale-[1.01] dark:text-gray-300 dark:hover:bg-gray-700'}`}
            >
              {s.title || `Chat ${i + 1}`}
            </button>
          ))}
          <button
            onClick={() => {
              setSessions([...sessions, { title: `Chat ${sessions.length + 1}`, messages: [] }]);
              setActiveIndex(sessions.length);
            }}
            className={`w-full text-sm mt-4 flex items-center gap-1 underline font-medium ${darkMode ? 'text-blue-200 hover:text-white' : 'text-blue-600 hover:text-blue-800'}`}
          >
            <span className="text-lg">➕</span> <span>New Chat</span>
          </button>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="mt-6 w-full text-sm text-blue-500 underline hover:text-blue-700"
          >
            Toggle {darkMode ? 'Light' : 'Dark'} Mode
          </button>
        </div>

        <div className="flex-1 h-full flex flex-col">
          <div className={`w-full max-w-4xl mx-auto flex flex-col flex-grow ${darkMode ? 'bg-gray-800/80 backdrop-blur-sm' : 'bg-white/80 backdrop-blur-sm'} transition-all duration-300`}>
            <div className="px-6 pt-6">
              <h1 className="text-3xl font-bold text-blue-500 mb-6 flex items-center gap-2 animate-fade-in">
                <span>Python helper</span>
              </h1>
            </div>

            {pastedImages.length > 0 && (
              <div className="flex flex-wrap gap-3 px-6">
                {pastedImages.map((file, i) => (
                  <div key={i} className="relative">
                    <img src={URL.createObjectURL(file)} alt={`pasted-${i}`} className="w-24 h-24 object-cover rounded border shadow" />
                    <div className="absolute bottom-0 left-0 bg-black bg-opacity-60 text-white text-[10px] px-1 truncate w-full">
                      {file.name}
                    </div>
                    <button onClick={() => removeImage(i)} className="absolute top-0 right-0 bg-black bg-opacity-50 text-white rounded-bl px-1 py-0.5 text-xs">
                      <FaTimes />
                    </button>
                  </div>
                ))}
                <button onClick={clearAllImages} className="text-sm flex items-center gap-1 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">
                  <FaTrashAlt /> Clear All
                </button>
              </div>
            )}

            <div
              ref={chatScrollRef}
              className="flex-grow overflow-y-scroll px-6 space-y-4 py-4 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 focus:outline-none"
              tabIndex={0}
              onScroll={handleScroll}
              style={{ maxHeight: 'calc(100vh - 180px)', outline: 'none' }}
            >
              <AnimatePresence>
                {sessions[activeIndex].messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className={`p-3 rounded-lg w-fit max-w-[80%] ${msg.sender === 'user' ? 'bg-blue-100 self-end ml-auto text-black' : darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-black'}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {msg.sender === 'user' ? <FaUser /> : <FaRobot />} <span className="text-xs opacity-70">{msg.sender}</span>
                    </div>
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </motion.div>
                ))}
              </AnimatePresence>
              {loading && <div className="p-3 text-sm">{typingIndicator}...</div>}
            </div>

            {showScrollToBottom && (
              <button
                onClick={scrollToBottom}
                className="fixed bottom-20 right-10 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 z-50"
              >
                <FaArrowDown />
              </button>
            )}
          </div>

          <div className="w-full max-w-4xl mx-auto px-6 py-4 flex gap-2 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 sticky bottom-0">
          <input
            type="text"
            className="flex-1 p-3 border rounded-l-lg bg-white text-black dark:bg-gray-800 dark:text-white"
            placeholder="Ask something about Python or paste images here"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyPress}
          />

            <label className="bg-gray-200 hover:bg-gray-300 cursor-pointer flex items-center p-3 rounded">
              <FaImage />
              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
            </label>
            <button className="bg-blue-600 text-white px-5 rounded-r-lg" onClick={ask} disabled={loading}>
              Ask
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .animated-bg {
          position: absolute;
          top: 0;
          left: 0;
          z-index: -1;
          height: 100%;
          width: 100%;
          background: linear-gradient(-45deg, #87CEFA, #8A2BE2, #00BFFF, #7B68EE);
          background-size: 400% 400%;
          animation: gradientAnimation 20s ease infinite;
          opacity: 0.3;
          pointer-events: none;
        }
        @keyframes gradientAnimation {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </main>
  );
}
