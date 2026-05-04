// src/data/zoneMapper.ts
//
// Automatic zone mapping for drone inspection frames.
//
// Each frame captured during a drone flight has a corresponding entry in
// imageCoordinates.json that records the drone's 3-D world position (x, y, z)
// at the moment the photo was taken.
//
// This module uses those coordinates to automatically determine which region of
// the aircraft appears in each image — no hardcoded zone labels needed.
//
// Coordinate system (Unreal Engine / simulation world space):
//   x  →  fore–aft axis  (positive = nose side, negative = tail/rear side)
//   y  →  lateral axis   (positive = left side,  negative = right side)
//   z  →  vertical axis  (negative = below fuselage, positive = above / eye level)
//
// Flight phases visible in imageCoordinates.json:
//   Bottom loop  z ≈ -0.20 m   →  Lower fuselage / underside
//   Transition   z  0.2–1.4 m  →  Rising between loops
//   Middle loop  z ≈  1.60 m   →  Mid fuselage / eye level (hangar scene)
//   Wing pass    z ≈  1.40 m, |y| ≈ 12.5 m  →  Wing surface inspection

import rawCoords from "./imageCoordinates.json";

// ── Types ─────────────────────────────────────────────────────────────────────

interface FrameCoord {
  image: string; // e.g. "frame_00420.png"
  x: number;
  y: number;
  z: number;
}

// ── Coordinate lookup table ───────────────────────────────────────────────────

const COORDS: FrameCoord[] = rawCoords as FrameCoord[];

/** Normalise a filename so both "frame_00420.png" and "frame_00420.jpg" match. */
function normaliseKey(filename: string): string {
  return filename.replace(/\.[^.]+$/, "").toLowerCase();
}

const COORD_MAP = new Map<string, FrameCoord>(
  COORDS.map((entry) => [normaliseKey(entry.image), entry])
);

// ── Zone classification logic ─────────────────────────────────────────────────

/**
 * Classify the fore–aft position of the drone relative to the aircraft.
 *
 * Thresholds derived from the x-range observed in imageCoordinates.json:
 *   Nose side:  x  >  3.0  (drone is forward of the wing root)
 *   Mid body:  -10 < x ≤  3.0
 *   Rear/tail:  x ≤ -10.0
 */
function classifyForeAft(x: number): "Nose" | "Mid" | "Rear" {
  if (x > 3.0) return "Nose";
  if (x > -10.0) return "Mid";
  return "Rear";
}

/**
 * Classify the lateral position of the drone.
 *
 *   Left side:   y  >  1.0
 *   Right side:  y  < -1.0
 *   Centreline: |y| ≤  1.0  (vertical rise / transition frames)
 */
function classifyLateral(y: number): "Left" | "Right" | "Center" {
  if (y > 1.0) return "Left";
  if (y < -1.0) return "Right";
  return "Center";
}

/**
 * Map drone world-space coordinates (x, y, z) to a human-readable aircraft
 * zone label.
 *
 * Decision tree:
 *  1. Wing pass     — z ≈ 1.4 m AND lateral distance |y| ≥ 10 m
 *  2. Lower fuselage — z ≤ 0.2 m  (bottom loop, underside)
 *  3. Mid fuselage   — z ≥ 1.4 m  (middle loop, eye level)
 *  4. Transition     — anything else (vertical climb between loops)
 */
export function mapCoordsToZone(x: number, y: number, z: number): string {
  const foreAft = classifyForeAft(x);
  const lateral = classifyLateral(y);

  // ── Wing pass (drone flew outboard along the wing) ──────────────────────────
  if (z >= 1.3 && Math.abs(y) >= 10.0) {
    const side = y > 0 ? "Left" : "Right";
    return `Wing — ${side}`;
  }

  // ── Lower fuselage / underside (bottom orbital loop) ────────────────────────
  if (z <= 0.2) {
    if (lateral === "Center") {
      // Drone directly below centreline — transitional/nose-on frame
      return `Lower Fuselage — ${foreAft} Centre`;
    }
    return `Lower Fuselage — ${foreAft} ${lateral}`;
  }

  // ── Mid fuselage / eye level (middle orbital loop, hangar scene) ─────────────
  if (z >= 1.4) {
    if (lateral === "Center") {
      return `Mid Fuselage — ${foreAft} Centre`;
    }
    return `Mid Fuselage — ${foreAft} ${lateral}`;
  }

  // ── Transition frames (drone climbing between loops) ─────────────────────────
  return `Fuselage — ${foreAft} ${lateral !== "Center" ? lateral : "Centre"}`;
}

/**
 * Look up a frame filename in imageCoordinates.json and return its zone label.
 *
 * @param imageFile  filename as stored on disk, e.g. "frame_00420.jpg"
 *                   (.png and .jpg variants are both accepted)
 * @returns          zone string, or "Unknown" if the frame has no coordinate entry
 */
export function getZoneForImage(imageFile: string): string {
  const key = normaliseKey(imageFile);
  const entry = COORD_MAP.get(key);
  if (!entry) return "Unknown";
  return mapCoordsToZone(entry.x, entry.y, entry.z);
}
