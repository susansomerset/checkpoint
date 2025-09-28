// app/components/HeaderChart.tsx
// Stacked single-ring radial: base track + one chart per segment (Earned, Submitted, Missing, Lost)
// Fixes:
// - Orientation via ANGLE_OFFSET_DEG (set to match original)
// - Center % = total - Missing (i.e., Earned + Submitted + Lost), clamped 0..100
// - Contiguous segments across the full 270° arc
// - Deterministic layout (no SSR, waits for document.fonts.ready)

"use client";

import React, { useMemo, useState, useEffect } from "react";
import dynamic from "next/dynamic";

const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export interface HeaderSegment {
  label: string;          // "Earned" | "Submitted" | "Missing" | "Lost"
  color: string;          // color for the segment
  // Provide either points or percentage; points preferred for correctness.
  points?: number;        // raw points for this bucket
  percentage?: number;    // 0..100 if points are not available
}

export interface HeaderChartProps {
  segments: HeaderSegment[];   // four buckets
  centerLabel?: string;        // course
  centerSubLabel?: string;     // teacher
  centerValueOverride?: number;// 0..100 to force a specific center value (optional)
  showTooltip?: boolean;
  className?: string;
  sizePx?: number;             // outer width/height of the square container
}

/** Core geometry — original used a 270° sweep. */
const ARC_SWEEP_DEG = 270;

/**
 * Rotate the entire ring to match the original visual origin.
 * Positive values rotate clockwise.
 * If your current render is ~90° ahead, set -90; if ~90° behind, set +90.
 * Tweak by ±15° if the gaps/joins need micro-alignment with the original.
 */
const ANGLE_OFFSET_DEG = -90;

/** Base start/end after rotation */
const START_ANGLE = -135 + ANGLE_OFFSET_DEG;
const END_ANGLE = START_ANGLE + ARC_SWEEP_DEG;

