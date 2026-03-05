import { useState, useEffect } from 'react';

export interface JaegerSpan {
  traceID: string;
  spanID: string;
  parentSpanID?: string;
  operationName: string;
  references: Array<{ refType: string; traceID: string; spanID: string }>;
  startTime: number; // microseconds
  duration: number; // microseconds
  tags: Array<{ key: string; type: string; value: string | number | boolean }>;
  logs: Array<{ timestamp: number; fields: Array<{ key: string; value: string }> }>;
  processID: string;
  warnings: string[] | null;
  status?: 'OK' | 'ERROR';
}

export interface JaegerTrace {
  traceID: string;
  spans: JaegerSpan[];
  processes: Record<string, { serviceName: string; tags: Array<{ key: string; value: string }> }>;
  warnings: string[] | null;
}

export interface SpanSegment {
  operationName: string;
  duration: number;
  startTime: number;
  status: 'OK' | 'ERROR';
  color: string;
  trustScore?: number;
  toolName?: string;
  executionTimeMs?: number;
  modelSelected?: string;
}

/**
 * useJaegerSpans Hook
 *
 * Fetches distributed trace data from Jaeger API and returns structured span information.
 * Used to visualize the AI orchestration pipeline in the frontend.
 *
 * @param traceId - The W3C trace ID to fetch from Jaeger
 * @param jaegerUrl - Base URL of Jaeger API (default: http://localhost:16686)
 * @returns Object with spans, loading state, error, and formatted segments
 */
export const useJaegerSpans = (traceId: string, jaegerUrl: string = 'http://localhost:16686') => {
  const [spans, setSpans] = useState<JaegerSpan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [segments, setSegments] = useState<SpanSegment[]>([]);

  useEffect(() => {
    if (!traceId || traceId === 'undefined') return;

    setLoading(true);
    setError(null);

    const fetchTraces = async () => {
      try {
        const response = await fetch(`${jaegerUrl}/api/traces/${traceId}`);
        if (!response.ok) {
          throw new Error(`Jaeger API returned ${response.status}`);
        }

        const data = (await response.json()) as { data: JaegerTrace[] };
        if (data.data && data.data.length > 0) {
          const trace = data.data[0];
          const traceSpans = trace.spans || [];

          // Sort spans by startTime to get execution order
          const sortedSpans = traceSpans.sort((a, b) => a.startTime - b.startTime);
          setSpans(sortedSpans);

          // Format spans into segments for timeline visualization
          const formattedSegments = sortedSpans.map((span) => formatSpan(span));
          setSegments(formattedSegments);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error fetching traces';
        console.error('Error fetching Jaeger traces:', errorMsg);
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    // Add small delay to allow backend to flush traces to Jaeger
    const timeoutId = setTimeout(fetchTraces, 500);
    return () => clearTimeout(timeoutId);
  }, [traceId, jaegerUrl]);

  return { spans, segments, loading, error };
};

/**
 * Formats a Jaeger span into a displayable segment with colors and extracted metadata
 */
function formatSpan(span: JaegerSpan): SpanSegment {
  const durationMs = span.duration / 1000; // Convert microseconds to milliseconds
  const { color, metadata } = getSpanColorAndMetadata(span.operationName, span.tags);

  const segment: SpanSegment = {
    operationName: span.operationName.replace('::', '\n'),
    duration: durationMs,
    startTime: span.startTime,
    status: span.status || 'OK',
    color,
    ...metadata,
  };

  return segment;
}

/**
 * Determines color and metadata for a span based on operation name
 */
function getSpanColorAndMetadata(
  operationName: string,
  tags: Array<{ key: string; value: string | number | boolean }>
): { color: string; metadata: Record<string, string | number | undefined> } {
  const metadata: Record<string, string | number | undefined> = {};

  // Extract relevant fields from tags
  for (const tag of tags) {
    if (tag.key === 'trust_score') metadata.trustScore = Number(tag.value);
    if (tag.key === 'tool_selected' || tag.key === 'tool_name') metadata.toolName = String(tag.value);
    if (tag.key === 'execution_time_ms') metadata.executionTimeMs = Number(tag.value);
    if (tag.key === 'model_selected') metadata.modelSelected = String(tag.value);
  }

  // Map operation names to colors (SEAG Pillar colors)
  if (
    operationName.includes('SemanticFirewall') ||
    operationName.includes('Firewall') ||
    operationName.includes('firewall')
  ) {
    return { color: 'bg-red-500', metadata: {} };
  }
  if (
    operationName.includes('TinyTransformer') ||
    operationName.includes('analyze_intent') ||
    operationName.includes('analyze')
  ) {
    return { color: 'bg-cyan-500', metadata: {} };
  }
  if (
    operationName.includes('MCPToolRegistry') ||
    operationName.includes('discover_tool') ||
    operationName.includes('tool')
  ) {
    return { color: 'bg-blue-500', metadata };
  }
  if (
    operationName.includes('IronClawSandbox') ||
    operationName.includes('execute_mcp_tool') ||
    operationName.includes('execute')
  ) {
    return { color: 'bg-green-500', metadata };
  }
  if (
    operationName.includes('CostArbitrage') ||
    operationName.includes('evaluate_and_route') ||
    operationName.includes('cost')
  ) {
    return { color: 'bg-yellow-500', metadata };
  }

  // Default color
  return { color: 'bg-gray-500', metadata };
}
