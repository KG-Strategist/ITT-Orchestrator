import { FeatureItem, RoadmapItem, ComparisonMetric } from './types';
import { ShieldAlert, Coins, Brain, Network, Boxes, Globe, LayoutGrid, Lock } from 'lucide-react';

export const HERO_TITLE = "The Secure Enterprise Agent Gateway";
export const HERO_SUBTITLE = "The unified control plane for the Agentic Era. Orchestrate legacy API Gateways, federate domain-specific Agents, and govern the digital nervous system from a single pane of glass.";

export const RFC_NOTICE = "ITT Orchestrator Alpha: Now Onboarding Enterprise Partners";

// Core Platform Features (SEAG + Enterprise Orchestration)
export const PLATFORM_FEATURES: FeatureItem[] = [
  {
    title: "Unified Service Catalog",
    description: "A single view of all digital assets. Discover legacy REST APIs (Kong/Apigee) alongside autonomous AI Agents. Auto-registers 'Shadow AI' into a governed inventory.",
    icon: LayoutGrid
  },
  {
    title: "Legacy Bridge",
    description: "Don't rip and replace. ITT orchestrates your existing API Gateways, exposing legacy banking cores and microservices as semantic tools for your new AI Agents.",
    icon: Boxes
  },
  {
    title: "Federated Governance",
    description: "Manage sovereign domain gateways (Payments, Loans, Risk) through a Central Control Plane. Push global policies (e.g., 'No PII') while allowing local autonomy.",
    icon: Globe
  },
  {
    title: "Semantic Registry",
    description: "Dynamic discovery based on intent. Agents find capabilities ('Who can analyze risk?') rather than hardcoded DNS endpoints, enabling resilient, self-healing workflows.",
    icon: Network
  },
  {
    title: "Behavioral AI Defense",
    description: "The 'Semantic Firewall'. Analyzes the cognitive intent of prompts in real-time to block Social Engineering and Semantic Drift before it hits your models.",
    icon: ShieldAlert
  },
  {
    title: "Economic Arbitrage",
    description: "Smart routing for cost efficiency. Dynamically route tasks between SLMs and LLMs based on complexity, saving 20-40% on inference costs.",
    icon: Coins
  }
];

export const ROADMAP: RoadmapItem[] = [
  {
    phase: "Phase 1",
    title: "Foundation & Core",
    date: "Q4 2025",
    status: "completed",
    details: ["SEAG Framework Definition", "Agent Socket Protocol Core", "Initial Gateway Implementation"]
  },
  {
    phase: "Phase 2",
    title: "Orchestration Alpha",
    date: "Q1 2026",
    status: "active",
    details: ["Unified Control Plane", "Legacy Gateway Connectors (Kong/Apigee)", "Semantic Firewall Beta"]
  },
  {
    phase: "Phase 3",
    title: "SaaS Beta & Federation",
    date: "Q2 2026",
    status: "upcoming",
    details: ["Managed SaaS Platform", "Federated Multi-Tenant Support", "Marketplace for Agent Tools"]
  },
  {
    phase: "Phase 4",
    title: "Enterprise GA",
    date: "Q3 2026",
    status: "upcoming",
    details: ["Full Regulatory Compliance Suite", "Advanced Cost Arbitrage Engine", "Global Edge Deployment"]
  }
];

export const COMPARISON_DATA: ComparisonMetric[] = [
  { feature: "Scope", agentSocket: "Unified Platform (Agents + APIs)", mcp: "Siloed Gateways" },
  { feature: "Governance", agentSocket: "Policy-as-Code (Global Push)", mcp: "Manual Config per Gateway" },
  { feature: "Legacy Support", agentSocket: "Native Orchestration / Bridging", mcp: "Requires Refactoring" },
  { feature: "Discovery", agentSocket: "Semantic (Intent-based)", mcp: "Static (DNS-based)" },
  { feature: "Cost Control", agentSocket: "Model Arbitrage (Market Rate)", mcp: "Pass-through (Premium Rate)" },
  { feature: "Security", agentSocket: "Behavioral (Intent Analysis)", mcp: "Signature (WAF/Regex)" },
];

export const LATENCY_CHART_DATA = [
  { name: 'ITT Gateway', latency: 45, fill: '#38bdf8' },
  { name: 'Legacy Stack', latency: 200, fill: '#94a3b8' },
];