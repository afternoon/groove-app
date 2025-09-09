import { describe, it, expect } from "vitest";
import { Timestamp } from "firebase/firestore";
import type { Project } from "./types";

// Mock Firestore Timestamp for testing
const mockTimestamp = {
  toDate: () => new Date("2024-01-15T10:30:00Z"),
  seconds: 1705315800,
  nanoseconds: 0
} as Timestamp;

describe("Project Types", () => {
  it("should parse raw JavaScript object into Project type", () => {
    // Raw JavaScript object that might come from Firestore
    const rawProjectData = {
      id: "project-123",
      name: "My First Groove",
      ownerId: "user-456",
      createdAt: mockTimestamp,
      isPublic: false,
      latestSnapshot: {
        content: {
          tempo: 125,
          tracks: [
            {
              id: "track-1",
              name: "Kick Drum",
              instrument: {
                type: "clip" as const,
                sampleUrl: "https://example.com/samples/kick.wav",
                sampleTempo: 125
              },
              volume: 0.8,
              isMuted: false,
              isSolo: false
            },
            {
              id: "track-2",
              name: "Hi-Hat",
              instrument: {
                type: "clip" as const,
                sampleUrl: "https://example.com/samples/hihat.wav",
                sampleTempo: 125
              },
              volume: 0.6,
              isMuted: false,
              isSolo: false
            },
            {
              id: "track-3",
              name: "Bass Line",
              instrument: {
                type: "clip" as const,
                sampleUrl: "https://example.com/samples/bass.wav",
                sampleTempo: 122
              },
              volume: 0.7,
              isMuted: true,
              isSolo: false
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

    // TypeScript should accept this as a valid Project
    const project: Project = rawProjectData;

    // Verify the basic project properties
    expect(project.id).toBe("project-123");
    expect(project.name).toBe("My First Groove");
    expect(project.ownerId).toBe("user-456");
    expect(project.isPublic).toBe(false);
    expect(project.createdAt).toBe(mockTimestamp);

    // Verify the project content
    const content = project.latestSnapshot?.content;
    expect(content).toBeDefined();
    expect(content?.tempo).toBe(125);

    // Verify tracks
    const tracks = content?.tracks;
    expect(tracks).toBeDefined();
    expect(tracks).toHaveLength(3);

    const kickTrack = tracks?.[0];
    expect(kickTrack?.name).toBe("Kick Drum");
    expect(kickTrack?.instrument.type).toBe("clip");
    if (kickTrack?.instrument.type === "clip") {
      expect(kickTrack.instrument.sampleUrl).toBe("https://example.com/samples/kick.wav");
      expect(kickTrack.instrument.sampleTempo).toBe(125);
    }
    expect(kickTrack?.volume).toBe(0.8);
    expect(kickTrack?.isMuted).toBe(false);

    const bassTrack = tracks?.[2];
    expect(bassTrack?.name).toBe("Bass Line");
    expect(bassTrack?.isMuted).toBe(true);

    // Verify sections
    const sections = content?.sections;
    expect(sections).toBeDefined();
    expect(sections).toHaveLength(3);

    const introSection = sections?.[0];
    expect(introSection?.name).toBe("Intro");
    expect(introSection?.enabledTrackIds).toEqual(["track-1"]);

    const chorusSection = sections?.[2];
    expect(chorusSection?.name).toBe("Chorus");
    expect(chorusSection?.enabledTrackIds).toEqual(["track-1", "track-2", "track-3"]);
  });

  it("should handle minimal Project data", () => {
    const minimalProjectData = {
      id: "minimal-project",
      ownerId: "user-123",
      createdAt: mockTimestamp,
      isPublic: true
      // No name, no latestSnapshot
    };

    const project: Project = minimalProjectData;

    expect(project.id).toBe("minimal-project");
    expect(project.name).toBeUndefined();
    expect(project.latestSnapshot).toBeUndefined();
    expect(project.isPublic).toBe(true);
  });

  it("should handle empty project content", () => {
    const emptyContentProject = {
      id: "empty-content",
      ownerId: "user-789",
      createdAt: mockTimestamp,
      isPublic: false,
      latestSnapshot: {
        content: {
          // Only tempo, no tracks or sections
          tempo: 120
        }
      }
    };

    const project: Project = emptyContentProject;
    const content = project.latestSnapshot?.content;

    expect(content?.tempo).toBe(120);
    expect(content?.tracks).toBeUndefined();
    expect(content?.sections).toBeUndefined();
  });
});
