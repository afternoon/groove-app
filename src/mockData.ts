import { Timestamp } from "firebase/firestore";
import type { Project } from "./types";
import { Instrument } from "./types";

// Mock Firestore Timestamp for development
const mockTimestamp = {
  toDate: () => new Date("2024-01-15T10:30:00Z"),
  seconds: 1705315800,
  nanoseconds: 0
} as Timestamp;

export const mockProject: Project = {
  id: "project-123",
  name: "My First Groove",
  ownerId: "user-456",
  createdAt: mockTimestamp,
  isPublic: false,
  latestSnapshot: {
    content: {
      tempo: 128,
      tracks: [
        {
          id: "track-1",
          name: "Kick Drum",
          instrument: Instrument.clip,
          volume: 0.8,
          isMuted: false,
          isSolo: false,
          sampleUrl: "https://example.com/samples/kick.wav"
        },
        {
          id: "track-2",
          name: "Hi-Hat",
          instrument: Instrument.clip,
          volume: 0.6,
          isMuted: false,
          isSolo: false,
          sampleUrl: "https://example.com/samples/hihat.wav"
        },
        {
          id: "track-3",
          name: "Bassline",
          instrument: Instrument.clip,
          volume: 0.7,
          isMuted: true,
          isSolo: false,
          sampleUrl: "https://example.com/samples/bass.wav"
        }
      ],
      sections: [
        {
          id: "section-1",
          name: "Intro",
          enabledTrackIds: ["track-1"] // Only kick drum in intro
        },
        {
          id: "section-2",
          name: "Verse",
          enabledTrackIds: ["track-1", "track-2"] // Kick and hi-hat
        },
        {
          id: "section-3",
          name: "Chorus",
          enabledTrackIds: ["track-1", "track-2", "track-3"] // All tracks
        }
      ]
    }
  }
};
