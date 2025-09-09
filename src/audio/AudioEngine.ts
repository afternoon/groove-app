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
    this.setupAudioScheduler();
    this.setupPlayheadUpdater();
  }

  async initialize(): Promise<void> {
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

    if (content.tempo) {
      Tone.Transport.bpm.value = content.tempo;
    }

    if (content.tracks) {
      await this.loadTracks(content.tracks);
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

  public setPlayheadCallback(callback: PlayheadUpdateCallback): void {
    this.playheadCallback = callback;
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

  private setupAudioScheduler(): void {
    Tone.Transport.scheduleRepeat((time) => {
        this.scheduleUpcoming(time);
    }, "16n");
  }

  scheduleUpcoming(_currentTime) {
    const currentPosition = Tone.Transport.position;
    const currentBars = this.positionToBars(currentPosition);
    const currentBarInt = Math.floor(currentBars);

    // Schedule the next window when we cross bar boundaries
    if (currentBarInt >= this.nextScheduleTime) {
      this.clearOldEvents(currentBarInt);
      this.scheduleWindow(currentBarInt);
      this.nextScheduleTime = currentBarInt + this.lookAheadBars;
      console.log(`Bar boundary crossed - scheduled from bar ${currentBarInt}`);
    }
  }

  scheduleWindow(fromBar) {
    const toBar = fromBar + this.lookAheadBars;
    console.log(`Scheduling window: bars ${fromBar} to ${toBar}`);

    for (let bar = Math.floor(fromBar); bar < Math.ceil(toBar); bar++) {
      // Handle loop boundaries
      let actualBar = bar;
      if (this.loopEnabled) {
        if (bar >= this.loopEnd) {
          actualBar = this.loopStart + ((bar - this.loopStart) % (this.loopEnd - this.loopStart));
        }
      }

      this.scheduleBar(bar, actualBar);
    }
  }

  scheduleBar(schedulingBar, contentBar) {
    Object.entries(this.tracks).forEach(([trackName, track]) => {
      // Check if this track should play at this bar
      if (contentBar % track.loopLength === 0) {
        this.scheduleTrackForBar(trackName, track, schedulingBar, contentBar);
      }
    });
  }

  scheduleTrackForBar(trackName, track, schedulingBar, contentBar) {
    const barTime = `${schedulingBar}:0:0`;

    if (track.type === "stepSequencer") {
      track.pattern.forEach((step, index) => {
        if (step) {
          const stepTime = `${schedulingBar}:${Math.floor(index / 4)}:${index % 4}`;
          const eventId = `${trackName}-${schedulingBar}-${index}`;

          if (!this.scheduledEvents.has(eventId)) {
            Tone.Transport.schedule((time) => {
              track.instrument.triggerAttackRelease(track.note, "16n", time);
            }, stepTime);
            this.scheduledEvents.add(eventId);
          }
        }
      });
    } else if (track.type === "clip") {
      // Trigger notes every beat for the duration of the loop
      for (let beat = 0; beat < 4 * track.loopLength; beat++) {
        const noteIndex = beat % track.notes.length;
        const stepTime = `${schedulingBar + Math.floor(beat / 4)}:${beat % 4}:0`;
        const eventId = `${trackName}-${schedulingBar}-${beat}`;
        const instrument = this.instruments.get(trackId);

        if (!this.scheduledEvents.has(eventId)) {
          Tone.Transport.schedule((time) => {
            instrument.start(time);
          }, stepTime);
          this.scheduledEvents.add(eventId);
        }
      }
    } else if (track.type === "sequenced") {
      // Trigger notes every half beat for melodic patterns
      for (let step = 0; step < 8 * track.loopLength; step++) {
        const noteIndex = step % track.notes.length;
        const stepTime = `${schedulingBar + Math.floor(step / 8)}:${Math.floor((step % 8) / 2)}:${(step % 2) * 2}`;
        const eventId = `${trackName}-${schedulingBar}-${step}`;

        if (!this.scheduledEvents.has(eventId)) {
          Tone.Transport.schedule((time) => {
            track.instrument.triggerAttackRelease(track.notes[noteIndex], "8n", time);
          }, stepTime);
          this.scheduledEvents.add(eventId);
        }
      }
    }
  }

  clearOldEvents(currentBar) {
    // Remove events that are more than 1 bar behind current position
    const cutoffBar = currentBar - 1;
    const eventsToRemove = [];

    this.scheduledEvents.forEach(eventId => {
      const barFromId = parseInt(eventId.split("-")[1]);
      if (barFromId < cutoffBar) {
        eventsToRemove.push(eventId);
      }
    });

    eventsToRemove.forEach(eventId => {
      this.scheduledEvents.delete(eventId);
    });

    if (eventsToRemove.length > 0) {
      console.log(`Cleaned up ${eventsToRemove.length} old events`);
    }
  }

  positionToBars(position) {
    // Convert Tone.js position (bars:beats:sixteenths) to decimal bars
    const parts = position.split(":");
    const bars = parseInt(parts[0]);
    const beats = parseInt(parts[1]);
    const sixteenths = parseInt(parts[2]);
    return bars + beats/4 + sixteenths/16;
  }

  barsToPosition(bars) {
    const wholeBars = Math.floor(bars);
    const remainder = bars - wholeBars;
    const beats = Math.floor(remainder * 4);
    const sixteenths = Math.floor((remainder * 4 - beats) * 4);
    return `${wholeBars}:${beats}:${sixteenths}`;
  }

  play() {
    if (!this.isPlaying) {
      Tone.start();
      this.isPlaying = true;

      // Schedule initial window from current position
      const currentBars = this.positionToBars(Tone.Transport.position);
      this.scheduleWindow(currentBars);
      this.nextScheduleTime = currentBars + this.lookAheadBars;

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
      Tone.Transport.cancel(); // Clear all scheduled events
      this.scheduledEvents.clear();
      this.nextScheduleTime = 0;
      this.isPlaying = false;
      console.log("Playback stopped, all events cleared");
    }
  }

  jumpTo(bars, beats, sixteenths) {
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

  setLoop(enabled, startBar, endBar) {
    this.loopEnabled = enabled;
    this.loopStart = startBar;
    this.loopEnd = endBar;

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