export default function HeaderChart({
  segments,
  centerLabel,
  centerSubLabel,
  centerValueOverride,
  showTooltip = true,
  className = "",
  sizePx = 240,
}: HeaderChartProps) {
  const [hover, setHover] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);

  useEffect(() => {
    const ready = (document as unknown as { fonts?: { ready?: Promise<void> } })?.fonts?.ready;
    if (ready?.then) ready.then(() => setFontsReady(true));
    else setFontsReady(true);
  }, []);

  // Normalize to a single consistent basis (points preferred).
  const buckets = useMemo(() => {
    // Try points first; if any are missing, fall back to percentages.
    const hasPoints = segments.every(s => typeof s.points === "number");
    if (hasPoints) {
      const totalPts = Math.max(
        0,
        segments.reduce((a, s) => a + (s.points || 0), 0)
      );
      const safe = totalPts > 0 ? totalPts : 1; // avoid divide by zero later
      return segments.map(s => ({
        label: s.label,
        color: s.color,
        points: s.points || 0,
        pct: Math.max(0, (s.points || 0) / safe * 100),
      }));
    }
    // Percentage fallback
    const clamped = segments.map(s => ({
      label: s.label,
      color: s.color,
      points: undefined,
      pct: Math.max(0, Math.min(100, s.percentage || 0)),
    }));
    const sumPct = clamped.reduce((a, s) => a + s.pct, 0) || 1;
    // Renormalize so the ring is contiguous
    return clamped.map(s => ({ ...s, pct: (s.pct / sumPct) * 100 }));
  }, [segments]);

  // Find bucket helpers (case-insensitive)
  const pctOf = (name: string) =>
    buckets.find(s => s.label.toLowerCase() === name.toLowerCase())?.pct || 0;

  // const pointsOf = (name: string) =>
  //   segments.find(s => s.label.toLowerCase() === name.toLowerCase())?.points ?? undefined;

  // CENTER % RULE: "turned-in" = everything EXCEPT Missing  →  (total - Missing) / total
  const centerPct = useMemo(() => {
    if (typeof centerValueOverride === "number") {
      return clamp0to100(Math.round(centerValueOverride));
    }
    const totalPct = buckets.reduce((a, s) => a + s.pct, 0) || 1; // should be 100 after our renorm
    const missingPct = pctOf("Missing");
    const turnedIn = totalPct - missingPct; // includes Earned + Submitted + Lost
    return clamp0to100(Math.round(turnedIn));
  }, [buckets, centerValueOverride, pctOf]);

  // Build contiguous angle spans for each normalized segment (sum near 100).
  const spans = useMemo(() => {
    let cursor = START_ANGLE;
    return buckets
      .filter(b => b.pct > 0.0001)
      .map(b => {
        const deg = (b.pct / 100) * ARC_SWEEP_DEG;
        const start = cursor;
        const end = start + deg;
        cursor = end;
        return { ...b, startAngle: start, endAngle: end };
      });
  }, [buckets]);

  // Shared, deterministic base options
  const base = useMemo(
    () => ({
      chart: {
        type: "radialBar" as const,
        background: "transparent",
        animations: { enabled: false },
        sparkline: { enabled: true },
        toolbar: { show: false }
      },
      plotOptions: {
        radialBar: {
          startAngle: START_ANGLE,
          endAngle: END_ANGLE,
          hollow: { size: "66%", margin: 0, background: "transparent" },
          track: { background: "transparent", strokeWidth: "100%", margin: 0 },
          dataLabels: { show: false }
        }
      },
      stroke: { lineCap: "round" },
      legend: { show: false },
      tooltip: { enabled: false }
    }),
    []
  );

  // Base grey track (full span)
  const trackOptions = useMemo(
    () => ({
      ...base,
      plotOptions: {
        radialBar: {
          ...base.plotOptions.radialBar,
          startAngle: START_ANGLE,
          endAngle: END_ANGLE,
          track: { background: "#ECEFF3", strokeWidth: "100%", margin: 0 }
        }
      },
      colors: ["rgba(0,0,0,0)"],
      fill: { opacity: 0 },
      series: [100]
    }),
    [base]
  );

  // One layer per bucket; each draws a full 100% within its own angle span
  const layerOptions = useMemo(
    () =>
      spans.map(sp => ({
        key: `${sp.label}-${sp.startAngle.toFixed(2)}-${sp.endAngle.toFixed(2)}`,
        options: {
          ...base,
          plotOptions: {
            radialBar: {
              ...base.plotOptions.radialBar,
              startAngle: sp.startAngle,
              endAngle: sp.endAngle,
              track: { background: "transparent", strokeWidth: "100%", margin: 0 }
            }
          },
          colors: [sp.color],
          series: [100]
        }
      })),
    [base, spans]
  );

  if (!fontsReady) return <div style={{ width: sizePx, height: sizePx }} className={className} />;

  return (
    <div
      className={`relative ${className}`}
      style={{ width: sizePx, height: sizePx }}
      onMouseEnter={() => showTooltip && setHover(true)}
      onMouseLeave={() => showTooltip && setHover(false)}
    >
      {/* Base track */}
      <div className="absolute inset-0">
        <ApexChart type="radialBar" options={trackOptions} series={trackOptions.series} height={sizePx} />
      </div>

      {/* Colored segments */}
      {layerOptions.map(l => (
        <div key={l.key} className="absolute inset-0">
          <ApexChart type="radialBar" options={l.options} series={l.options.series} height={sizePx} />
        </div>
      ))}

      {/* Center percentage (HTML) */}
      <div className="absolute pointer-events-none grid place-items-center" style={{ inset: 0 }}>
        <div className="text-center leading-none">
          <div className="font-extrabold text-4xl text-slate-800">{centerPct}%</div>
        </div>
      </div>

      {/* Labels below */}
      {(centerLabel || centerSubLabel) && (
        <div
          className="absolute w-full text-center pointer-events-none"
          style={{ left: 0, right: 0, bottom: -Math.round(sizePx * 0.12) }}
        >
          {centerLabel && <div className="font-semibold text-sm text-slate-900">{centerLabel}</div>}
          {centerSubLabel && <div className="text-xs text-slate-600">{centerSubLabel}</div>}
        </div>
      )}

      {/* Tooltip */}
      {showTooltip && hover && (
        <div
          className="absolute z-10 bg-white border border-slate-200 rounded-lg shadow-md px-3 py-2"
          style={{ left: "50%", top: Math.round(sizePx * 0.06), transform: "translateX(-50%)" }}
          role="dialog"
          aria-label="Points breakdown"
        >
          <div className="text-[13px] font-semibold mb-1 text-slate-900">Points</div>
          <ul className="space-y-1">
            {["Earned", "Submitted", "Missing", "Lost"].map(name => {
              const seg = segments.find(s => s.label.toLowerCase() === name.toLowerCase());
              if (!seg) return null;
              return (
                <li key={name} className="flex items-center gap-2 text-[13px] text-slate-700">
                  <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
                  <span className="font-medium">{name}:</span>
                  <span>
                    {typeof seg.points === "number" ? seg.points : `${Math.round(buckets.find(b => b.label.toLowerCase() === name.toLowerCase())?.pct || 0)}%`}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function clamp0to100(n: number) {
  return Math.max(0, Math.min(100, n));
}
