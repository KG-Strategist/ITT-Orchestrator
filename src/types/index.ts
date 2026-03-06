export interface ConnectivityRequest {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    namespace: string;
  };
  spec: {
    budget_code?: string;
    zero_trust_level?: string;
    source: string;
    destination: string;
    protocol: string;
  };
}

export interface MeltLog {
  type: 'log' | 'status';
  message?: string;
  color?: string;
  status?: string;
}

export interface NodeData {
  label?: string;
  source?: string;
  privacy?: string;
  toolName?: string;
  budget?: string;
  fallbackModel?: string;
  threshold?: string;
  heEnabled?: boolean;
  ldpEnabled?: boolean;
  zkpEnabled?: boolean;
  [key: string]: unknown; // Extensibility for future node types without sacrificing type safety
}
