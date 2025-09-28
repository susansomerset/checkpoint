import React from 'react';
import Chart from 'react-apexcharts';

export interface HeaderSegment {
  label: string;
  percentage: number;
  color: string;
  points?: number;
}

export interface HeaderChartProps {
  segments: HeaderSegment[];
  centerLabel?: string;
  centerSubLabel?: string;
  centerValue?: string;
  showTooltip?: boolean;
  className?: string;
  courseId?: number;
  onCourseClick?: (courseId: number) => void;
}

const HeaderChart: React.FC<HeaderChartProps> = ({
  segments,
  centerLabel = 'Progress',
  centerSubLabel,
  centerValue,
  showTooltip = true,
  className = '',
  courseId,
  onCourseClick
}) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const size = 150; // 60% of 250px (increased by 20%)

  // Calculate total percentage to ensure it adds up to 100%
  const totalPercentage = segments.reduce((sum, segment) => sum + segment.percentage, 0);
  const normalizedSegments = segments.map(segment => ({
    ...segment,
    percentage: (segment.percentage / totalPercentage) * 100
  }));

  // Calculate angles for each segment
  const totalArcDegrees = 270; // Total arc span (-135 to +135)
  const startAngle = 225; // Starting angle (-135 degrees)
 
  let currentAngle = startAngle;
  const chartConfigs: any[] = [];

  normalizedSegments.forEach((segment, index) => {
    if (segment.percentage > 0) {
    const segmentDegrees = Math.floor((segment.percentage / 100) * totalArcDegrees);
    const segmentStartAngle = currentAngle;
    let segmentEndAngle = currentAngle + segmentDegrees;

    // Handle crossing the 360° boundary
    if (segmentEndAngle >= 360) {
      // Split into two charts
      const firstPartEnd = 360;
      const secondPartStart = 0;
      const secondPartEnd = segmentEndAngle - 360;

      // First part (before 360°)
      chartConfigs.push({
        key: `${segment.label}-part1`,
        options: {
          chart: {
            type: 'radialBar' as const,
            height: size,
            offsetY: 0,
            animations: {
              enabled: false
            }
          },
          plotOptions: {
            radialBar: {
              startAngle: segmentStartAngle,
              endAngle: firstPartEnd,
              track: {
                background: 'transparent',
                strokeWidth: 0,
                margin: -30,
              },
              hollow: {
                margin: 5,
                size: `110%`,
              },
              dataLabels: {
                show: false
              }
            }
          },
          fill: {
            type: 'solid'
          },
          colors: [segment.color],
          series: [100],
          labels: [segment.label],
          legend: {
            show: false
          },
          tooltip: {
            enabled: false
          }
        }
      });

      // Second part (after 360°)
      chartConfigs.push({
        key: `${segment.label}-part2`,
        options: {
          chart: {
            type: 'radialBar' as const,
            height: size,
            offsetY: 0,
            animations: {
              enabled: false
            }
          },
          plotOptions: {
            radialBar: {
              startAngle: secondPartStart,
              endAngle: secondPartEnd,
              track: {
                background: 'transparent',
                strokeWidth: 0,
                margin: -30,
              },
              hollow: {
                margin: 5,
                size: `110%`,
              },
              dataLabels: {
                show: false
              }
            }
          },
          fill: {
            type: 'solid'
          },
          colors: [segment.color],
          series: [100],
          labels: [segment.label],
          legend: {
            show: false
          },
          tooltip: {
            enabled: false
          }
        }
      });

      currentAngle = secondPartEnd;
    } else {
      // Single chart (no boundary crossing)
      chartConfigs.push({
        key: segment.label,
        options: {
          chart: {
            type: 'radialBar' as const,
            height: size,
            offsetY: 0,
            animations: {
              enabled: false
            }
          },
          plotOptions: {
            radialBar: {
              startAngle: segmentStartAngle,
              endAngle: segmentEndAngle,
              track: {
                background: 'transparent',
                strokeWidth: 0,
                margin: -30,
              },
              hollow: {
                margin: 5,
                size: `110%`,
              },
              dataLabels: {
                show: false
              }
            }
          },
          fill: {
            type: 'solid'
          },
          colors: [segment.color],
          series: [100],
          labels: [segment.label],
          legend: {
            show: false
          },
          tooltip: {
            enabled: false
          }
        }
      });

      currentAngle = segmentEndAngle;
    }
  }});

  // Disable ApexCharts dataLabels - we'll handle labels with custom overlays
  if (chartConfigs.length > 0) {
    const lastChart = chartConfigs[chartConfigs.length - 1];
    lastChart.options.plotOptions.radialBar.dataLabels = {
      show: false
    };
  }

  return (
    <div 
      className={`relative group ${className} ${onCourseClick ? 'cursor-pointer' : ''}`} 
      style={{ width: size, height: size }}
      onClick={() => onCourseClick && courseId && onCourseClick(courseId)}
    >
      {/* Render all chart segments */}
      {chartConfigs.map((config) => (
        <div key={config.key} className="absolute inset-0">
          <Chart
            options={config.options}
            series={config.options.series}
            type="radialBar"
            height={size}
          />
        </div>
      ))}

      {/* Tooltip overlay */}
      {showTooltip && (
        <div 
          className="absolute inset-0 cursor-pointer"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="absolute inset-0 bg-transparent hover:bg-gray-100 hover:bg-opacity-10 rounded-full transition-colors duration-200"></div>
        </div>
      )}

      {/* Custom tooltip */}
      {showTooltip && isHovered && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
            <div className="flex flex-col gap-2">
              <div className="text-sm font-semibold text-gray-900 mb-1">Points</div>
              {normalizedSegments.map((segment, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: segment.color }}
                  ></div>
                  <span className="text-sm font-medium text-gray-700">
                    {segment.label}: {segment.points !== undefined ? segment.points : 0}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* layerPerc - positioned at true center of chart area */}
      {centerValue !== '100' && (
        <div 
          className="absolute flex items-end justify-center pointer-events-none z-0"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 'auto',
            height: 'auto'
          }}
        >
        <span className={`text-4xl font-bold tracking-tight transition-colors duration-200 ${isHovered ? 'text-blue-600' : 'text-gray-800'}`}>
          {centerValue || Math.round(totalPercentage)}
        </span>
        <span className={`text-2xl font-bold ml-1 tracking-tight transition-colors duration-200 ${isHovered ? 'text-blue-600' : 'text-gray-800'}`}>
          %
        </span>
        </div>
      )}

      {/* layerCheckmark - green checkmark when value is 100% */}
      {centerValue === '100' && (
        <div 
          className="absolute flex items-center justify-center pointer-events-none z-0"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 'auto',
            height: 'auto'
          }}
        >
          <svg className="w-12 h-12 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}

      {/* All text elements positioned relative to center */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          
          {/* Class name and Teacher name - positioned at 80% of chart height */}
          <div 
            className="text-sm font-bold text-gray-800 leading-none"
            style={{ marginTop: `${size * 0.8}px` }}
          >
            {centerLabel}
            {centerSubLabel && (
              <>
                <br />
                <span className="text-xs text-gray-700 font-normal">{centerSubLabel}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeaderChart;
