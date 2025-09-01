import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { UserIcon } from "@heroicons/react/24/solid";

import "./HomePage.css";

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate("/dashboard");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  };

  return (
    <div className="hero">
      <h1>Groove</h1>
      <p>Your collaborative, AI-assisted, browser-based music studio.</p>
      <p style={{ marginTop: "50px", padding: "0 300px" }}>
        <button onClick={handleLogin}>
          <UserIcon style={{ height: "20px", width: "20px" }} />
          <span>Log in with Google</span>
        </button>
      </p>
    </div>
  );
};

export default HomePage;
