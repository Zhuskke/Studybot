// src/App.jsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./screens/Login";
import Register from "./screens/Register";
import StudyChatbot from "./screens/StudyChatbot";
import "./App.css";


export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/chat" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/chat" element={<StudyChatbot />} />
      </Routes>
    </Router>
  );
}
