import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../FirebaseConfig";
import { Link, useNavigate } from "react-router-dom";
import "./css/Login.css";
import LoginBG from "./images/natgptbg.png";
import { BsEyeSlash, BsEyeFill } from "react-icons/bs";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate("/chat");
    } catch (err) {
      setError("Registration failed. Try a different email.");
    }
  };

  return (
    <div className="loginbg" style={{ backgroundImage: `url(${LoginBG})` }}>
      <div className="login-container">
        <div className="login-box">
          <h2 className="login-title">Create Account</h2>
          {error && <p className="login-error">{error}</p>}

          <form onSubmit={handleRegister} className="login-form">
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="login-input"
              required
            />

            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (min. 6 characters)"
                className="login-input"
                required
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <BsEyeFill /> : <BsEyeSlash />}
              </button>
            </div>

            <button type="submit" className="login-button">
              Register
            </button>
          </form>

          <p className="login-footer">
            Already have an account?{" "}
            <Link to="/login" className="login-link">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
