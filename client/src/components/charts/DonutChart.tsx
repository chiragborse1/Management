'use client';

import type { CSSProperties, ReactNode } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';

export interface DonutDatum {
  name: string;
  value: number;
  /** Optional explicit color (any CSS color). Defaults to the theme-aware palette. */
  color?: string;
}

interface DonutChartProps {
  data: DonutDatum[];
  /** Content rendered in the center of the donut (e.g. total + caption). */
  centerLabel?: ReactNode;
  height?: number;
  showLegend?: boolean;
}

/** Theme-aware palette (Tailwind classes, resolved against .dark). */
const PALETTE = [
  { fill: 'fill-primary', dot: 'bg-primary' },
  { fill: 'fill-sky-500 dark:fill-sky-400', dot: 'bg-sky-500 dark:bg-sky-400' },
  { fill: 'fill-emerald-500 dark:fill-emerald-400', dot: 'bg-emerald-500 dark:bg-emerald-400' },
  { fill: 'fill-amber-500 dark:fill-amber-400', dot: 'bg-amber-500 dark:bg-amber-400' },
  { fill: 'fill-violet-500 dark:fill-violet-400', dot: 'bg-violet-500 dark:bg-violet-400' },
  { fill: 'fill-rose-500 dark:fill-rose-400', dot: 'bg-rose-500 dark:bg-rose-400' },
] as const;

const tooltipStyle: CSSProperties = {
  background: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '0.5rem',
  color: 'hsl(var(--foreground))',
  fontSize: '0.75rem',
};

const FALLBACK_ENTRY = { fill: 'fill-primary', dot: 'bg-primary' };

function paletteEntry(index: number): { fill: string; dot: string } {
  return PALETTE[index % PALETTE.length] ?? FALLBACK_ENTRY;
}

export function DonutChart({
  data,
  centerLabel,
  height = 200,
  showLegend = true,
}: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (data.length === 0 || total <= 0) {
    return null;
  }
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-full" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip contentStyle={tooltipStyle} />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="68%"
              outerRadius="100%"
              paddingAngle={2}
              stroke="transparent"
              isAnimationActive={false}
            >
              {data.map((entry, index) => (
                <Cell
                  key={entry.name}
                  className={entry.color ? undefined : paletteEntry(index).fill}
                  fill={entry.color}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {centerLabel !== undefined && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            {centerLabel}
          </div>
        )}
      </div>
      {showLegend && (
        <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1.5">
          {data.map((entry, index) => (
            <li
              key={entry.name}
              className="text-muted-foreground flex items-center gap-1.5 text-xs"
            >
              <span
                aria-hidden="true"
                className={cn(
                  'h-2.5 w-2.5 shrink-0 rounded-sm',
                  entry.color ? undefined : paletteEntry(index).dot
                )}
                style={entry.color ? { backgroundColor: entry.color } : undefined}
              />
              <span className="truncate">{entry.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
