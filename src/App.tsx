/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Clients } from './components/Clients';
import { Orders } from './components/Orders';
import { Toaster } from './components/ui/sonner';

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="space-y-8 sm:space-y-12">
        <Dashboard />
        <div className="grid gap-8 sm:gap-12 lg:grid-cols-2">
          <section id="clients">
            <Clients />
          </section>
          <section id="orders">
            <Orders />
          </section>
        </div>
      </div>
      <Toaster position="top-right" />
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

