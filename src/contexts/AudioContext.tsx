import React, { useRef, type ReactNode } from "react";
import { AudioEngine } from "../audio/AudioEngine";
import { AudioContext, type AudioContextValue } from "./AudioContext.ts";

interface AudioProviderProps {
  children: ReactNode;
}

export const AudioProvider: React.FC<AudioProviderProps> = ({ children }) => {
  // Use useRef to ensure we only create one AudioEngine instance
  const audioEngineRef = useRef<AudioEngine | null>(null);

  if (!audioEngineRef.current) {
    audioEngineRef.current = new AudioEngine();
  }

  const value: AudioContextValue = {
    audioEngine: audioEngineRef.current
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
};
