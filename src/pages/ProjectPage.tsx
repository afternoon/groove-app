import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";
import type { Project } from "../types";
import { mockProject } from "../mockData";
import { useAudio } from "../hooks/useAudio";

import { PlayIcon, StopIcon, UsersIcon } from "@heroicons/react/24/solid";
import { Playhead } from "../components/Playhead";
import "./ProjectPage.css";

const SECTION_LENGTH_BARS = 4;

const ProjectPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { audioEngine } = useAudio();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setIsPlaying] = useState(false);
  const [playheadPosition, setPlayheadPosition] = useState({ bars: 0, beats: 0, sixteenths: 0 });

  useEffect(() => {
    if (!id) {
      setError("Project ID is missing.");
      setLoading(false);
      return;
    }

    // Use mock data in development mode
    if (import.meta.env.DEV) {
      setLoading(true);
      // Simulate async loading
      setTimeout(() => {
        setProject(mockProject);
        setError(null);
        setLoading(false);
      }, 500);
      return;
    }

    // Production: Load from Firestore
    setLoading(true);
    const docRef = doc(db, "projects", id);

    const unsubscribe = onSnapshot(docRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const docData = docSnapshot.data();
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

  // Initialize AudioEngine and load project
  useEffect(() => {
    if (project) {
      const initializeAudio = async () => {
        try {
          await audioEngine.initialize();
          await audioEngine.setProject(project);
          audioEngine.setPlayheadUpdateCallback((bars, beats, sixteenths) => {
            setPlayheadPosition({bars, beats, sixteenths});
          });
        } catch (error) {
          console.error("Failed to initialize audio:", error);
        }
      };

      initializeAudio();
    }
  }, [project, audioEngine]);

  const handlePlay = async () => {
    try {
      await audioEngine.initialize();
      audioEngine.play();
      setIsPlaying(true);
    } catch (error) {
      console.error("Failed to play:", error);
    }
  };

  const handleStop = () => {
    audioEngine.stop();
    setIsPlaying(false);
  };

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
  const content = project.latestSnapshot?.content;

  return (
    <div className="project">
      <header>
        <div className="project-name"><h1>{projectName}</h1></div>
        <div className="transport-controls">
          <PlayIcon
            style={{ color: "white", width: "26px", height: "26px", cursor: "pointer", display: "inline-block" }}
            aria-label="Play"
            onClick={handlePlay}
          />
          <StopIcon
            style={{ color: "white", width: "26px", height: "26px", cursor: "pointer", display: "inline-block" }}
            aria-label="Stop"
            onClick={handleStop}
          />
        </div>
        <div className="project-settings">
          <input
              style={{ width: "44px" }}
              type="number"
              defaultValue={content?.tempo || 120}
              aria-label="Tempo"/>
          <button
              style={{ display: "flex", alignItems: "center", gap: "5px" }}
              aria-label="Share Project">
            <UsersIcon style={{ color: "white", width: "16px", height: "16px", cursor: "pointer", display: "inline-block" }} aria-label="Share" />
            <span>Share</span>
          </button>
        </div>
      </header>

      <section
        className="workspace"
        style={{
          '--num-tracks': content?.tracks?.length || 0,
          '--num-sections': content?.sections?.length || 0
        } as React.CSSProperties}
      >
        {content && (
          <div className="timeline-container">
            <Playhead
              bars={playheadPosition.bars}
              beats={playheadPosition.beats}
              sixteenths={playheadPosition.sixteenths}
              totalBars={(content.sections?.length || 0) * SECTION_LENGTH_BARS}
            />
            <div className="tracks-grid">
              <div className="track-header-spacer timeline-spacer"></div>

              {content.tracks?.map((track) => (
                // TODO refactor to separate Track component (requires project to be in context)
                <React.Fragment key={track.id}>
                  <div className="track-header">
                    <div className="track-name">{track.name}</div>
                    <div className="track-controls">
                      <div className="volume-control">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={Math.round(track.volume * 100)}
                          className="volume-slider"
                        />
                      </div>
                      <div className="track-buttons">
                        <button
                          className={`track-button mute-button ${track.isMuted ? 'active' : ''}`}
                        >
                          M
                        </button>
                        <button
                          className={`track-button solo-button ${track.isSolo ? 'active' : ''}`}
                        >
                          S
                        </button>
                      </div>
                    </div>
                  </div>

                  {content.sections?.map((section) => (
                    <div key={`${track.id}-${section.id}`} className="section-block">
                      {section.enabledTrackIds.includes(track.id) && (
                        <div className="active-block"></div>
                      )}
                    </div>
                  ))}
                </React.Fragment>
              ))}

              {content.sections?.map((section, index) => (
                <div key={section.id} className="timeline-section" style={{
                  gridColumn: index + 2,
                  gridRow: 1
                }}>
                  <div className="bar-numbers">
                    {[1, 2, 3, 4].map(bar => (
                      <span key={bar} className="bar-number">
                        {(index * SECTION_LENGTH_BARS) + bar}
                      </span>
                    ))}
                  </div>
                </div>
              ))}

            </div>
          </div>
        )}
      </section>
      <section className="sound">Sound</section>
      <section className="browser">Browser</section>
      <section className="assistant">Assistant</section>
    </div>
  );
};

export default ProjectPage;
