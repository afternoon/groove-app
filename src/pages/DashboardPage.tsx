import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebaseConfig";
import { signOut, type User } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import since from "since-time-ago";
import type { Project } from "../types";

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
    <div className="text-center mt-12">
      <h1>{user.displayName}'s Grooves</h1>
      <div className="mt-5">
        {loading && <p>Loading projects...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && !error && projects.length === 0 && <p>No projects found.</p>}
        {!loading && !error && projects.length > 0 && (
          <div className="flex flex-wrap justify-center gap-5 mt-5 text-white">
            {projects.map((project) => (
              <div key={project.id} className="border border-gray-300 p-4 rounded-lg w-[512px] text-left cursor-pointer"
                  onClick={() => navigate(`/project/${project.id}`)}>
                <h3 className="m-0">{project.name || "Untitled Project"}</h3>
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

        <button onClick={handleLogout} className="px-5 py-2 mt-5 cursor-pointer">
          Log Out
        </button>
      </div>
    </div>
  );
};

export default DashboardPage;
