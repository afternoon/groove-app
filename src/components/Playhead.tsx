import React from "react";
import "./Playhead.css";

interface PlayheadProps {
  bars: number;
  beats: number;
  sixteenths: number;
  totalBars: number;
}

export const Playhead: React.FC<PlayheadProps> = ({ bars, beats, sixteenths, totalBars }) => {
  // Calculate position within the sections area (not including track headers)
  // Each bar has 4 beats, each beat has 4 sixteenths
  const totalSixteenths = totalBars * 4 * 4;
  const currentSixteenths = (bars * 4 * 4) + (beats * 4) + sixteenths;
  const sectionProgress = totalSixteenths > 0 ? (currentSixteenths / totalSixteenths) : 0;

  // Account for the 200px track header column
  // The sections area starts after the track headers (200px)
  const trackHeaderWidth = 200; // px
  const sectionsWidth = totalBars / 4 * 200; // Each section is 4 bars * 200px

  // Position within sections area, then offset by track header width
  const leftPosition = trackHeaderWidth + (sectionProgress * sectionsWidth);

  return (
    <div className="playhead" style={{ left: `${leftPosition}px` }}>
      <div className="playhead-line"></div>
    </div>
  );
};
