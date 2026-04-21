// src/data/demoDetections.ts
//
// Pre-populated inspection findings used immediately when an inspection starts,
// so the Detection View is populated without waiting for the live drone simulation
// to finish.
//
// ── HOW TO SWAP IN REAL MODEL OUTPUT ─────────────────────────────────────────
// When your teammate delivers the YOLO model CSV, parse each row into a
// LiveDetection object and replace the DEMO_DETECTIONS array below.
//
// Expected CSV columns from the model (adjust if your teammate uses different names):
//   id          – unique finding ID, e.g. "D-001"
//   label       – "Crack" | "Dent" | "Corrosion"
//   severity    – "Low" | "Medium" | "High"   (can be derived from confidence)
//   confidence  – float 0–1,  e.g. 0.91
//   zone        – surface zone name, e.g. "Forward Fuselage", "Left Wing", "Nose Cone"
//   timestamp   – local time string, e.g. "09:14:32"
//
// Minimal CSV-to-LiveDetection parser (paste in a script or run inline):
//
//   import Papa from "papaparse";
//   import type { LiveDetection } from "./fleetStore";
//
//   const DEMO_DETECTIONS: LiveDetection[] = Papa.parse(csvText, { header: true })
//     .data.map((row: any, i: number) => ({
//       id:         row.id          ?? `D-${String(i + 1).padStart(3, "0")}`,
//       label:      row.label       as LiveDetection["label"],
//       severity:   row.severity    as LiveDetection["severity"],
//       confidence: parseFloat(row.confidence),
//       zone:       row.zone,
//       timestamp:  row.timestamp   ?? new Date().toLocaleTimeString(),
//     }));
// ─────────────────────────────────────────────────────────────────────────────

import type { LiveDetection } from "./fleetStore";

export const DEMO_DETECTIONS: LiveDetection[] = [
  {
    id:         "D-001",
    label:      "Crack",
    severity:   "High",
    confidence: 0.94,
    zone:       "Forward Fuselage",
    timestamp:  "09:12:07",
  },
  {
    id:         "D-002",
    label:      "Corrosion",
    severity:   "Medium",
    confidence: 0.87,
    zone:       "Left Wing",
    timestamp:  "09:12:41",
  },
  {
    id:         "D-003",
    label:      "Dent",
    severity:   "Low",
    confidence: 0.79,
    zone:       "Nose Cone",
    timestamp:  "09:13:15",
  },
  {
    id:         "D-004",
    label:      "Crack",
    severity:   "High",
    confidence: 0.91,
    zone:       "Right Wing",
    timestamp:  "09:13:52",
  },
  {
    id:         "D-005",
    label:      "Corrosion",
    severity:   "Medium",
    confidence: 0.83,
    zone:       "Aft Fuselage",
    timestamp:  "09:14:28",
  },
  {
    id:         "D-006",
    label:      "Dent",
    severity:   "Medium",
    confidence: 0.76,
    zone:       "Tail Section",
    timestamp:  "09:15:03",
  },
  {
    id:         "D-007",
    label:      "Crack",
    severity:   "Low",
    confidence: 0.71,
    zone:       "Left Wing",
    timestamp:  "09:15:39",
  },
  {
    id:         "D-008",
    label:      "Corrosion",
    severity:   "High",
    confidence: 0.96,
    zone:       "Forward Fuselage",
    timestamp:  "09:16:11",
  },
];
