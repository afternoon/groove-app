import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebaseConfig";
import { signOut, type User } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import since from "since-time-ago";
import type { Project } from "../types";
import { UserIcon } from "@heroicons/react/24/solid";

import "./DashboardPage.css";

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserProjects = async (user: User) => {
    try {
      setLoading(true);
      const projectsCollection = collection(db, "projects");
      const q = query(projectsCollection, where("ownerId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      const fetchedProjects: Project[] = [];
      querySnapshot.forEach((doc) => {
        fetchedProjects.push({ id: doc.id, ...doc.data() } as Project);
      });
      setProjects(fetchedProjects);
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError("Failed to load projects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        navigate("/");
        return;
      }

      setUser(user);
      fetchUserProjects(user);
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
    <div className="dashboard">
      <h1>{user.displayName}'s Grooves</h1>
      <div>
        {loading && <p>Loading projects...</p>}
        {error && <p style={{ color: "darkred" }}>{error}</p>}
        {!loading && !error && projects.length === 0 && <p>No projects found.</p>}
        {!loading && !error && projects.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "5px", marginTop: "50px", color: "white" }}>
            {projects.map((project) => (
              <div key={project.id} style={{ border: "1px solid gray", padding: "10px", borderRadius: "5px", width: "512px", textAlign: "left", cursor: "pointer" }}
                  onClick={() => navigate(`/projects/${project.id}`)}>
                <h2 style={{ margin: 0 }}>{project.name || "Untitled Project"}</h2>
                {project.createdAt && 
                  <div>Created {since(project.createdAt.toDate())}</div>
                }
                {project.isPublic !== undefined &&
                  <div>{project.isPublic ? "Public" : "Private"}</div>
                }
              </div>
            ))}
          </div>
        )}

        <p style={{ marginTop: "50px", padding: "0 340px" }}>
          <button onClick={handleLogout}>
            <UserIcon style={{ height: "20px", width: "20px" }} />
            <span>Log out</span>
          </button>
        </p>
      </div>
    </div>
  );
};

export default DashboardPage;
