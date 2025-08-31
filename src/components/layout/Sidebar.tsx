'use client';

import React, { useState } from 'react';
import { 
  Home, 
  Package, 
  ShoppingCart, 
  Users, 
  Truck, 
  BarChart3, 
  Bell, 
  Settings,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/utils';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Tableau de bord', icon: Home },
  { id: 'stock', label: 'Gestion Stock', icon: Package },
  { id: 'rayons', label: 'Gestion Rayons', icon: Package },
  { id: 'ventes', label: 'Gestion des Ventes', icon: ShoppingCart },
  { id: 'clients', label: 'Clients', icon: Users },
  { id: 'fournisseurs', label: 'Fournisseurs', icon: Truck },
  { id: 'statistiques', label: 'Statistiques', icon: BarChart3 },
  { id: 'alertes', label: 'Alertes', icon: Bell },
  { id: 'parametres', label: 'Paramètres', icon: Settings },
];

export default function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 rounded-lg bg-emerald-600 text-white shadow-lg"
        >
          {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        'fixed left-0 top-0 h-full bg-white border-r border-emerald-100 shadow-lg transition-all duration-300 z-40',
        isCollapsed ? 'w-16' : 'w-64',
        'lg:translate-x-0',
        isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Header */}
        <div className="p-6 border-b border-emerald-100">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">PharmaCare</h1>
                  <p className="text-xs text-gray-500">Gestion Pharmaceutique</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:block p-1.5 rounded-lg hover:bg-emerald-50 text-gray-500 hover:text-emerald-600"
            >
              <Menu size={16} />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSectionChange(item.id);
                  setIsMobileOpen(false);
                }}
                className={cn(
                  'w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200',
                  isActive 
                    ? 'bg-emerald-100 text-emerald-700 shadow-sm' 
                    : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-600'
                )}
              >
                <Icon size={20} className="flex-shrink-0" />
                {!isCollapsed && (
                  <span className="font-medium">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User info */}
        {!isCollapsed && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-emerald-100">
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-emerald-50">
              <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">A</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  Admin Pharmacie
                </p>
                <p className="text-xs text-gray-500 truncate">
                  admin@pharmacare.com
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
