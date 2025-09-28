"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

// Dynamic import with SSR disabled to prevent hydration mismatches
const ReactApexChart = dynamic(() => import("react-apexcharts"), { 
  ssr: false,
  loading: () => <div className="chart-container flex items-center justify-center">Loading chart...</div>
});

export interface ProgressRadialProps {
  series: number[];
  labels: string[];
  colors: string[];
  title: string;
  subtitle?: string;
  showPercentage?: boolean;
  showCheckmark?: boolean;
  className?: string;
  testMode?: boolean; // For deterministic testing
}

export default function ProgressRadial({
  series,
  labels,
  colors,
  title,
  subtitle,
  showPercentage = true,
  showCheckmark = false,
  className = "",
  testMode = false
}: ProgressRadialProps) {
  
  const chartOptions = useMemo(() => {
    // const isComplete = series.every(val => val === 100);
    // const centerText = showCheckmark && isComplete ? "✓" : showPercentage ? `${Math.round(series[0] || 0)}%` : "";
    
    return {
      chart: {
        type: 'radialBar' as const,
        height: 200,
        animations: {
          enabled: !testMode, // Disable animations in test mode
          easing: 'easeinout',
          speed: 800,
          animateGradually: {
            enabled: true,
            delay: 150
          },
          dynamicAnimation: {
            enabled: true,
            speed: 350
          }
        },
        toolbar: {
          show: false
        },
        fontFamily: 'var(--font-inter), -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif'
      },
      plotOptions: {
        radialBar: {
          startAngle: -90,
          endAngle: 90,
          track: {
            background: '#f1f5f9',
            strokeWidth: '97%',
            margin: 5,
            shadow: {
              enabled: false
            }
          },
          dataLabels: {
            name: {
              show: false
            },
            value: {
              show: false
            }
          },
          hollow: {
            margin: 0,
            size: '70%'
          }
        }
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'light',
          type: 'horizontal',
          shadeIntensity: 0.5,
          gradientToColors: colors.map(color => `${color}80`),
          inverseColors: false,
          opacityFrom: 0.8,
          opacityTo: 0.6,
          stops: [0, 100]
        }
      },
      colors: colors,
      labels: labels,
      legend: {
        show: false
      },
      tooltip: {
        enabled: true,
        fillSeriesColor: false,
        theme: 'light',
        style: {
          fontSize: '12px',
          fontFamily: 'var(--font-inter), -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif'
        },
        custom: function({ series, seriesIndex, _dataPointIndex, _w }: { series: number[], seriesIndex: number, _dataPointIndex: number, _w: unknown }) {
          const label = labels[seriesIndex] || '';
          const value = series[seriesIndex] || 0;
          return `
            <div class="px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-lg">
              <div class="flex items-center space-x-2">
                <div class="w-3 h-3 rounded-full" style="background-color: ${colors[seriesIndex]}"></div>
                <span class="text-sm font-medium text-gray-900">${label}</span>
              </div>
              <div class="text-sm text-gray-600 mt-1">${value}%</div>
            </div>
          `;
        }
      },
      responsive: [{
        breakpoint: 480,
        options: {
          chart: {
            height: 180
          }
        }
      }]
    };
  }, [series, labels, colors, showPercentage, showCheckmark, testMode]);

  // const centerText = useMemo(() => {
  //   if (showCheckmark && series.every(val => val === 100)) {
  //     return "✓";
  //   }
  //   if (showPercentage) {
  //     return `${Math.round(series[0] || 0)}%`;
  //   }
  //   return "";
  // }, [series, showPercentage, showCheckmark]);

  return (
    <div className={`chart-container ${className}`}>
      <div className="relative">
        <ReactApexChart
          options={chartOptions}
          series={series}
          type="radialBar"
          height={200}
        />
        
        {/* Center text overlay - disabled for now */}
        {/* {centerText && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-2xl font-bold text-gray-900">
              {centerText}
            </div>
          </div>
        )} */}
      </div>
      
      {/* Title and subtitle */}
      <div className="mt-3 text-center">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {subtitle && (
          <p className="text-xs text-gray-600 mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
