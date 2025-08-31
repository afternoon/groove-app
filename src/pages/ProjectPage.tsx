import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";
import since from "since-time-ago";
import type { Project } from "../types";

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
    <div className="text-center mt-12 text-white">
      <h1 className="text-4xl font-bold">{project.name || "Untitled Project"}</h1>
      {project.createdAt && (
        <p className="text-lg">Created {since(project.createdAt.toDate())}</p>
      )}
      {project.isPublic !== undefined && (
        <p className="text-lg">{project.isPublic ? "Public" : "Private"}</p>
      )}
      {project.latestSnapshot?.content?.tempo && (
        <p className="text-lg">{project.latestSnapshot.content.tempo} bpm</p>
      )}
    </div>
  );
};

export default ProjectPage;
