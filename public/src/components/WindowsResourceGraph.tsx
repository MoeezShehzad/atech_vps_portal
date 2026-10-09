import React, { useState } from 'react';

export interface WindowsResourceGraphProps {
  data: number[];
  color?: 'blue' | 'purple' | 'amber' | 'emerald' | 'cyan';
  height?: string;
  unit?: string;
  maxLabel?: string;
  minLabel?: string;
  timeLabel?: string;
  label?: string;
}

export default function WindowsResourceGraph({
  data,
  color = 'blue',
  height = 'h-28',
  unit = '%',
  maxLabel = '100%',
  minLabel = '0%',
  timeLabel = '60 seconds',
  label,
}: WindowsResourceGraphProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Ensure minimum valid data points for rendering
  const pointsData = data && data.length > 0 ? data : [0, 0];
  const count = pointsData.length;

  const width = 300;
  const graphHeight = 100;

  // Map samples to coordinates (0 at bottom, 100 at top)
  const points = pointsData.map((val, idx) => {
    const x = (idx / Math.max(1, count - 1)) * width;
    const clamped = Math.max(0, Math.min(100, val));
    // 2px margin from top and bottom to prevent clipping stroke
    const y = graphHeight - (clamped / 100) * 96 - 2;
    return { x, y, val: Math.round(clamped) };
  });

  const lastPoint = points[points.length - 1];

  // SVG Area path string
  const areaPath = `M ${points[0].x.toFixed(1)},${graphHeight} L ${points
    .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' L ')} L ${lastPoint.x.toFixed(1)},${graphHeight} Z`;

  // SVG Line path string
  const linePath = `M ${points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}`;

  // Horizontal grid lines (20, 40, 60, 80)
  const horizontalGrid = [20, 40, 60, 80];

  // Vertical grid lines every 20px (14 internal lines to form square cells)
  const verticalGrid = [
    20, 40, 60, 80, 100, 120, 140, 160, 180, 200, 220, 240, 260, 280,
  ];

  // Theme-aware color palette matching Windows Task Manager
  const colorConfigs = {
    blue: {
      stroke: 'stroke-[#0284c7] dark:stroke-[#38bdf8]',
      fill: 'fill-[#a5d8f3] fill-opacity-70 dark:fill-[#38bdf8] dark:fill-opacity-25',
      dot: 'fill-[#0284c7] dark:fill-[#38bdf8]',
      dotRing: 'stroke-[#0284c7]/40 dark:stroke-[#38bdf8]/40',
      text: 'text-[#0284c7] dark:text-[#38bdf8]',
    },
    purple: {
      stroke: 'stroke-[#7c3aed] dark:stroke-[#c084fc]',
      fill: 'fill-[#ddd6fe] fill-opacity-70 dark:fill-[#c084fc] dark:fill-opacity-25',
      dot: 'fill-[#7c3aed] dark:fill-[#c084fc]',
      dotRing: 'stroke-[#7c3aed]/40 dark:stroke-[#c084fc]/40',
      text: 'text-[#7c3aed] dark:text-[#c084fc]',
    },
    amber: {
      stroke: 'stroke-[#d97706] dark:stroke-[#fbbf24]',
      fill: 'fill-[#fde68a] fill-opacity-70 dark:fill-[#fbbf24] dark:fill-opacity-25',
      dot: 'fill-[#d97706] dark:fill-[#fbbf24]',
      dotRing: 'stroke-[#d97706]/40 dark:stroke-[#fbbf24]/40',
      text: 'text-[#d97706] dark:text-[#fbbf24]',
    },
    emerald: {
      stroke: 'stroke-[#059669] dark:stroke-[#34d399]',
      fill: 'fill-[#a7f3d0] fill-opacity-70 dark:fill-[#34d399] dark:fill-opacity-25',
      dot: 'fill-[#059669] dark:fill-[#34d399]',
      dotRing: 'stroke-[#059669]/40 dark:stroke-[#34d399]/40',
      text: 'text-[#059669] dark:text-[#34d399]',
    },
    cyan: {
      stroke: 'stroke-[#0891b2] dark:stroke-[#22d3ee]',
      fill: 'fill-[#a5f3fc] fill-opacity-70 dark:fill-[#22d3ee] dark:fill-opacity-25',
      dot: 'fill-[#0891b2] dark:fill-[#22d3ee]',
      dotRing: 'stroke-[#0891b2]/40 dark:stroke-[#22d3ee]/40',
      text: 'text-[#0891b2] dark:text-[#22d3ee]',
    },
  };

  const themeColors = colorConfigs[color] || colorConfigs.blue;

  return (
    <div className="w-full relative flex flex-col select-none">
      {/* Outer Graph Container with Windows Task Manager border & grid paper */}
      <div
        className={`w-full ${height} bg-white dark:bg-[#070b14] border border-slate-300 dark:border-slate-800 rounded-lg overflow-hidden relative shadow-2xs group`}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <svg
          viewBox={`0 0 ${width} ${graphHeight}`}
          preserveAspectRatio="none"
          className="w-full h-full block"
        >
          {/* 1. Background Grid Lines (Horizontal) */}
          {horizontalGrid.map((y) => (
            <line
              key={`h-${y}`}
              x1="0"
              y1={y}
              x2={width}
              y2={y}
              className="stroke-slate-200 dark:stroke-slate-800/80"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          ))}

          {/* 2. Background Grid Lines (Vertical) */}
          {verticalGrid.map((x) => (
            <line
              key={`v-${x}`}
              x1={x}
              y1="0"
              x2={x}
              y2={graphHeight}
              className="stroke-slate-200 dark:stroke-slate-800/80"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          ))}

          {/* 3. Filled Wave Area (Windows Task Manager translucent shading) */}
          <path d={areaPath} className={`${themeColors.fill}`} />

          {/* 4. Crisp Top Curve Line */}
          <path
            d={linePath}
            fill="none"
            className={`${themeColors.stroke}`}
            strokeWidth="1.75"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />

          {/* 5. Live Latest Value Dot */}
          {lastPoint && (
            <g>
              <circle
                cx={lastPoint.x}
                cy={lastPoint.y}
                r="4.5"
                fill="none"
                className={themeColors.dotRing}
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
              />
              <circle
                cx={lastPoint.x}
                cy={lastPoint.y}
                r="2.5"
                className={themeColors.dot}
              />
            </g>
          )}

          {/* 6. Hover Crosshair & Point */}
          {hoverIndex !== null && points[hoverIndex] && (
            <g>
              <line
                x1={points[hoverIndex].x}
                y1="0"
                x2={points[hoverIndex].x}
                y2={graphHeight}
                className="stroke-slate-400 dark:stroke-slate-500"
                strokeWidth="1"
                strokeDasharray="2,2"
                vectorEffect="non-scaling-stroke"
              />
              <circle
                cx={points[hoverIndex].x}
                cy={points[hoverIndex].y}
                r="3"
                className={themeColors.dot}
              />
            </g>
          )}

          {/* 7. Outer Border Frame */}
          <rect
            x="0.5"
            y="0.5"
            width={width - 1}
            height={graphHeight - 1}
            fill="none"
            className="stroke-slate-300 dark:stroke-slate-800"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* Interactive Hover Catchers */}
        <div className="absolute inset-0 flex">
          {points.map((pt, idx) => (
            <div
              key={idx}
              className="flex-1 h-full cursor-crosshair"
              onMouseEnter={() => setHoverIndex(idx)}
            />
          ))}
        </div>

        {/* Windows Task Manager Corner Legend Labels */}
        <div className="absolute top-1 left-1.5 pointer-events-none text-[9px] font-mono font-medium text-slate-400/80 dark:text-slate-500/80 leading-none">
          {maxLabel}
        </div>
        <div className="absolute bottom-1 left-1.5 pointer-events-none text-[9px] font-mono font-medium text-slate-400/80 dark:text-slate-500/80 leading-none">
          {minLabel}
        </div>
        <div className="absolute bottom-1 right-1.5 pointer-events-none text-[9px] font-mono font-medium text-slate-400/80 dark:text-slate-500/80 leading-none">
          {timeLabel}
        </div>

        {/* Hover Tooltip Overlay */}
        {hoverIndex !== null && points[hoverIndex] && (
          <div
            className="absolute top-1 right-1.5 bg-slate-900/90 text-white dark:bg-slate-100 dark:text-slate-900 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shadow-sm pointer-events-none border border-slate-700 dark:border-slate-300"
          >
            {points[hoverIndex].val}{unit}
          </div>
        )}
      </div>
    </div>
  );
}
