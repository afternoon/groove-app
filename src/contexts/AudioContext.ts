import { createContext } from "react";
import type { AudioEngine } from "../audio/AudioEngine";

export interface AudioContextValue {
  audioEngine: AudioEngine;
}

export const AudioContext = createContext<AudioContextValue | null>(null);