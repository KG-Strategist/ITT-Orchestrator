import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './src/components/Layout';
import AgentBuilder from './src/components/canvas/AgentBuilder';
import Identity from './src/pages/Identity';
import MDM from './src/pages/MDM';
import Integrations from './src/pages/Integrations';
import Login from './src/pages/Login';
import Dashboard from './src/pages/Dashboard';
import AgentPortfolio from './src/pages/AgentPortfolio';
import ApiRegistry from './src/pages/ApiRegistry';
import ZoneManagement from './src/pages/ZoneManagement';
import SettingsPage from './src/pages/Settings';
import IntentManifests from './src/pages/IntentManifests';
import GVSCalculator from './src/pages/GVSCalculator';
import ExecutionPlanes from './src/pages/ExecutionPlanes';
import PolicyManagement from './src/pages/PolicyManagement';
import MultiTenantIAM from './src/pages/MultiTenantIAM';
import { McpConfig, AgentSocketConfig, GrpcConfig, Iso8583Config, A2aConfig } from './src/pages/Protocols';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard/executive" replace />} />
          <Route path="dashboard" element={<Navigate to="/dashboard/executive" replace />} />
          <Route path="dashboard/executive" element={<Dashboard />} />
          <Route path="agents" element={<AgentPortfolio />} />
          <Route path="agent-builder/:id" element={<AgentBuilder />} />
          <Route path="agent-builder" element={<Navigate to="/agents" replace />} />
          <Route path="registry" element={<ApiRegistry />} />
          <Route path="zones" element={<ZoneManagement />} />
          <Route path="iam" element={<Identity />} />
          <Route path="iam/tenants" element={<MultiTenantIAM />} />
          <Route path="masters/mdm" element={<MDM />} />
          <Route path="integrations" element={<Integrations />} />
          <Route path="settings/organization" element={<SettingsPage type="organization" />} />
          <Route path="settings/currency" element={<SettingsPage type="currency" />} />
          
          <Route path="agf/execution-planes" element={<ExecutionPlanes />} />
          <Route path="agf/policies" element={<PolicyManagement />} />
          
          <Route path="gvm/manifests" element={<IntentManifests />} />
          <Route path="gvm/calculator" element={<GVSCalculator />} />

          <Route path="protocols/mcp" element={<McpConfig />} />
          <Route path="protocols/agent-socket" element={<AgentSocketConfig />} />
          <Route path="protocols/grpc" element={<GrpcConfig />} />
          <Route path="protocols/iso-8583" element={<Iso8583Config />} />
          <Route path="protocols/a2a" element={<A2aConfig />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;