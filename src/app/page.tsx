'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Dashboard from '@/components/features/Dashboard';
import StockManagement from '@/components/features/StockManagement';
import { SalesManagement } from '@/components/features/SalesManagement';

export default function Home() {
  const [activeSection, setActiveSection] = useState('dashboard');

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'stock':
        return <StockManagement />;
      case 'ventes':
        return <SalesManagement />;
      case 'clients':
        return (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Gestion des Clients</h2>
              <p className="text-gray-600">Module en cours de développement</p>
            </div>
          </div>
        );
      case 'fournisseurs':
        return (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Gestion des Fournisseurs</h2>
              <p className="text-gray-600">Module en cours de développement</p>
            </div>
          </div>
        );
      case 'statistiques':
        return (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Statistiques</h2>
              <p className="text-gray-600">Module en cours de développement</p>
            </div>
          </div>
        );
      case 'alertes':
        return (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Alertes</h2>
              <p className="text-gray-600">Module en cours de développement</p>
            </div>
          </div>
        );
      case 'parametres':
        return (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Paramètres</h2>
              <p className="text-gray-600">Module en cours de développement</p>
            </div>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection} 
      />
      
      {/* Main content */}
      <div className="lg:ml-64 min-h-screen">
        <main className="p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
