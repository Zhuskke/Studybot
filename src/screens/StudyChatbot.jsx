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

  // --- Firebase Auth Listener ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // --- Load Firestore Chat History if Logged In ---
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
      // Guest mode → clear stored messages from Firestore (local only)
      setMessages([]);
    }
  }, [db, user, appId]);

  // --- Auto Scroll to Bottom ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- Send Message ---
  const sendMessage = useCallback(
    async (e) => {
      e.preventDefault();
      if (!input.trim() || loading) return;

      const text = input.trim();
      setInput("");
      setLoading(true);

      // Show user message immediately
      const newUserMessage = {
        id: Date.now(),
        role: "user",
        text,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, newUserMessage]);

      // Save message to Firestore only if logged in
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

      // Call Gemini API
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

      // Show AI reply
      setMessages((prev) => [...prev, newAiMessage]);

      // Save AI reply to Firestore only if logged in
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

  // --- Logout ---
  const handleLogout = async () => {
    await signOut(auth);
    setMessages([]);
  };

  // --- Loading Screen ---
  if (!isAuthReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg font-medium text-black">
          Loading Study Tutor...
        </div>
      </div>
    );
  }

  // --- Main Chat UI (works for both logged & guest users) ---
  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      <div className="flex flex-col flex-1 w-full max-w-3xl mx-auto bg-white shadow-sm rounded-lg">
        {/* Header */}
        <header className="p-4 bg-white text-black border-b border-gray-300 flex justify-between items-center">
          <h1 className="text-xl font-bold flex items-center">
            🎓 Gemini Study Tutor
          </h1>
          <div className="flex items-center space-x-3">
            {user ? (
              <>
                <span className="text-sm text-gray-600">
                  Logged in as <strong>{user.email || "User"}</strong>
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-red-500 hover:underline"
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

        {/* Chat Messages */}
        <main className="flex-1 p-4 overflow-y-auto flex flex-col space-y-3 h-[70vh]">
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

        {/* Input Box */}
        <footer className="p-4 border-t border-gray-300 bg-white">
          <form
            onSubmit={sendMessage}
            className="flex space-x-3 items-center justify-between"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a study question..."
              className="flex-1 p-2 border border-gray-400 rounded-lg focus:border-black outline-none"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2 px-4 bg-black text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </footer>
      </div>
    </div>
  );
}
