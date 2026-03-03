import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api, apiEndpoints } from '../api/client';

export type ApiCategory = 'system' | 'process' | 'experience';

export interface API_Registry_Object {
  id: string;
  name: string;
  category: ApiCategory;
  specLink: string;
  semanticTags: string[];
  authProtocol: string;
  status: 'Active' | 'Degraded' | 'Offline';
  dependsOn: string[]; // IDs of APIs this depends on (for Knowledge Graph)
  integrationId: string;
}

export interface Integration {
  id: string;
  name: string;
  type: string;
  subtype: string;
  vaultPath: string;
  status: 'connected' | 'disconnected' | 'scanning';
}

export interface Agent_DAG_Node {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: any;
}

export interface Agent_DAG_Edge {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
  style?: any;
}

interface OrchestratorState {
  integrations: Integration[];
  apiRegistry: API_Registry_Object[];
  isScanning: boolean;
  fetchIntegrations: () => Promise<void>;
  fetchApiRegistry: () => Promise<void>;
  addIntegration: (integration: Omit<Integration, 'id' | 'status'>) => Promise<void>;
  deleteApi: (id: string) => Promise<void>;
  generateAgentDAG: (prompt: string) => Promise<{ nodes: Agent_DAG_Node[], edges: Agent_DAG_Edge[], fallbackMessage?: string }>;
}

export const useOrchestratorStore = create<OrchestratorState>()(
  persist(
    (set, get) => ({
      integrations: [],
      apiRegistry: [],
      isScanning: false,

      fetchIntegrations: async () => {
        try {
          const data = await api.get(apiEndpoints.integrations.list);
          set({ integrations: data });
        } catch (e) {
          console.error("Failed to fetch integrations", e);
        }
      },

      fetchApiRegistry: async () => {
        try {
          const data = await api.get(apiEndpoints.registry.list);
          set({ apiRegistry: data });
        } catch (e) {
          console.error("Failed to fetch registry", e);
        }
      },

      addIntegration: async (integrationData) => {
        set({ isScanning: true });
        try {
          const response = await api.post(apiEndpoints.integrations.list, integrationData);
          
          set((state) => ({
            integrations: [...state.integrations, response.integration],
            apiRegistry: [...state.apiRegistry, ...response.discoveredApis],
            isScanning: false
          }));
        } catch (e) {
          console.error("Failed to add integration", e);
          set({ isScanning: false });
        }
      },

      deleteApi: async (id) => {
        try {
          await api.delete(apiEndpoints.registry.delete(id));
          set((state) => ({
            apiRegistry: state.apiRegistry.filter(api => api.id !== id)
          }));
        } catch (e) {
          console.error("Failed to delete API", e);
        }
      },

      generateAgentDAG: async (prompt) => {
        try {
          const response = await api.post(apiEndpoints.dag.generate, { prompt });
          return response;
        } catch (e) {
          console.error("Failed to generate DAG", e);
          return { nodes: [], edges: [], fallbackMessage: "Failed to generate DAG from backend." };
        }
      }
    }),
    {
      name: 'itt-orchestrator-storage',
    }
  )
);
