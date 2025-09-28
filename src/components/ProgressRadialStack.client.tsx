"use client";

import dynamic from "next/dynamic";
import { useMemo, useEffect, useRef, useState } from "react";

// Dynamic import with SSR disabled to prevent hydration mismatches
const Apex = dynamic(() => import("react-apexcharts"), { 
  ssr: false,
  loading: () => <div className="donut-stack flex items-center justify-center">Loading chart...</div>
});

interface ProgressBuckets {
  earned: number;
  submitted: number;
  missing: number;
  lost: number;
}

interface ProgressRadialStackProps {
  buckets: ProgressBuckets;
  percent: number; // 0..100, already computed from the SAME denominator used for the arcs
  title?: string;
  subtitle?: string;
  className?: string;
  testMode?: boolean;
}

export default function ProgressRadialStack({ 
  buckets, 
  percent, 
  title = "", 
  subtitle = "",
  className = "",
  testMode = false 
}: ProgressRadialStackProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Base options shared by all four charts
  const baseOptions = useMemo(() => ({
    chart: {
      type: 'radialBar' as const,
      height: 200,
      animations: {
        enabled: false, // Disable animations for deterministic layout
      },
      toolbar: {
        show: false
      },
      sparkline: {
        enabled: true
      },
      background: 'transparent',
      fontFamily: 'var(--font-inter), -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif'
    },
    plotOptions: {
      radialBar: {
        startAngle: -135,       // Match original app
        endAngle: 225,
        dataLabels: { 
          show: false  // We use HTML overlay instead
        },
        track: { 
          background: 'transparent', 
          margin: 0, 
          strokeWidth: '100%' 
        },
        hollow: {
          background: 'transparent',
          margin: 0
        }
      }
    },
    stroke: { 
      lineCap: 'round' as const
    },
    labels: [],
    legend: {
      show: false
    },
    tooltip: {
      enabled: false  // We use custom tooltip
    }
  }), []);

  // Four distinct options with different hollow sizes and colors
  const options = useMemo(() => {
    const optsEarned = {
      ...baseOptions,
      plotOptions: {
        radialBar: {
          ...baseOptions.plotOptions.radialBar,
          hollow: {
            ...baseOptions.plotOptions.radialBar.hollow,
            size: '64%'  // Outer ring
          }
        }
      },
      colors: ['#22c55e'] // Green
    };

    const optsSubmitted = {
      ...baseOptions,
      plotOptions: {
        radialBar: {
          ...baseOptions.plotOptions.radialBar,
          hollow: {
            ...baseOptions.plotOptions.radialBar.hollow,
            size: '58%'  // Second ring
          }
        }
      },
      colors: ['#3b82f6'] // Blue
    };

    const optsMissing = {
      ...baseOptions,
      plotOptions: {
        radialBar: {
          ...baseOptions.plotOptions.radialBar,
          hollow: {
            ...baseOptions.plotOptions.radialBar.hollow,
            size: '52%'  // Third ring
          }
        }
      },
      colors: ['#f59e0b'] // Orange
    };

    const optsLost = {
      ...baseOptions,
      plotOptions: {
        radialBar: {
          ...baseOptions.plotOptions.radialBar,
          hollow: {
            ...baseOptions.plotOptions.radialBar.hollow,
            size: '46%'  // Inner ring
          }
        }
      },
      colors: ['#ef4444'] // Red
    };

    return { optsEarned, optsSubmitted, optsMissing, optsLost };
  }, [baseOptions]);

  // Compute series data - single values for each ring
  const series = useMemo(() => ({
    earned: [buckets.earned],
    submitted: [buckets.submitted],
    missing: [buckets.missing],
    lost: [buckets.lost]
  }), [buckets]);

  // Center percentage - clamp to valid range
  const centerPercent = Math.max(0, Math.min(100, Math.round(percent)));

  // Add ResizeObserver safety net
  useEffect(() => {
    if (!containerRef.current) return;
    
    const ro = new ResizeObserver(() => {
      // When size changes after mount, trigger apex redraw
      window.dispatchEvent(new Event("resize"));
    });
    
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Handle mouse events for custom tooltip
  const handleMouseMove = (e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setTooltipPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseEnter = () => {
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  return (
    <div className={`chart-container ${className}`}>
      <div 
        ref={containerRef}
        className="donut-stack"
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Four stacked radial charts */}
        <div className="layer layer-earned">
          <Apex 
            type="radialBar" 
            series={series.earned} 
            options={options.optsEarned}
          />
        </div>
        <div className="layer layer-submitted">
          <Apex 
            type="radialBar" 
            series={series.submitted} 
            options={options.optsSubmitted}
          />
        </div>
        <div className="layer layer-missing">
          <Apex 
            type="radialBar" 
            series={series.missing} 
            options={options.optsMissing}
          />
        </div>
        <div className="layer layer-lost">
          <Apex 
            type="radialBar" 
            series={series.lost} 
            options={options.optsLost}
          />
        </div>

        {/* Center overlay is plain HTML, not Apex dataLabels */}
        <div className="center">
          <div className="value">{centerPercent}%</div>
        </div>

        {/* Custom tooltip DOM */}
        {showTooltip && (
          <div 
            className="tooltip" 
            style={{
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y}px`
            }}
            aria-hidden="true"
          >
            <strong>Points</strong>
            <ul>
              <li>
                <span className="dot earned"/> 
                Earned: {buckets.earned}
              </li>
              <li>
                <span className="dot submitted"/> 
                Submitted: {buckets.submitted}
              </li>
              <li>
                <span className="dot missing"/> 
                Missing: {buckets.missing}
              </li>
              <li>
                <span className="dot lost"/> 
                Lost: {buckets.lost}
              </li>
            </ul>
          </div>
        )}
      </div>
      
      {/* Title and subtitle */}
      {(title || subtitle) && (
        <div className="mt-3 text-center">
          {title && <h3 className="text-sm font-semibold text-gray-900">{title}</h3>}
          {subtitle && <p className="text-xs text-gray-600 mt-1">{subtitle}</p>}
        </div>
      )}
    </div>
  );
}
