import React from 'react';

export interface FeatureItem {
  title: string;
  description: string;
  icon: React.ElementType;
}

export interface RoadmapItem {
  phase: string;
  title: string;
  date: string;
  status: 'completed' | 'upcoming' | 'active';
  details: string[];
}

export interface ComparisonMetric {
  feature: string;
  agentSocket: string; // Used for "The Nervous System"
  mcp: string; // Used for "The Traffic Cop"
  highlight?: boolean;
}

export enum ArchitectureMode {
  CONTROL_PLANE = 'Control Plane (Cognitive Core)',
  DATA_PLANE = 'Data Plane (Execution Edge)'
}