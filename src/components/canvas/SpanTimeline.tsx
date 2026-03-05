import React from 'react';
import { SpanSegment } from '../hooks/useJaegerSpans';

interface SpanTimelineProps {
  segments: SpanSegment[];
  loading: boolean;
  error: string | null;
}

/**
 * SpanTimeline Component
 *
 * Visualizes OpenTelemetry spans from Jaeger as a horizontal timeline.
 * Shows the orchestration pipeline: Firewall → Analysis → Tool → Execution → Arbitrage
 */
export const SpanTimeline: React.FC<SpanTimelineProps> = ({ segments, loading, error }) => {
  if (loading) {
    return (
      <div className="p-4 bg-slate-900 rounded border border-slate-700">
        <div className="text-slate-400 text-sm">Loading trace data from Jaeger...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-950 rounded border border-red-700">
        <div className="text-red-400 text-sm">Error loading traces: {error}</div>
      </div>
    );
  }

  if (segments.length === 0) {
    return (
      <div className="p-4 bg-slate-900 rounded border border-slate-700">
        <div className="text-slate-400 text-sm">No traces available. Run an orchestration first.</div>
      </div>
    );
  }

  // Calculate total duration for scaling
  const totalDuration = Math.max(...segments.map((s) => s.startTime + s.duration), 1);
  const minStart = Math.min(...segments.map((s) => s.startTime), 0);
  const maxDuration = totalDuration - minStart;

  return (
    <div className="p-4 bg-slate-900 rounded border border-slate-700">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-200">Orchestration Trace Timeline</h3>
        <p className="text-xs text-slate-400 mt-1">Total latency: {(maxDuration / 1000).toFixed(2)}ms</p>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-5 gap-2 mb-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span className="text-slate-400">Firewall</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-cyan-500 rounded"></div>
          <span className="text-slate-400">Analysis</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span className="text-slate-400">Tool</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span className="text-slate-400">Execution</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded"></div>
          <span className="text-slate-400">Arbitrage</span>
        </div>
      </div>

      {/* Timeline bars */}
      <div className="space-y-3">
        {segments.map((segment, idx) => {
          const relativeStart = segment.startTime - minStart;
          const leftPercent = (relativeStart / maxDuration) * 100;
          const widthPercent = (segment.duration / maxDuration) * 100;

          return (
            <div key={idx} className="relative h-8 bg-slate-800 rounded overflow-hidden">
              {/* Background bar */}
              <div
                className={`absolute top-0 h-full ${segment.color} opacity-70 transition-opacity hover:opacity-90 cursor-pointer`}
                style={{
                  left: `${leftPercent}%`,
                  width: `${Math.max(widthPercent, 2)}%`, // Minimum 2% width for visibility
                }}
                title={`${segment.operationName}: ${segment.duration.toFixed(2)}ms`}
              ></div>

              {/* Label */}
              <div className="absolute inset-0 flex items-center px-2 text-xs font-medium text-white pointer-events-none">
                <span className="truncate">{segment.operationName}</span>
              </div>

              {/* Duration label (right side) */}
              <div className="absolute inset-0 flex items-center justify-end pr-2 text-xs text-slate-300 pointer-events-none">
                <span>{segment.duration.toFixed(1)}ms</span>
              </div>

              {/* Metadata tooltip on hover */}
              {(segment.trustScore !== undefined ||
                segment.toolName ||
                segment.executionTimeMs ||
                segment.modelSelected) && (
                <div className="absolute left-0 top-full mt-1 bg-slate-700 border border-slate-600 rounded p-2 text-xs text-slate-200 whitespace-nowrap z-10 hidden group-hover:block">
                  {segment.trustScore !== undefined && <div>Trust Score: {segment.trustScore.toFixed(1)}</div>}
                  {segment.toolName && <div>Tool: {segment.toolName}</div>}
                  {segment.modelSelected && <div>Model: {segment.modelSelected}</div>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-4 p-3 bg-slate-800 rounded text-xs text-slate-300 space-y-1">
        <div>✓ Complete orchestration pipeline executed</div>
        <div>✓ {segments.length} stages traced</div>
        <div>✓ All spans visible in Jaeger at http://localhost:16686</div>
      </div>
    </div>
  );
};
