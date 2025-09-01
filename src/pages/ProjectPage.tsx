import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";
import type { Project } from "../types";

import { PlayIcon, StopIcon, UsersIcon } from "@heroicons/react/24/solid";
import "./ProjectPage.css";

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
    return <div style={{ color: "red" }}>{error}</div>;
  }

  if (!project) {
    return <div>Project not found.</div>;
  }

  const projectName = project.name || "Untitled Project";

  return (
    <div className="project">
      <header>
        <div className="project-name"><h1>{projectName}</h1></div>
        <div className="transport-controls">
          <PlayIcon style={{ color: "white", width: "26px", height: "26px", cursor: "pointer", display: "inline-block" }} aria-label="Play" />
          <StopIcon style={{ color: "white", width: "26px", height: "26px", cursor: "pointer", display: "inline-block" }} aria-label="Stop" />
        </div>
        <div className="project-settings">
          <input
              style={{ width: "44px" }}
              type="number"
              defaultValue={project.latestSnapshot?.content?.tempo || 120}
              aria-label="Tempo"/>
          <button
              style={{ display: "flex", alignItems: "center", gap: "5px" }}
              aria-label="Share Project">
            <UsersIcon style={{ color: "white", width: "16px", height: "16px", cursor: "pointer", display: "inline-block" }} aria-label="Share" />
            <span>Share</span>
          </button>
        </div>
      </header>

      <section className="workspace"></section>
      <section className="sounds"></section>
      <section className="browser"></section>      
      <section className="assistant"></section>
    </div>
  );
};

export default ProjectPage;
