import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";
import type { Project } from "../types";
import { PlayIcon, StopIcon, UsersIcon } from "@heroicons/react/24/solid";

const ProjectPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("Project ID is missing.");
      setLoading(false);
      return;
    }

    setLoading(true);
    const docRef = doc(db, "projects", id);

    const unsubscribe = onSnapshot(docRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const docData = docSnapshot.data();
        console.log(docData);
        const tempo = docData.latestSnapshot?.content?.tempo;
        console.log(tempo);
        setProject({ id: docSnapshot.id, ...docData } as Project);
        setError(null);
      } else {
        setProject(null);
        setError("Project not found.");
      }
      setLoading(false);
    }, (err) => {
      console.error("Error fetching project:", err);
      setError("Failed to load project.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  if (loading) {
    return <div>Loading project...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!project) {
    return <div>Project not found.</div>;
  }

  return (
    <div className="min-h-screen w-screen bg-gray-950 text-white">
      <header className="w-screen fixed bg-gray-950">
        <div className="flex p-2">
          <div className="flex-none w-1/4 space-x-1">
            <PlayIcon className="h-5 w-5 cursor-pointer hover:text-white inline-block" aria-label="Play" />
            <StopIcon className="h-5 w-5 cursor-pointer hover:text-white inline-block" aria-label="Stop" />
            <input
              className="bg-gray-800 text-white border-none w-16 ml-4 px-1 py-0.5 focus:outline-none"
              type="number"
              defaultValue={project.latestSnapshot?.content?.tempo || 120}
              aria-label="Tempo"
            />
          </div>
          <div className="flex-auto w-1/2 text-center text-gray-300">
            <h1 className="text-lg font-normal py-1">{project.name || "Untitled Project"}</h1>
          </div>
          <div className="flex-none w-1/4 text-right flex justify-end">
            <button
                className="flex items-center space-x-1 text-sm bg-gray-800 hover:bg-gray-700 text-white h-9 px-3 p-0 -mt-1 transition-colors rounded cursor-pointer"
                aria-label="Share Project">
              <UsersIcon className="h-4 w-4" />
              <span>Share</span>
            </button>
          </div>
        </div>
        <div className="bg-gray-900 p-1 text-xs text-normal text-white">Workspace</div>
      </header>

      <main className="pt-8 mb-80">
        <div className="flex-grow w-full p-4">
          <p>Workspace</p>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 h-64">
        <h2 className="bg-gray-900 p-1 text-xs text-normal text-white">Sound</h2>
        <div className="">
          {/* Sound pane content will go here */}
        </div>
      </footer>
    </div>
  );
};

export default ProjectPage;
