import { type Timestamp } from "firebase/firestore";

export const Instrument = {
  clip: "clip"
} as const;

export type Instrument = typeof Instrument[keyof typeof Instrument];

export interface Track {
  id: string;
  name: string;
  volume: number;
  isMuted: boolean;
  isSolo: boolean;
  instrument: Instrument;

  clipSampleUrl?: string;
  clipSampleTempo?: number;
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
