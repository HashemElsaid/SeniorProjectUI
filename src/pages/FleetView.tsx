// src/pages/FleetView.tsx
import React from "react";
import { FLEET, getAircraftFlights, getUnresolvedCount, getZoneRecurrences } from "../data/fleetStore";
import type { Aircraft, AircraftStatus } from "../data/fleetStore";
import type { User } from "../data/authStore";
import type { AppPage } from "../components/Sidebar";
import { colors, radius, spacing } from "../ui/tokens";

interface Props {
  selectedAircraftId: string;
  onSelectAircraft: (id: string) => void;
  onNavigate: (p: AppPage) => void;
  /** When a Pilot clicks "Start Inspection", navigate to briefing for this aircraft */
  onStartInspection: (id: string) => void;
  user: User;
}

export default function FleetView({
  selectedAircraftId, onSelectAircraft, onNavigate, onStartInspection, user,
}: Props) {
  const activeCount = FLEET.filter((a) => a.status === "Active").length;
  const maintenanceCount = FLEET.filter((a) => a.status === "In Maintenance").length;
  const groundedCount = FLEET.filter((a) => a.status === "Grounded").length;
  const totalUnresolved = FLEET.reduce((sum, a) => sum + getUnresolvedCount(a.id), 0);

  const isPilot = user.role === "Pilot";
  const isAnalyst = user.role === "Analyst";
  const isManager = user.role === "Fleet Manager";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: spacing.lg }}>
      {/* Header */}
      <div style={headerRow}>
        <div>
          <h1 style={pageTitle}>Fleet Overview</h1>
          <p style={pageSubtitle}>
            {isPilot && "Select an aircraft to begin a drone inspection mission"}
            {isAnalyst && "Browse the fleet and review inspection history"}
            {isManager && "Full fleet status · all aircraft and inspection data"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <StatPill label="Total" value={String(FLEET.length)} tone="neutral" />
          <StatPill label="Active" value={String(activeCount)} tone="success" />
          <StatPill label="In Maintenance" value={String(maintenanceCount)} tone="warn" />
          <StatPill label="Grounded" value={String(groundedCount)} tone="danger" />
          <StatPill label="Open Findings" value={String(totalUnresolved)} tone="info" />
        </div>
      </div>

      {/* Grid */}
      <div style={grid} className="fleet-grid">
        {FLEET.map((aircraft) => (
          <AircraftCard
            key={aircraft.id}
            aircraft={aircraft}
            selected={aircraft.id === selectedAircraftId}
            user={user}
            onSelect={() => {
              onSelectAircraft(aircraft.id);
            }}
            onStartInspection={() => {
              onSelectAircraft(aircraft.id);
              onStartInspection(aircraft.id);
            }}
            onViewHistory={() => {
              onSelectAircraft(aircraft.id);
              onNavigate("history");
            }}
            onViewLive={() => {
              onSelectAircraft(aircraft.id);
              onNavigate("live");
            }}
          />
        ))}
      </div>

      <style>{css}</style>
    </div>
  );
}

// ── Aircraft Card ─────────────────────────────────────────────────────────────

function AircraftCard({
  aircraft, selected, user,
  onSelect, onStartInspection, onViewHistory, onViewLive,
}: {
  aircraft: Aircraft;
  selected: boolean;
  user: User;
  onSelect: () => void;
  onStartInspection: () => void;
  onViewHistory: () => void;
  onViewLive: () => void;
}) {
  const flights = getAircraftFlights(aircraft.id);
  const recurrences = getZoneRecurrences(aircraft.id);
  const unresolvedCount = getUnresolvedCount(aircraft.id);
  const lastFlight = flights[0] ?? null;

  const statusColor = statusColors[aircraft.status];
  const canInspect = aircraft.status === "Active";
  const isPilot = user.role === "Pilot";
  const isAnalyst = user.role === "Analyst";
  const isManager = user.role === "Fleet Manager";

  return (
    <div
      onClick={onSelect}
      style={{
        ...cardBase,
        borderColor: selected ? "rgba(59,130,246,0.45)" : "rgba(255,255,255,0.09)",
        background: selected ? "rgba(59,130,246,0.06)" : "rgba(255,255,255,0.025)",
        cursor: "pointer",
      }}
    >
      {/* Registration + status */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: colors.textPrimary, letterSpacing: "0.8px", marginBottom: 2 }}>
            {aircraft.registration}
          </div>
          <div style={{ fontSize: 13, color: colors.textSecondary }}>{aircraft.model}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.30)", marginTop: 2 }}>
            {aircraft.airline} · Mfg. {aircraft.manufactureYear}
          </div>
        </div>
        <div style={{ ...statusBadge, background: `${statusColor}18`, borderColor: `${statusColor}40`, color: statusColor }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: statusColor }} />
          {aircraft.status}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
        <MiniStat label="Inspections" value={String(flights.length)} />
        <MiniStat label="Open Findings" value={String(unresolvedCount)} warn={unresolvedCount > 0} />
        <MiniStat label="Flight Hours" value={aircraft.totalFlightHours.toLocaleString()} />
      </div>

      {/* Recurrence alert */}
      {recurrences.length > 0 && (
        <div style={recurrenceAlert}>
          ⚠ {recurrences.length} recurring zone{recurrences.length > 1 ? "s" : ""} detected
        </div>
      )}

      {/* Last inspection */}
      {lastFlight && (
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 12 }}>
          Last inspection: {new Date(lastFlight.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {/* Pilot: Start Inspection */}
        {(isPilot || isManager) && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onStartInspection(); }}
            disabled={!canInspect}
            title={!canInspect ? `Cannot inspect — aircraft is ${aircraft.status}` : ""}
            style={{ ...actionBtn, ...primaryActionBtn, opacity: canInspect ? 1 : 0.45 }}
          >
            Start Inspection
          </button>
        )}

        {/* Analyst / Manager: View History */}
        {(isAnalyst || isManager) && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onViewHistory(); }}
            style={{ ...actionBtn, ...secondaryActionBtn }}
          >
            View History
          </button>
        )}

        {/* Manager only: jump to Live */}
        {isManager && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onViewLive(); }}
            style={{ ...actionBtn, ...liveActionBtn }}
          >
            Live
          </button>
        )}
      </div>
    </div>
  );
}

