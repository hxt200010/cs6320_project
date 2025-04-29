'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { FaRobot, FaUser, FaImage, FaTimes, FaTrashAlt, FaArrowDown } from 'react-icons/fa';

interface Message {
  sender: 'user' | 'bot';
  text: string;
  images?: string[]; // base64 or blob URLs
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
  const isAsking = useRef(false);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const [modalImage, setModalImage] = useState<string | null>(null);


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
    if (loading || isAsking.current || (!question.trim() && pastedImages.length === 0)) return;
    isAsking.current = true;

    const imageURLs = pastedImages.map((file) => URL.createObjectURL(file));
    const userMessage: Message = {
      sender: 'user',
      text: question,
      images: imageURLs,
    };
    

    const updatedSessions = [...sessions];
    updatedSessions[activeIndex].messages.push(userMessage);
    setSessions(updatedSessions);
    setLoading(true);
    setTypingIndicator('hmmmmmm...');
    const chatId = `chat-${activeIndex}`;
    let res;
    try {
      
      
      if (pastedImages.length > 0) {
        const formData = new FormData();
        pastedImages.forEach((file) => formData.append('file', file, file.name));
        
        formData.append('question', question);
        res = await axios.post(`http://127.0.0.1:8000/ask-image?chat_id=${chatId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        res = await axios.post(`http://127.0.0.1:8000/ask?chat_id=${chatId}`, { question });
      }

      const botMessage: Message = { sender: 'bot', text: '' };
      updatedSessions[activeIndex].messages.push(botMessage);
      setSessions([...updatedSessions]);

      const fullText = res.data.answer;
      let charIndex = 0;

      const typeNextChar = () => {
        if (charIndex < fullText.length) {
          updatedSessions[activeIndex].messages[updatedSessions[activeIndex].messages.length - 1].text += fullText[charIndex];
          setSessions([...updatedSessions]);
          charIndex++;
          setTimeout(typeNextChar, 10);
        } else {
          if (fullText.length > 40) {
            updatedSessions[activeIndex].title = fullText.split(/[.?!\n]/)[0].slice(0, 40);
            setSessions([...updatedSessions]);
          }
          setLoading(false);
          setTypingIndicator('');
          isAsking.current = false;
        }
      };

      typeNextChar();

    } catch (err) {
      updatedSessions[activeIndex].messages.push({ sender: 'bot', text: '❌ Something went wrong.' });
      setSessions([...updatedSessions]);
      setLoading(false);
      setTypingIndicator('');
      isAsking.current = false;
    }

    setQuestion('');
    setPastedImages([]);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !loading && !isAsking.current) ask();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPastedImages((prev) => [...prev, file]);
  };

  const handlePaste = (e: ClipboardEvent) => {
    if (e.clipboardData) {
      const items = e.clipboardData.items;
      for (let item of items) {
        if (item.type.startsWith('image')) {
          const file = item.getAsFile();
          if (file) setPastedImages((prev) => [...prev, file]);
        }
      }
    }
  };

  const removeImage = (index: number) => {
    setPastedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAllImages = () => setPastedImages([]);

  useEffect(() => {
    window.addEventListener('paste', handlePaste as any);
    return () => window.removeEventListener('paste', handlePaste as any);
  }, []);

  return (
    <main className={`min-h-screen w-full flex flex-col md:flex-row font-sans transition-colors duration-500 ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-black'} overflow-hidden`}>
      <div className={`md:w-64 h-screen overflow-y-auto p-4 border-r ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-black'} sticky top-0`}>
        <h2 className="text-lg font-bold text-blue-400 mb-4">💬 Chats</h2>
        {sessions.map((s, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`w-full text-left px-4 py-2 rounded-md mb-2 transition-all ${i === activeIndex ? 'bg-blue-500 text-white' : darkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-100 text-black'}`}
          >
            {s.title || `Chat ${i + 1}`}
          </button>
        ))}
        <button onClick={() => {
          setSessions([...sessions, { title: `Chat ${sessions.length + 1}`, messages: [] }]);
          setActiveIndex(sessions.length);
        }} className="w-full py-2 mt-4 text-blue-400 hover:text-blue-300 underline">
          ➕ New Chat
        </button>
        <button onClick={() => setDarkMode(!darkMode)} className="w-full mt-6 py-2 text-blue-400 hover:text-blue-300 underline">
          Toggle {darkMode ? 'Light' : 'Dark'} Mode
        </button>
      </div>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className={`sticky top-0 z-10 px-4 py-4 shadow ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-black'}`}>
          <h1 className="text-3xl font-bold text-blue-500 dark:text-blue-300 text-center">
            Anything I can help with Python? <span className="text-yellow-400">😊</span>
          </h1>
        </div>

        {pastedImages.length > 0 && (
          <div className="flex flex-wrap gap-4 px-6 py-2">
            {pastedImages.map((file, i) => (
              <div key={i} className="relative rounded shadow overflow-hidden">
                <img src={URL.createObjectURL(file)} className="w-24 h-24 object-cover" />
                <div className="absolute bottom-0 left-0 bg-black bg-opacity-70 text-white text-xs px-1 truncate w-full">{file.name}</div>
                <button onClick={() => removeImage(i)} className="absolute top-0 right-0 bg-red-500 text-white text-xs px-1 py-0.5 rounded-bl">
                  <FaTimes />
                </button>
              </div>
            ))}
            <button onClick={clearAllImages} className="text-sm flex items-center gap-1 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">
              <FaTrashAlt /> Clear All
            </button>
          </div>
        )}

        <div ref={chatScrollRef} onScroll={handleScroll} className="flex-grow overflow-y-scroll px-6 space-y-4 py-4 pb-40">
          <AnimatePresence>
            {sessions[activeIndex].messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className={`px-4 py-3 rounded-xl shadow-md max-w-[80%] whitespace-pre-line ${msg.sender === 'user'
                  ? darkMode
                    ? 'bg-gray-700 text-white self-end ml-auto'
                    : 'bg-blue-100 text-black self-end ml-auto'
                  : darkMode
                    ? 'bg-gray-800 text-white self-start ml-0'
                    : 'bg-gray-100 text-black self-start ml-0'}`}
              >
                <div className={`flex items-center gap-2 mb-1 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {msg.sender === 'user' ? <FaUser /> : <FaRobot />} <span>{msg.sender}</span>
                </div>
                {msg.images?.map((src, idx) => (
  <img
    key={idx}
    src={src}
    alt={`uploaded-${idx}`}
    onClick={() => setModalImage(src)}
    className="cursor-pointer max-w-xs max-h-40 rounded mb-2 hover:brightness-110 transition"
  />
))}

                <ReactMarkdown
  components={{
    img: ({ node, ...props }) => (
      <img
        {...props}
        onClick={() => setModalImage(props.src || '')}
        className="cursor-pointer max-w-xs max-h-40 rounded hover:brightness-110 transition"
      />
    ),
  }}
>
  {msg.text}
</ReactMarkdown>
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && <div className={`p-3 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{typingIndicator}...</div>}
        </div>

        {showScrollToBottom && (
          <button onClick={scrollToBottom} className="fixed bottom-20 right-10 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700">
            <FaArrowDown />
          </button>
        )}
      </div>

      <div className={`w-full fixed bottom-0 left-0 right-0 ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} border-t`}>
        <div className="max-w-4xl mx-auto px-6 py-4 flex gap-2">
          <input
            type="text"
            className={`flex-1 p-3 rounded-l-full border ${darkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'} focus:ring-2 focus:ring-blue-500`}
            placeholder="💬 Ask me something about Python..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyPress}
          />
          <label className={`${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} cursor-pointer flex items-center gap-2 px-4 py-2 rounded border shadow-sm hover:bg-opacity-80`}>
          <FaImage className="text-lg" />
  <span className="text-sm font-medium"> Browse</span>
  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
          </label>
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-r-full shadow" onClick={ask} disabled={loading}>
            Ask
          </button>
        </div>
      </div>
      {modalImage && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80" onClick={() => setModalImage(null)}>
    <img src={modalImage} alt="Preview" className="max-w-full max-h-full rounded-lg shadow-lg border" />
  </div>
)}

    </main>
  );
}
