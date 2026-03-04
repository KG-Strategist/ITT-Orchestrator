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
