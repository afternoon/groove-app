import * as Tone from "tone";
import type { Project, Track, Section, ClipInstrument, SynthInstrument, SamplerInstrument } from "../types";

export interface PlayheadUpdateCallback {
  (bars: number, beats: number, sixteenths: number): void;
}

export class AudioEngine {
  private project: Project | null = null;
  private playheadUpdateCallback: PlayheadUpdateCallback | null = null;
  private tracks: Track[] = [];
  private instruments: Map<string, Tone.Player> = new Map();
  private isPlaying: boolean = false;

  constructor() {
    this.schedulePlaybackHeadUpdates();
    this.scheduleAudioEvents();
  }

  async initialize(): Promise<void> {
    if (Tone.context.state !== "running") {
      await Tone.start();
    }
  }

  async setProject(project: Project): Promise<void> {
    this.project = project;
    const content = project.latestSnapshot?.content;
    if (!content) {
      throw new Error("Project has no content to load.");
      return;
    }

    if (content.tempo) {
      Tone.Transport.bpm.value = content.tempo;
    }

    if (content.tracks) {
      await this.setTracks(content.tracks);
    }
  }

  private async setTracks(tracks: Track[]): Promise<void> {
    this.tracks = tracks;
    const loadPromises = tracks
      .filter(track => track.instrument.type === "clip")
      .map(async (track) => {
        try {
          const clipInstrument = track.instrument as ClipInstrument;
          const player = new Tone.Player(clipInstrument.sampleUrl).toDestination();
          await Tone.loaded();

          player.playbackRate = clipInstrument.sampleTempo / Tone.Transport.bpm.value;

          this.instruments.set(track.id, player);
        } catch (error) {
          console.warn(`Failed to load sample for track ${track.name}:`, error);
        }
      });

    await Promise.all(loadPromises);
  }

  public setPlayheadUpdateCallback(callback: PlayheadUpdateCallback): void {
    this.playheadUpdateCallback = callback;
  }

  private schedulePlaybackHeadUpdates(): void {
    Tone.Transport.scheduleRepeat((time) => {
      if (this.playheadUpdateCallback) {
        Tone.Draw.schedule(() => {
          const position = Tone.Transport.position.toString();
          const [bars, beats, sixteenths] = position.split(":").map(Number);
          this.playheadUpdateCallback?.(bars, beats, sixteenths);
        }, time);
      }
    }, "16n");
  }

  private scheduleAudioEvents(): void {
    Tone.Transport.scheduleRepeat((time) => {
        this.scheduleNextBar(time);
    }, "1m");
  }

  scheduleNextBar(time: number) {
    const position = Tone.Transport.position.toString();
    const bar = position.split(":").map(Number)[0];
    console.log(`Scheduling bar ${bar}, time ${time}`);

    const currentSection = this.sectionAtBar(bar);
    if (!currentSection) {
      console.log(`No section found at bar ${bar}, song has ended`);
      this.stop();
      return;
    }
    console.log(`Current section: ${currentSection.name} (ID: ${currentSection.id})`);

    this.tracks
      .filter(track => currentSection.enabledTrackIds.includes(track.id))
      .forEach(track => { this.scheduleTrack(track); });
  }

  sectionAtBar(bar: number): Section | null {
    // For simplicity, assume sections are 4 bars long and sequential
    if (!this.project) return null;

    const sections = this.project?.latestSnapshot?.content?.sections;
    return sections ? sections[Math.floor(bar / 4)] || null : null;
  }

  scheduleTrack(track: Track) {
    switch (track.instrument.type) {
      case "clip":
        this.scheduleClipTrack(track);
        break;
      case "synth":
      case "sampler":
      default:
        this.scheduleSequencedTrack(track);
    }
  }

  scheduleClipTrack(track: Track) {
    const instrument = this.instruments.get(track.id);
    if (instrument) {
      instrument.volume.value = this.dbFromLinear(track.volume);
      instrument.playbackRate = (track.instrument as ClipInstrument).sampleTempo / Tone.Transport.bpm.value;
      instrument.start();
    }
  }

  scheduleSequencedTrack(track: Track) {
    const instrumentConfig = track.instrument as SynthInstrument | SamplerInstrument;
    const pattern = instrumentConfig.pattern;
    if (!pattern || pattern.length === 0) {
      return;
    }

    // loop over pattern until we have 16 steps
    const barPattern = Array(16).fill(0).map((_, i) => pattern[i % pattern.length]);
    const instrument = this.instruments.get(track.id);

    barPattern.forEach((step, index) => {
      if (step) {
        const stepTime = `+${index}n`;
        Tone.Transport.schedule((time) => {
          if (instrument) {
            instrument.volume.value = this.dbFromLinear(track.volume);
            instrument.start(time);
          }
        }, stepTime);
      }
    });
  }

  play() {
    if (!this.isPlaying) {
      this.isPlaying = true;
      Tone.start();
      Tone.Transport.start();
      console.log("Playback started");
    }
  }

  pause() {
    if (this.isPlaying) {
      Tone.Transport.pause();
      this.isPlaying = false;
      console.log("Playback paused");
    }
  }

  stop() {
    if (this.isPlaying || Tone.Transport.state === "paused") {
      Tone.Transport.stop();
      Tone.Transport.cancel();
      this.isPlaying = false;
      console.log("Playback stopped");
    }
  }

  jumpTo(bars: number, beats: number, sixteenths: number): void {
    const position = `${bars}:${beats}:${sixteenths}`;
    const wasPlaying = this.isPlaying;

    if (wasPlaying) {
      this.stop();
    }

    Tone.Transport.position = position;

    if (wasPlaying) {
      // If we were playing, restart from the new position
      setTimeout(() => this.play(), 50);
    }

    console.log(`Jumped to position ${position}`);
  }

  setLoop(enabled: boolean, startBar: number, endBar: number): void {
    if (enabled) {
      console.log(`Loop enabled: bars ${startBar} to ${endBar}`);
    } else {
      console.log("Loop disabled");
    }
  }

  private dbFromLinear(linear: number): number {
    // Convert linear volume (0-1) to decibels
    return linear === 0 ? -Infinity : 20 * Math.log10(linear);
  }
}