// ── Tiny sub-components ───────────────────────────────────────────────────────

function MiniStat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div style={{ padding: "8px 10px", borderRadius: radius.sm, background: "rgba(255,255,255,0.03)", border: `1px solid ${colors.border}` }}>
      <div style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: warn ? colors.warning : colors.textPrimary }}>{value}</div>
    </div>
  );
}

function StatPill({ label, value, tone }: { label: string; value: string; tone: "success" | "warn" | "danger" | "info" | "neutral" }) {
  const map = {
    success: { bg: "rgba(61,220,151,0.10)", border: "rgba(61,220,151,0.28)", color: colors.success },
    warn: { bg: "rgba(247,201,72,0.10)", border: "rgba(247,201,72,0.28)", color: colors.warning },
    danger: { bg: "rgba(255,92,115,0.10)", border: "rgba(255,92,115,0.28)", color: colors.danger },
    info: { bg: "rgba(59,130,246,0.10)", border: "rgba(59,130,246,0.28)", color: colors.primary },
    neutral: { bg: "rgba(255,255,255,0.06)", border: "rgba(255,255,255,0.12)", color: colors.textSecondary },
  } as const;
  const s = map[tone];
  return (
    <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", padding: "6px 12px", borderRadius: radius.pill, border: `1px solid ${s.border}`, background: s.bg, gap: 2 }}>
      <span style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{value}</span>
      <span style={{ fontSize: 11, color: colors.textSecondary, whiteSpace: "nowrap" }}>{label}</span>
    </span>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const statusColors: Record<AircraftStatus, string> = {
  Active: colors.success,
  "In Maintenance": colors.warning,
  Grounded: colors.danger,
};

const headerRow: React.CSSProperties = {
  display: "flex", justifyContent: "space-between",
  alignItems: "flex-end", gap: spacing.lg, flexWrap: "wrap",
};

const pageTitle: React.CSSProperties = { margin: 0, fontSize: 26, fontWeight: 700, color: colors.textPrimary };
const pageSubtitle: React.CSSProperties = { margin: "4px 0 0", fontSize: 14, color: colors.textSecondary };

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: spacing.lg,
};

const cardBase: React.CSSProperties = {
  borderRadius: radius.lg,
  border: "1px solid",
  padding: spacing.lg,
  transition: "border-color 0.15s, background 0.15s",
};

const statusBadge: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 5,
  padding: "4px 10px", borderRadius: radius.pill, border: "1px solid",
  fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0,
};

const recurrenceAlert: React.CSSProperties = {
  fontSize: 12, fontWeight: 600,
  color: colors.warning,
  background: "rgba(247,201,72,0.08)",
  border: "1px solid rgba(247,201,72,0.22)",
  borderRadius: radius.sm,
  padding: "6px 10px",
  marginBottom: 10,
};

const actionBtn: React.CSSProperties = {
  flex: 1, padding: "8px 12px", borderRadius: 10,
  border: "1px solid", cursor: "pointer",
  fontSize: 12, fontWeight: 700,
  fontFamily: "inherit",
  transition: "opacity 0.15s",
};

const primaryActionBtn: React.CSSProperties = {
  background: "rgba(61,220,151,0.12)",
  borderColor: "rgba(61,220,151,0.35)",
  color: colors.success,
};

const secondaryActionBtn: React.CSSProperties = {
  background: "rgba(59,130,246,0.10)",
  borderColor: "rgba(59,130,246,0.30)",
  color: colors.primary,
};

const liveActionBtn: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  borderColor: "rgba(255,255,255,0.15)",
  color: colors.textSecondary,
  flex: "0 0 auto",
};

const css = `
  @media (max-width: 1200px) { .fleet-grid { grid-template-columns: repeat(2, 1fr) !important; } }
  @media (max-width: 700px)  { .fleet-grid { grid-template-columns: 1fr !important; } }
`;
