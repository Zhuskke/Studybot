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
  <div className="container">
    <div className="chat-wrapper">
      <header className="header">
        <h1 className="title">
          🎓 <span className="title-text">NatGPT</span>
        </h1>
        <div className="user-controls">
          {user ? (
            <>
              <span className="user-info">
                Logged in as <strong>{user.email}</strong>
              </span>
              <button onClick={handleLogout} className="btn logout-btn">
                Logout
              </button>
            </>
          ) : (
            <button onClick={() => navigate("/login")} className="btn login-btn">
              Log in
            </button>
          )}
        </div>
      </header>

      <main className="chat-main">
        {!user && (
          <div className="guest-warning">
            ⚠️ You are in <strong>Guest Mode</strong> — chat history won’t be saved.
          </div>
        )}

        {messages.length === 0 && !loading ? (
          <div className="empty-message">
            Ask your Gemini Tutor about academic topics.
          </div>
        ) : (
          messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)
        )}

        {loading && (
          <div className="loading">
            Tutor is thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      <footer className="footer">
        <form onSubmit={sendMessage} className="input-form">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a study question..."
            disabled={loading}
            className="text-input"
          />
          <button type="submit" disabled={loading || !input.trim()} className="btn send-btn">
            Send
          </button>
        </form>
      </footer>
    </div>
  </div>
);

}