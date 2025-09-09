import * as Tone from "tone";
import type { Project, Track, Section } from "../types";

export interface PlayheadUpdateCallback {
  (position: string, bars: number, beats: number, sixteenths: number): void;
}

export class AudioEngine {
  private instruments: Map<string, Tone.Player> = new Map();
  private playheadCallback: PlayheadUpdateCallback | null = null;
  private scheduledEvents: Tone.ToneEvent<string>[] = [];

  constructor() {
    // Set up Tone.Transport
    Tone.Transport.bpm.value = 120;

    // Set up playhead update callback
    this.setupPlayheadUpdater();
  }

  async initialize(): Promise<void> {
    // Start Tone.js audio context if not already started
    if (Tone.context.state !== "running") {
      await Tone.start();
    }
  }

  async loadProject(project: Project): Promise<void> {
    const content = project.latestSnapshot?.content;
    if (!content) {
      throw new Error("Project has no content to load.");
      return;
    }

    // Set tempo
    if (content.tempo) {
      Tone.Transport.bpm.value = content.tempo;
    }

    // Clear existing instruments and events
    this.clearAudioOnly();

    // Load instruments for each track
    if (content.tracks) {
      await this.loadTracks(content.tracks);
    }

    // Schedule sections
    if (content.sections && content.tracks) {
      this.scheduleSections(content.sections, content.tracks);
    }
  }

  private async loadTracks(tracks: Track[]): Promise<void> {
    const loadPromises = tracks
      .filter(track => track.instrument === "clip" && track.clipSampleUrl)
      .map(async (track) => {
        try {
          const player = new Tone.Player(track.clipSampleUrl).toDestination();
          player.volume.value = this.dbFromLinear(track.volume);

          await Tone.loaded();

          player.playbackRate = track.clipSampleTempo
            ? track.clipSampleTempo / Tone.Transport.bpm.value
            : 1;

          this.instruments.set(track.id, player);
        } catch (error) {
          console.warn(`Failed to load sample for track ${track.name}:`, error);
        }
      });

    await Promise.all(loadPromises);
  }

  private scheduleSections(sections: Section[], tracks: Track[]): void {
    let currentBar = 0;

    sections.forEach((section) => {
      const sectionStartTime = `${currentBar}:0:0`;

      // For each enabled track in this section
      section.enabledTrackIds.forEach((trackId) => {
        const track = tracks.find(t => t.id === trackId);
        const instrument = this.instruments.get(trackId);

        if (track && instrument && !track.isMuted && (!this.hasSoloTracks(tracks) || track.isSolo)) {
          // Schedule the clip to play at the start of this section
          const event = new Tone.ToneEvent((time) => {
            instrument.start(time);
          }, sectionStartTime);

          event.start();
          this.scheduledEvents.push(event);
        }
      });

      // Each section is 4 bars
      currentBar += 4;
    });

    // Set transport loop to the total length
    Tone.Transport.loopEnd = `${currentBar}:0:0`;
    Tone.Transport.loop = true;
  }

  private hasSoloTracks(tracks: Track[]): boolean {
    return tracks.some(track => track.isSolo);
  }

  private setupPlayheadUpdater(): void {
    // Use Tone.Transport.scheduleRepeat for smooth playhead updates
    Tone.Transport.scheduleRepeat((time) => {
      if (this.playheadCallback) {
        // Use Tone.Draw to ensure UI updates happen on the main thread
        Tone.Draw.schedule(() => {
          const position = Tone.Transport.position.toString();
          const [bars, beats, sixteenths] = position.split(":").map(Number);
          this.playheadCallback?.(position, bars, beats, sixteenths);
        }, time);
      }
    }, "16n"); // Update every 16th note for smooth movement
  }

  play(): void {
    Tone.Transport.start();
  }

  stop(): void {
    Tone.Transport.stop();
  }

  pause(): void {
    Tone.Transport.pause();
  }

  seekTo(position: string): void {
    Tone.Transport.position = position;
  }

  seekToBar(bar: number): void {
    Tone.Transport.position = `${bar}:0:0`;
  }

  setPlayheadCallback(callback: PlayheadUpdateCallback): void {
    this.playheadCallback = callback;
  }

  getIsPlaying(): boolean {
    return Tone.Transport.state === "started";
  }

  getCurrentPosition(): string {
    return Tone.Transport.position.toString();
  }

  setTempo(bpm: number): void {
    Tone.Transport.bpm.value = bpm;
  }

  private clearAudio(): void {
    // Stop transport and clear scheduled events
    Tone.Transport.stop();
    this.clearAudioOnly();
  }

  private clearAudioOnly(): void {
    this.scheduledEvents.forEach(event => { event.dispose(); });
    this.scheduledEvents = [];

    this.instruments.forEach(instrument => { instrument.dispose(); });
    this.instruments.clear();
  }

  private dbFromLinear(linear: number): number {
    // Convert linear volume (0-1) to decibels
    return linear === 0 ? -Infinity : 20 * Math.log10(linear);
  }

  dispose(): void {
    this.clearAudio();
    this.playheadCallback = null;
  }
}
