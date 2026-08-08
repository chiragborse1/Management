'use client';

import type { CSSProperties } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export interface BarTrendDatum {
  label: string;
  value: number;
}

interface BarTrendChartProps {
  data: BarTrendDatum[];
  title?: string;
  /** Display name for the value series (tooltip / axis). */
  valueName?: string;
  /** Optional Y-axis domain, e.g. [0, 5] for star ratings. */
  yDomain?: [number, number];
  /** Tailwind fill class for the bars (theme-aware by default). */
  barClassName?: string;
  height?: number;
}

const axisTick = { fill: 'hsl(var(--muted-foreground))', fontSize: 12 };
const borderStroke = 'hsl(var(--border))';

const tooltipStyle: CSSProperties = {
  background: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '0.5rem',
  color: 'hsl(var(--foreground))',
  fontSize: '0.75rem',
};

export function BarTrendChart({
  data,
  title,
  valueName = 'Value',
  yDomain,
  barClassName = 'fill-primary',
  height = 240,
}: BarTrendChartProps) {
  if (data.length === 0) {
    return null;
  }
  return (
    <div className="w-full">
      {title && <h3 className="text-foreground mb-3 text-sm font-semibold">{title}</h3>}
      <div style={{ height, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid stroke={borderStroke} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              tick={axisTick}
              axisLine={{ stroke: borderStroke }}
              tickLine={false}
              interval={0}
            />
            <YAxis
              tick={axisTick}
              axisLine={false}
              tickLine={false}
              domain={yDomain ?? [0, 'auto']}
              width={44}
            />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'hsl(var(--muted) / 0.4)' }} />
            <Bar
              dataKey="value"
              name={valueName}
              className={barClassName}
              radius={[6, 6, 0, 0]}
              maxBarSize={48}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
