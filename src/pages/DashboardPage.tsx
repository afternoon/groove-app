import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { auth } from "../firebaseConfig";
import { signOut, type User } from "firebase/auth";

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      console.log("Auth state changed:", user);
      if (!user) {
        navigate("/");
        return;
      }

      setUser(user);
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (!user) {
    return <div>Loading user data...</div>;
  }

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>{user.displayName}'s Grooves</h1>
      <div style={{ marginTop: "20px" }}>
        <p>This is where your projects will be!</p>

        <button onClick={handleLogout} style={{ padding: "10px 20px", marginTop: "20px", cursor: "pointer" }}>
          Log Out
        </button>
      </div>
    </div>
  );
};

export default DashboardPage;
