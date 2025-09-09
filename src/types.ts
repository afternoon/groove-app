import { type Timestamp } from "firebase/firestore";

export interface ClipInstrument {
  type: "clip";
  sampleUrl: string;
  sampleTempo: number; // in BPM
}

export interface Envelope {
  attack: number; // in seconds
  decay: number; // in seconds
  sustain: number; // 0-1 level
  release: number; // in seconds
}

export interface FilterConfig {
  type: "lowpass" | "highpass" | "bandpass" | "notch";
  filterCutoff: number; // in Hz
  filterResonance: number; // Q factor
}

export interface SynthInstrument {
  type: "synth";
  oscillatorType: "sine" | "square" | "sawtooth" | "triangle";
  envelope: Envelope;
  filter: FilterConfig;
  pattern: number[]; // e.g. [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]
}

export interface SamplerInstrument {
  type: "sampler";
  sampleUrl: string;
  pitch: number; // in semitones
  envelope: Envelope;
  filter: FilterConfig;
  pattern: number[]; // e.g. [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]
}

export type Instrument = ClipInstrument | SynthInstrument | SamplerInstrument;

export interface Track {
  id: string;
  name: string;
  volume: number;
  isMuted: boolean;
  isSolo: boolean;
  instrument: Instrument;
}

export interface Section {
  id: string;
  name: string;
  enabledTrackIds: string[]; // Track IDs that are enabled in this section
}

export interface ProjectContent {
  tempo?: number;
  tracks?: Track[];
  sections?: Section[];
}

export interface Project {
  id: string;
  name?: string;
  ownerId: string;
  createdAt: Timestamp;
  isPublic: boolean;
  latestSnapshot?: {
    content?: ProjectContent;
  };
}
