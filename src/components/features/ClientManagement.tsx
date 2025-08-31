'use client';

import React, { useState, useMemo } from 'react';
import { useClientData } from '@/hooks/useClientData';
import { Client } from '@/types';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { AddClientModal } from './AddClientModal';
import { EditClientModal } from './EditClientModal';
import { ViewClientModal } from './ViewClientModal';

interface ClientManagementProps {
  className?: string;
}

export function ClientManagement({ className = '' }: ClientManagementProps) {
  const {
    clients,
    statistiquesClients,
    rechercherClients,
    supprimerClient,
    calculerAge,
    calculerTotalAchatsClient,
    obtenirHistoriqueClient,
    exporterClients,
  } = useClientData();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [sortBy, setSortBy] = useState<'nom' | 'dateInscription' | 'totalAchats'>('nom');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Filtrer et trier les clients
  const clientsFiltres = useMemo(() => {
    let result = rechercherClients(searchTerm);

    // Trier les clients
    result.sort((a, b) => {
      let valueA: any, valueB: any;

      switch (sortBy) {
        case 'nom':
          valueA = `${a.nom} ${a.prenom}`.toLowerCase();
          valueB = `${b.nom} ${b.prenom}`.toLowerCase();
          break;
        case 'dateInscription':
          valueA = new Date(a.dateInscription).getTime();
          valueB = new Date(b.dateInscription).getTime();
          break;
        case 'totalAchats':
          valueA = calculerTotalAchatsClient(a.id);
          valueB = calculerTotalAchatsClient(b.id);
          break;
        default:
          return 0;
      }

      if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [clients, searchTerm, sortBy, sortOrder, rechercherClients, calculerTotalAchatsClient]);

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleDeleteClient = (client: Client) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le client ${client.prenom} ${client.nom} ?`)) {
      supprimerClient(client.id);
    }
  };

  const handleExport = () => {
    const csv = exporterClients();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `clients_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getSortIcon = (field: typeof sortBy) => {
    if (sortBy !== field) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* En-tête avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-600">
            {statistiquesClients.totalClients}
          </div>
          <div className="text-sm text-gray-600">Total clients</div>
        </Card>
        
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">
            {statistiquesClients.nouveauxClientsMois}
          </div>
          <div className="text-sm text-gray-600">Nouveaux ce mois</div>
        </Card>
        
        <Card className="p-4">
          <div className="text-2xl font-bold text-purple-600">
            {statistiquesClients.clientsActifs}
          </div>
          <div className="text-sm text-gray-600">Clients actifs</div>
        </Card>
        
        <Card className="p-4">
          <div className="text-2xl font-bold text-orange-600">
            {statistiquesClients.clientsFideles.length}
          </div>
          <div className="text-sm text-gray-600">Clients fidèles</div>
        </Card>
      </div>

      {/* Barre d'outils */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex-1 max-w-md">
            <Input
              type="text"
              placeholder="Rechercher un client (nom, téléphone, email...)"
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              ➕ Nouveau client
            </Button>
            
            <Button
              onClick={handleExport}
              variant="outline"
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
              📊 Exporter
            </Button>
          </div>
        </div>
      </Card>

      {/* Liste des clients */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('nom')}
                >
                  Client {getSortIcon('nom')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Âge
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('dateInscription')}
                >
                  Inscription {getSortIcon('dateInscription')}
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('totalAchats')}
                >
                  Total achats {getSortIcon('totalAchats')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Achats
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clientsFiltres.map((client) => {
                const age = calculerAge(client.dateNaissance);
                const totalAchats = calculerTotalAchatsClient(client.id);
                const nombreAchats = obtenirHistoriqueClient(client.id).length;
                
                return (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {client.prenom} {client.nom}
                        </div>
                        {client.numeroSecu && (
                          <div className="text-sm text-gray-500">
                            N° Sécu: {client.numeroSecu}
                          </div>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {client.telephone && (
                          <div>📞 {client.telephone}</div>
                        )}
                        {client.email && (
                          <div>✉️ {client.email}</div>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {age ? `${age} ans` : '-'}
                    </td>
                    
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(client.dateInscription).toLocaleDateString()}
                    </td>
                    
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {totalAchats.toLocaleString()} FCFA
                      </div>
                    </td>
                    
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        nombreAchats >= 5 
                          ? 'bg-green-100 text-green-800' 
                          : nombreAchats > 0 
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {nombreAchats} achat{nombreAchats !== 1 ? 's' : ''}
                      </span>
                    </td>
                    
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedClient(client);
                            setShowViewModal(true);
                          }}
                          className="text-blue-600 border-blue-600 hover:bg-blue-50"
                        >
                          👁️
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedClient(client);
                            setShowEditModal(true);
                          }}
                          className="text-green-600 border-green-600 hover:bg-green-50"
                        >
                          ✏️
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteClient(client)}
                          className="text-red-600 border-red-600 hover:bg-red-50"
                        >
                          🗑️
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {clientsFiltres.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'Aucun client trouvé pour cette recherche' : 'Aucun client enregistré'}
            </div>
          )}
        </div>
      </Card>

      {/* Modales */}
      <AddClientModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
      
      {selectedClient && (
        <>
          <EditClientModal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setSelectedClient(null);
            }}
            client={selectedClient}
          />
          
          <ViewClientModal
            isOpen={showViewModal}
            onClose={() => {
              setShowViewModal(false);
              setSelectedClient(null);
            }}
            client={selectedClient}
          />
        </>
      )}
    </div>
  );
}
