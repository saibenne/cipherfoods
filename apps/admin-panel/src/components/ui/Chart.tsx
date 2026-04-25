interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  color?: string;
  className?: string;
}

export function BarChart({ data, height = 200, color, className = '' }: BarChartProps) {
  if (data.length === 0) return null;
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const barWidth = Math.min(40, Math.floor(600 / data.length) - 12);
  const chartWidth = data.length * (barWidth + 12) + 40;

  return (
    <div className={`overflow-x-auto ${className}`}>
      <svg viewBox={`0 0 ${chartWidth} ${height + 40}`} className="w-full" style={{ minWidth: chartWidth }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
          const y = height - frac * height + 10;
          return (
            <g key={frac}>
              <line x1={35} y1={y} x2={chartWidth} y2={y} stroke="#e5e7eb" strokeWidth={1} />
              <text x={30} y={y + 4} textAnchor="end" className="fill-gray-400" fontSize={10}>
                {Math.round(maxVal * frac).toLocaleString()}
              </text>
            </g>
          );
        })}
        {/* Bars */}
        {data.map((d, i) => {
          const barHeight = (d.value / maxVal) * height;
          const x = 40 + i * (barWidth + 12);
          const y = height - barHeight + 10;
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={4}
                fill={color || undefined}
                className={!color ? (d.color ?? 'fill-brand-500') : undefined}
                opacity={0.85}
              >
                <title>{`${d.label}: ${d.value.toLocaleString()}`}</title>
              </rect>
              <text
                x={x + barWidth / 2}
                y={height + 26}
                textAnchor="middle"
                className="fill-gray-500"
                fontSize={10}
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

interface LineChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  filled?: boolean;
  className?: string;
}

export function LineChart({ data, height = 200, color = '#4f46e5', filled = true, className = '' }: LineChartProps) {
  if (data.length < 2) return null;
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const padding = { top: 10, right: 20, bottom: 30, left: 45 };
  const chartWidth = Math.max(400, data.length * 60);
  const innerW = chartWidth - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const points = data.map((d, i) => ({
    x: padding.left + (i / (data.length - 1)) * innerW,
    y: padding.top + innerH - (d.value / maxVal) * innerH,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = `${linePath} L${points[points.length - 1].x},${padding.top + innerH} L${points[0].x},${padding.top + innerH} Z`;

  return (
    <div className={`overflow-x-auto ${className}`}>
      <svg viewBox={`0 0 ${chartWidth} ${height}`} className="w-full" style={{ minWidth: chartWidth }}>
        {/* Grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
          const y = padding.top + innerH - frac * innerH;
          return (
            <g key={frac}>
              <line x1={padding.left} y1={y} x2={chartWidth - padding.right} y2={y} stroke="#e5e7eb" strokeWidth={1} />
              <text x={padding.left - 5} y={y + 4} textAnchor="end" className="fill-gray-400" fontSize={10}>
                {Math.round(maxVal * frac).toLocaleString()}
              </text>
            </g>
          );
        })}
        {/* Area fill */}
        {filled && (
          <path d={areaPath} fill={color} opacity={0.1} />
        )}
        {/* Line */}
        <path d={linePath} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        {/* Dots + Labels */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={4} fill="white" stroke={color} strokeWidth={2} />
            <text x={p.x} y={height - 5} textAnchor="middle" className="fill-gray-500" fontSize={10}>
              {data[i].label}
            </text>
            <title>{`${data[i].label}: ${data[i].value.toLocaleString()}`}</title>
          </g>
        ))}
      </svg>
    </div>
  );
}

interface DonutChartProps {
  data: { label: string; value: number; color?: string }[];
  colors?: string[];
  size?: number;
  thickness?: number;
  className?: string;
}

export function DonutChart({ data, colors, size = 180, thickness = 28, className = '' }: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return null;

  const cx = size / 2;
  const cy = size / 2;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulated = 0;

  const defaultColors = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];
  const segments = data.map((d, i) => {
    const pct = d.value / total;
    const offset = circumference * (1 - accumulated) + circumference * 0.25;
    accumulated += pct;
    const segColor = d.color || (colors && colors[i]) || defaultColors[i % defaultColors.length];
    return { ...d, color: segColor, pct, dashArray: `${circumference * pct} ${circumference * (1 - pct)}`, offset };
  });

  return (
    <div className={`flex items-center gap-6 ${className}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        {segments.map((seg, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth={thickness}
            strokeDasharray={seg.dashArray}
            strokeDashoffset={seg.offset}
            strokeLinecap="butt"
            className="transition-all duration-500"
          >
            <title>{`${seg.label}: ${seg.value} (${(seg.pct * 100).toFixed(1)}%)`}</title>
          </circle>
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" className="fill-gray-900 text-lg font-bold" fontSize={20}>
          {total.toLocaleString()}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" className="fill-gray-400" fontSize={11}>
          Total
        </text>
      </svg>
      {/* Legend */}
      <div className="flex flex-col gap-2">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="inline-block h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-gray-600">{d.label}</span>
            <span className="ml-auto font-medium text-gray-900">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
