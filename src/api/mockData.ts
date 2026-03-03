export const mockRegistry = [
  { id: 'api_1', name: 'CoreBanking.GetBalance', category: 'system', specLink: 'Building Block', semanticTags: ['Core'], authProtocol: 'OAuth', status: 'Active', dependsOn: [], integrationId: '' },
  { id: 'api_2', name: 'CoreBanking.CustomerProfile', category: 'system', specLink: 'Building Block', semanticTags: ['Core'], authProtocol: 'OAuth', status: 'Active', dependsOn: [], integrationId: '' },
  { id: 'api_3', name: 'Loan.Origination', category: 'process', specLink: 'Process', semanticTags: ['Loan'], authProtocol: 'OAuth', status: 'Active', dependsOn: ['api_1', 'api_2'], integrationId: '' },
  { id: 'api_4', name: 'Credit.RiskScoring', category: 'process', specLink: 'Process', semanticTags: ['Risk'], authProtocol: 'OAuth', status: 'Active', dependsOn: ['api_2'], integrationId: '' },
  { id: 'api_5', name: 'Mobile.Dashboard.BFF', category: 'experience', specLink: 'Experience', semanticTags: ['Mobile'], authProtocol: 'OAuth', status: 'Active', dependsOn: ['api_3', 'api_4'], integrationId: '' },
  { id: 'api_6', name: 'NetBanking.Auth', category: 'experience', specLink: 'Experience', semanticTags: ['Web'], authProtocol: 'OAuth', status: 'Active', dependsOn: [], integrationId: '' },
];

export const mockZones = [
  { id: 'zone_1', name: 'Zone 1: The Fortress', description: 'Highest security zone for core banking systems.', ips: ['10.0.1.0/24'], filters: ['Strict MTLS', 'IP Whitelist'], icon: 'Lock', color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
  { id: 'zone_2', name: 'Zone 2: Core Guard', description: 'Internal services and process APIs.', ips: ['10.0.2.0/24'], filters: ['Token Validation'], icon: 'ShieldCheck', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  { id: 'zone_3', name: 'Zone 3: Velocity Mesh', description: 'High-throughput experience APIs and BFFs.', ips: ['10.0.3.0/24'], filters: ['Rate Limiting', 'Circuit Breaker'], icon: 'Activity', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  { id: 'zone_4', name: 'Zone 4: Cognitive Edge', description: 'External facing and AI integrations.', ips: ['10.0.4.0/24'], filters: ['Semantic Firewall', 'WAF'], icon: 'Network', color: 'text-cyan-500', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
];

export const mockMdmRules = [
  { id: 1, name: 'Aadhaar Number', pattern: '\\d{4}-\\d{4}-\\d{4}', token: 'TKN-AADHAAR' },
  { id: 2, name: 'PAN Card', pattern: '[A-Z]{5}[0-9]{4}[A-Z]{1}', token: 'TKN-PAN' },
  { id: 3, name: 'Email Address', pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}', token: 'TKN-EMAIL' },
];

export const mockIntegrations = [
  { id: 'int_1', name: 'Mainframe MQ', type: 'Message Queue', subtype: 'IBM MQ', vaultPath: 'secret/data/prod/mq', status: 'connected' },
  { id: 'int_2', name: 'Customer DB', type: 'Database', subtype: 'Oracle RDBMS', vaultPath: 'secret/data/prod/db', status: 'connected' },
];
