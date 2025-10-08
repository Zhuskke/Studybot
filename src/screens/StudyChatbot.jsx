import React, { useState, useEffect, useRef, useCallback } from "react";
import { auth, db } from "../FirebaseConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { callGeminiApi } from "../components/GeminiApi";
import { ChatMessage } from "../components/ChatMessage";

export default function StudyChatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const appId = "study-tutor-app";
  const SYSTEM_PROMPT =
    "You are a world-class, supportive, and knowledgeable **educational assistant (Gemini Study Tutor)**. You are limited to academic and study topics only (science, history, coding, literature, etc.). Decline politely if asked anything non-academic.";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (db && user) {
      const chatRef = collection(
        db,
        "artifacts",
        appId,
        "users",
        user.uid,
        "study_chats"
      );
      const q = query(chatRef, orderBy("timestamp", "asc"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const loaded = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate(),
        }));
        setMessages(loaded);
      });
      return () => unsubscribe();
    } else {
      setMessages([]);
    }
  }, [db, user, appId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(
    async (e) => {
      e.preventDefault();
      if (!input.trim() || loading) return;

      const text = input.trim();
      setInput("");
      setLoading(true);

      const newUserMessage = {
        id: Date.now(),
        role: "user",
        text,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, newUserMessage]);

      if (user && db) {
        const chatRef = collection(
          db,
          "artifacts",
          appId,
          "users",
          user.uid,
          "study_chats"
        );
        await addDoc(chatRef, {
          role: "user",
          text,
          timestamp: serverTimestamp(),
          sources: [],
        });
      }

      const { text: reply, sources } = await callGeminiApi(
        [{ role: "user", text }],
        SYSTEM_PROMPT
      );

      const newAiMessage = {
        id: Date.now() + 1,
        role: "model",
        text: reply,
        sources,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, newAiMessage]);

      if (user && db) {
        const chatRef = collection(
          db,
          "artifacts",
          appId,
          "users",
          user.uid,
          "study_chats"
        );
        await addDoc(chatRef, {
          role: "model",
          text: reply,
          sources,
          timestamp: serverTimestamp(),
        });
      }

      setLoading(false);
    },
    [input, loading, db, user, appId]
  );

  const handleLogout = async () => {
    await signOut(auth);
    setMessages([]);
  };

  if (!isAuthReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg font-medium text-black">
          Loading Study Tutor...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      <div className="flex flex-col flex-1 w-full max-w-3xl mx-auto bg-white shadow-md rounded-lg px-2 sm:px-4">
        <header className="p-4 bg-white text-black border-b border-gray-200 flex justify-between items-center shadow-sm sticky top-0 z-10">
          <h1 className="text-xl font-bold flex items-center gap-2">
            🎓 <span className="tracking-tight">Gemini Study Tutor</span>
          </h1>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-sm text-gray-600">
                  Logged in as <strong>{user.email}</strong>
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-red-600 hover:text-red-800 transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="text-sm text-blue-600 hover:underline"
              >
                Log in
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 overflow-y-auto space-y-3 h-[70vh]">
          {!user && (
            <div className="text-center text-gray-500 text-sm mb-2">
              ⚠️ You are in <strong>Guest Mode</strong> — chat history won’t be
              saved.
            </div>
          )}

          {messages.length === 0 && !loading ? (
            <div className="text-gray-500 text-center mt-20">
              Ask your Gemini Tutor about academic topics.
            </div>
          ) : (
            messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)
          )}

          {loading && (
            <div className="flex justify-start text-sm text-gray-500 animate-pulse">
              Tutor is thinking...
            </div>
          )}
          <div ref={messagesEndRef} />
        </main>

        <footer className="p-4 border-t border-gray-300 bg-white">
          <form
            onSubmit={sendMessage}
            className="flex space-x-3 items-center"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a study question..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </footer>
      </div>
    </div>
  );
}
