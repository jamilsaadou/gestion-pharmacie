'use client';

import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  AlertTriangle,
  Calendar,
  Eye
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { usePharmacieData } from '@/hooks/usePharmacieData';
import { formatPrice, formatDate, isLowStock, isExpired, isExpiringSoon, searchInArray, sortArray } from '@/utils';
import { Medicament } from '@/types';
import AddMedicamentModal from './AddMedicamentModal';
import ViewMedicamentModal from './ViewMedicamentModal';
import EditMedicamentModal from './EditMedicamentModal';

export default function StockManagement() {
  const { medicaments, supprimerMedicament } = usePharmacieData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState<keyof Medicament>('nom');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMedicament, setSelectedMedicament] = useState<Medicament | null>(null);

  // Filtrage et tri des médicaments
  const filteredMedicaments = useMemo(() => {
    let filtered = medicaments;

    // Recherche
    if (searchTerm) {
      filtered = searchInArray(filtered, searchTerm, ['nom', 'description', 'categorie', 'fournisseur']);
    }

    // Filtre par catégorie
    if (selectedCategory) {
      filtered = filtered.filter(med => med.categorie === selectedCategory);
    }

    // Tri
    filtered = sortArray(filtered, sortBy, sortDirection);

    return filtered;
  }, [medicaments, searchTerm, selectedCategory, sortBy, sortDirection]);

  // Catégories uniques
  const categories = useMemo(() => {
    return Array.from(new Set(medicaments.map(med => med.categorie))).sort();
  }, [medicaments]);

  const handleSort = (key: keyof Medicament) => {
    if (sortBy === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortDirection('asc');
    }
  };

  const getStockStatus = (medicament: Medicament) => {
    if (medicament.quantiteStock === 0) {
      return { status: 'rupture', color: 'text-red-600', bgColor: 'bg-red-100', label: 'Rupture' };
    }
    if (isLowStock(medicament.quantiteStock, medicament.seuilAlerte)) {
      return { status: 'faible', color: 'text-orange-600', bgColor: 'bg-orange-100', label: 'Stock faible' };
    }
    return { status: 'normal', color: 'text-emerald-600', bgColor: 'bg-emerald-100', label: 'En stock' };
  };

  const getExpirationStatus = (medicament: Medicament) => {
    if (isExpired(medicament.dateExpiration)) {
      return { status: 'expire', color: 'text-red-600', bgColor: 'bg-red-100', label: 'Expiré' };
    }
    if (isExpiringSoon(medicament.dateExpiration)) {
      return { status: 'bientot', color: 'text-orange-600', bgColor: 'bg-orange-100', label: 'Expire bientôt' };
    }
    return { status: 'valide', color: 'text-emerald-600', bgColor: 'bg-emerald-100', label: 'Valide' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion du Stock</h1>
          <p className="text-gray-600 mt-1">
            Gérez votre inventaire de médicaments
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="mt-4 sm:mt-0">
          <Plus size={16} className="mr-2" />
          Ajouter un médicament
        </Button>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Rechercher un médicament..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search size={16} />}
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">Toutes les catégories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <div className="flex items-center space-x-2">
              <Filter size={16} className="text-gray-400" />
              <span className="text-sm text-gray-600">
                {filteredMedicaments.length} médicament{filteredMedicaments.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total médicaments</p>
                <p className="text-2xl font-bold text-gray-900">{medicaments.length}</p>
              </div>
              <Package className="text-blue-600" size={24} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Stock faible</p>
                <p className="text-2xl font-bold text-orange-600">
                  {medicaments.filter(med => isLowStock(med.quantiteStock, med.seuilAlerte)).length}
                </p>
              </div>
              <AlertTriangle className="text-orange-600" size={24} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Expirés/Bientôt</p>
                <p className="text-2xl font-bold text-red-600">
                  {medicaments.filter(med => isExpired(med.dateExpiration) || isExpiringSoon(med.dateExpiration)).length}
                </p>
              </div>
              <Calendar className="text-red-600" size={24} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table des médicaments */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('nom')}
                  >
                    Médicament
                    {sortBy === 'nom' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Catégorie
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('quantiteStock')}
                  >
                    Stock
                    {sortBy === 'quantiteStock' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('prix')}
                  >
                    Prix
                    {sortBy === 'prix' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('dateExpiration')}
                  >
                    Expiration
                    {sortBy === 'dateExpiration' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMedicaments.map((medicament) => {
                  const stockStatus = getStockStatus(medicament);
                  const expirationStatus = getExpirationStatus(medicament);
                  
                  return (
                    <tr key={medicament.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            {medicament.photo ? (
                              <img
                                src={medicament.photo}
                                alt={medicament.nom}
                                className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                                <Package size={20} className="text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {medicament.nom}
                            </div>
                            <div className="text-sm text-gray-500">
                              {medicament.dosage} - {medicament.forme}
                            </div>
                            {medicament.prescription && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 mt-1">
                                Sur ordonnance
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {medicament.categorie}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {medicament.quantiteStock} unités
                        </div>
                        <div className="text-xs text-gray-500">
                          Seuil: {medicament.seuilAlerte}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatPrice(medicament.prix)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(medicament.dateExpiration)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${stockStatus.bgColor} ${stockStatus.color}`}>
                            {stockStatus.label}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${expirationStatus.bgColor} ${expirationStatus.color}`}>
                            {expirationStatus.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedMedicament(medicament);
                              setShowViewModal(true);
                            }}
                          >
                            <Eye size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedMedicament(medicament);
                              setShowEditModal(true);
                            }}
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm('Êtes-vous sûr de vouloir supprimer ce médicament ?')) {
                                supprimerMedicament(medicament.id);
                              }
                            }}
                          >
                            <Trash2 size={16} className="text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {filteredMedicaments.length === 0 && (
            <div className="text-center py-12">
              <Package size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun médicament trouvé</h3>
              <p className="text-gray-500">
                {searchTerm || selectedCategory 
                  ? 'Essayez de modifier vos critères de recherche'
                  : 'Commencez par ajouter des médicaments à votre stock'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <AddMedicamentModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
      
      <ViewMedicamentModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedMedicament(null);
        }}
        medicament={selectedMedicament}
      />
      
      <EditMedicamentModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedMedicament(null);
        }}
        medicament={selectedMedicament}
      />
    </div>
  );
}
