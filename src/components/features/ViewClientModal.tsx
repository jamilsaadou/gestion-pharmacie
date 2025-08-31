'use client';

import React from 'react';
import { useClientData } from '@/hooks/useClientData';
import { Client } from '@/types';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface ViewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
}

export function ViewClientModal({ isOpen, onClose, client }: ViewClientModalProps) {
  const {
    calculerAge,
    calculerTotalAchatsClient,
    obtenirHistoriqueClient,
  } = useClientData();

  const age = calculerAge(client.dateNaissance);
  const totalAchats = calculerTotalAchatsClient(client.id);
  const historiqueAchats = obtenirHistoriqueClient(client.id);
  const nombreAchats = historiqueAchats.length;

  // Calculer la moyenne des achats
  const moyenneAchats = nombreAchats > 0 ? totalAchats / nombreAchats : 0;

  // Déterminer le statut du client
  const getStatutClient = () => {
    if (nombreAchats >= 10) return { label: 'Client VIP', color: 'text-purple-600 bg-purple-100' };
    if (nombreAchats >= 5) return { label: 'Client fidèle', color: 'text-green-600 bg-green-100' };
    if (nombreAchats > 0) return { label: 'Client actif', color: 'text-blue-600 bg-blue-100' };
    return { label: 'Nouveau client', color: 'text-gray-600 bg-gray-100' };
  };

  const statut = getStatutClient();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Détails du client">
      <div className="space-y-6">
        {/* En-tête du client */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {client.prenom} {client.nom}
              </h2>
              <div className="mt-2 flex items-center gap-4">
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${statut.color}`}>
                  {statut.label}
                </span>
                {age && (
                  <span className="text-sm text-gray-600">
                    🎂 {age} ans
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Client depuis</div>
              <div className="text-lg font-semibold text-gray-900">
                {new Date(client.dateInscription).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Informations personnelles */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            📋 Informations personnelles
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Nom complet</label>
              <p className="text-sm text-gray-900">{client.prenom} {client.nom}</p>
            </div>
            
            {client.dateNaissance && (
              <div>
                <label className="text-sm font-medium text-gray-500">Date de naissance</label>
                <p className="text-sm text-gray-900">
                  {new Date(client.dateNaissance).toLocaleDateString()}
                  {age && ` (${age} ans)`}
                </p>
              </div>
            )}
            
            {client.numeroSecu && (
              <div>
                <label className="text-sm font-medium text-gray-500">N° Sécurité sociale</label>
                <p className="text-sm text-gray-900 font-mono">{client.numeroSecu}</p>
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium text-gray-500">Date d'inscription</label>
              <p className="text-sm text-gray-900">
                {new Date(client.dateInscription).toLocaleDateString()}
              </p>
            </div>
          </div>
        </Card>

        {/* Informations de contact */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            📞 Contact
          </h3>
          <div className="space-y-3">
            {client.telephone && (
              <div className="flex items-center gap-3">
                <span className="text-blue-500">📞</span>
                <div>
                  <label className="text-sm font-medium text-gray-500">Téléphone</label>
                  <p className="text-sm text-gray-900">{client.telephone}</p>
                </div>
              </div>
            )}
            
            {client.email && (
              <div className="flex items-center gap-3">
                <span className="text-green-500">✉️</span>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-sm text-gray-900">{client.email}</p>
                </div>
              </div>
            )}
            
            {client.adresse && (
              <div className="flex items-center gap-3">
                <span className="text-orange-500">🏠</span>
                <div>
                  <label className="text-sm font-medium text-gray-500">Adresse</label>
                  <p className="text-sm text-gray-900">{client.adresse}</p>
                </div>
              </div>
            )}
          </div>
          
          {!client.telephone && !client.email && !client.adresse && (
            <p className="text-sm text-gray-500 italic">
              Aucune information de contact disponible
            </p>
          )}
        </Card>

        {/* Statistiques d'achat */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            📊 Statistiques d'achat
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{nombreAchats}</div>
              <div className="text-sm text-gray-600">Achat{nombreAchats !== 1 ? 's' : ''}</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {totalAchats.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">FCFA total</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {moyenneAchats.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">FCFA/achat</div>
            </div>
          </div>
        </Card>

        {/* Historique des achats */}
        {historiqueAchats.length > 0 && (
          <Card className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              🛒 Historique des achats (5 derniers)
            </h3>
            <div className="space-y-3">
              {historiqueAchats.slice(0, 5).map((vente) => (
                <div key={vente.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      Facture #{vente.numeroFacture}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(vente.date).toLocaleDateString()} • {vente.items.length} article{vente.items.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      {vente.total.toLocaleString()} FCFA
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full ${
                      vente.statut === 'terminee' 
                        ? 'bg-green-100 text-green-800' 
                        : vente.statut === 'en_cours'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {vente.statut === 'terminee' ? 'Terminée' : 
                       vente.statut === 'en_cours' ? 'En cours' : 'Annulée'}
                    </div>
                  </div>
                </div>
              ))}
              
              {historiqueAchats.length > 5 && (
                <div className="text-center text-sm text-gray-500">
                  ... et {historiqueAchats.length - 5} autre{historiqueAchats.length - 5 !== 1 ? 's' : ''} achat{historiqueAchats.length - 5 !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Aucun achat */}
        {historiqueAchats.length === 0 && (
          <Card className="p-6 text-center">
            <div className="text-gray-400 text-4xl mb-2">🛒</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun achat
            </h3>
            <p className="text-sm text-gray-500">
              Ce client n'a encore effectué aucun achat
            </p>
          </Card>
        )}

        {/* Boutons d'action */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Fermer
          </Button>
        </div>
      </div>
    </Modal>
  );
}
