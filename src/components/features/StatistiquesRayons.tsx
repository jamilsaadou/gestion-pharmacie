'use client';

import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Calendar,
  Filter,
  Package,
  MapPin,
  ArrowRightLeft,
  PieChart,
  Activity
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Rayon, MedicamentRayon, TransfertRayon, Medicament } from '@/types';
import { cn } from '@/utils';

interface StatistiquesRayonsProps {
  rayons: Rayon[];
  medicamentsRayons: MedicamentRayon[];
  transferts: TransfertRayon[];
  medicaments: Medicament[];
}

interface FiltresStatistiques {
  periode: 'jour' | 'semaine' | 'mois' | 'trimestre' | 'annee' | 'personnalisee';
  dateDebut?: string;
  dateFin?: string;
  rayonId?: string;
  medicamentId?: string;
  typeTransfert?: TransfertRayon['typeTransfert'] | 'tous';
}

export default function StatistiquesRayons({ 
  rayons, 
  medicamentsRayons, 
  transferts, 
  medicaments 
}: StatistiquesRayonsProps) {
  const [filtres, setFiltres] = useState<FiltresStatistiques>({
    periode: 'mois',
    typeTransfert: 'tous'
  });

  // Calcul des dates selon la période
  const dateRange = useMemo(() => {
    const aujourd = new Date();
    let dateDebut: Date;
    let dateFin = new Date(aujourd);

    switch (filtres.periode) {
      case 'jour':
        dateDebut = new Date(aujourd);
        dateDebut.setHours(0, 0, 0, 0);
        break;
      case 'semaine':
        dateDebut = new Date(aujourd);
        dateDebut.setDate(aujourd.getDate() - 7);
        break;
      case 'mois':
        dateDebut = new Date(aujourd.getFullYear(), aujourd.getMonth(), 1);
        break;
      case 'trimestre':
        const trimestre = Math.floor(aujourd.getMonth() / 3);
        dateDebut = new Date(aujourd.getFullYear(), trimestre * 3, 1);
        break;
      case 'annee':
        dateDebut = new Date(aujourd.getFullYear(), 0, 1);
        break;
      case 'personnalisee':
        dateDebut = filtres.dateDebut ? new Date(filtres.dateDebut) : new Date(aujourd.getFullYear(), 0, 1);
        dateFin = filtres.dateFin ? new Date(filtres.dateFin) : aujourd;
        break;
      default:
        dateDebut = new Date(aujourd.getFullYear(), aujourd.getMonth(), 1);
    }

    return { dateDebut, dateFin };
  }, [filtres.periode, filtres.dateDebut, filtres.dateFin]);

  // Filtrage des transferts selon les critères
  const transfertsFiltres = useMemo(() => {
    return transferts.filter(transfert => {
      // Filtre par date
      const dateTransfert = new Date(transfert.date);
      if (dateTransfert < dateRange.dateDebut || dateTransfert > dateRange.dateFin) {
        return false;
      }

      // Filtre par rayon
      if (filtres.rayonId && transfert.rayonId !== filtres.rayonId) {
        return false;
      }

      // Filtre par médicament
      if (filtres.medicamentId && transfert.medicamentId !== filtres.medicamentId) {
        return false;
      }

      // Filtre par type de transfert
      if (filtres.typeTransfert && filtres.typeTransfert !== 'tous' && transfert.typeTransfert !== filtres.typeTransfert) {
        return false;
      }

      return true;
    });
  }, [transferts, dateRange, filtres]);

  // Statistiques calculées
  const statistiques = useMemo(() => {
    const totalTransferts = transfertsFiltres.length;
    const quantiteTotaleTransferee = transfertsFiltres.reduce((sum, t) => sum + t.quantiteTransferee, 0);
    
    // Transferts par type
    const transfertsParType = {
      stock_vers_rayon: transfertsFiltres.filter(t => t.typeTransfert === 'stock_vers_rayon').length,
      rayon_vers_stock: transfertsFiltres.filter(t => t.typeTransfert === 'rayon_vers_stock').length,
      rayon_vers_rayon: transfertsFiltres.filter(t => t.typeTransfert === 'rayon_vers_rayon').length,
    };

    // Rayons les plus actifs
    const activiteParRayon = new Map<string, { rayon: Rayon; transferts: number; quantite: number }>();
    transfertsFiltres.forEach(transfert => {
      const rayon = rayons.find(r => r.id === transfert.rayonId);
      if (rayon) {
        const existing = activiteParRayon.get(transfert.rayonId);
        if (existing) {
          existing.transferts += 1;
          existing.quantite += transfert.quantiteTransferee;
        } else {
          activiteParRayon.set(transfert.rayonId, {
            rayon,
            transferts: 1,
            quantite: transfert.quantiteTransferee
          });
        }
      }
    });

    const rayonsLesPlus = Array.from(activiteParRayon.values())
      .sort((a, b) => b.transferts - a.transferts)
      .slice(0, 5);

    // Médicaments les plus transférés
    const medicamentsTransferes = new Map<string, { medicament: Medicament; transferts: number; quantite: number }>();
    transfertsFiltres.forEach(transfert => {
      const medicament = medicaments.find(m => m.id === transfert.medicamentId);
      if (medicament) {
        const existing = medicamentsTransferes.get(transfert.medicamentId);
        if (existing) {
          existing.transferts += 1;
          existing.quantite += transfert.quantiteTransferee;
        } else {
          medicamentsTransferes.set(transfert.medicamentId, {
            medicament,
            transferts: 1,
            quantite: transfert.quantiteTransferee
          });
        }
      }
    });

    const medicamentsLesPlusTransferes = Array.from(medicamentsTransferes.values())
      .sort((a, b) => b.quantite - a.quantite)
      .slice(0, 5);

    // Évolution des transferts (par jour sur la période)
    const evolutionTransferts = new Map<string, number>();
    transfertsFiltres.forEach(transfert => {
      const dateStr = transfert.date.toISOString().split('T')[0];
      evolutionTransferts.set(dateStr, (evolutionTransferts.get(dateStr) || 0) + 1);
    });

    // Taux d'occupation des rayons
    const occupationRayons = rayons.map(rayon => {
      const medicamentsRayon = medicamentsRayons.filter(mr => mr.rayonId === rayon.id);
      const quantiteTotale = medicamentsRayon.reduce((sum, mr) => sum + mr.quantiteEnRayon, 0);
      const tauxOccupation = (quantiteTotale / rayon.capaciteMax) * 100;
      
      return {
        rayon,
        quantiteTotale,
        tauxOccupation,
        nombreMedicaments: medicamentsRayon.length
      };
    }).sort((a, b) => b.tauxOccupation - a.tauxOccupation);

    return {
      totalTransferts,
      quantiteTotaleTransferee,
      transfertsParType,
      rayonsLesPlus,
      medicamentsLesPlusTransferes,
      evolutionTransferts,
      occupationRayons
    };
  }, [transfertsFiltres, rayons, medicaments, medicamentsRayons]);

  // Fonction d'export
  const exporterDonnees = (format: 'csv' | 'json') => {
    const donnees = {
      periode: filtres.periode,
      dateDebut: dateRange.dateDebut.toISOString(),
      dateFin: dateRange.dateFin.toISOString(),
      statistiques,
      transferts: transfertsFiltres.map(t => ({
        date: t.date.toISOString(),
        medicament: t.medicament?.nom,
        rayon: t.rayon?.nom,
        type: t.typeTransfert,
        quantite: t.quantiteTransferee,
        utilisateur: t.utilisateur,
        commentaire: t.commentaire
      }))
    };

    if (format === 'csv') {
      // Export CSV des transferts
      const headers = ['Date', 'Médicament', 'Rayon', 'Type', 'Quantité', 'Utilisateur', 'Commentaire'];
      const csvContent = [
        headers.join(','),
        ...donnees.transferts.map(t => [
          t.date,
          t.medicament || '',
          t.rayon || '',
          t.type,
          t.quantite,
          t.utilisateur,
          t.commentaire || ''
        ].map(field => `"${field}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `statistiques-rayons-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } else {
      // Export JSON
      const blob = new Blob([JSON.stringify(donnees, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `statistiques-rayons-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
    }
  };

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filtres et Période</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Select
            label="Période"
            value={filtres.periode}
            onChange={(e) => setFiltres({ ...filtres, periode: e.target.value as any })}
          >
            <option value="jour">Aujourd'hui</option>
            <option value="semaine">7 derniers jours</option>
            <option value="mois">Ce mois</option>
            <option value="trimestre">Ce trimestre</option>
            <option value="annee">Cette année</option>
            <option value="personnalisee">Période personnalisée</option>
          </Select>

          {filtres.periode === 'personnalisee' && (
            <>
              <Input
                label="Date de début"
                type="date"
                value={filtres.dateDebut || ''}
                onChange={(e) => setFiltres({ ...filtres, dateDebut: e.target.value })}
              />
              <Input
                label="Date de fin"
                type="date"
                value={filtres.dateFin || ''}
                onChange={(e) => setFiltres({ ...filtres, dateFin: e.target.value })}
              />
            </>
          )}

          <Select
            label="Rayon"
            value={filtres.rayonId || ''}
            onChange={(e) => setFiltres({ ...filtres, rayonId: e.target.value || undefined })}
          >
            <option value="">Tous les rayons</option>
            {rayons.map(rayon => (
              <option key={rayon.id} value={rayon.id}>
                {rayon.nom}
              </option>
            ))}
          </Select>

          <Select
            label="Médicament"
            value={filtres.medicamentId || ''}
            onChange={(e) => setFiltres({ ...filtres, medicamentId: e.target.value || undefined })}
          >
            <option value="">Tous les médicaments</option>
            {medicaments.map(medicament => (
              <option key={medicament.id} value={medicament.id}>
                {medicament.nom}
              </option>
            ))}
          </Select>

          <Select
            label="Type de transfert"
            value={filtres.typeTransfert || 'tous'}
            onChange={(e) => setFiltres({ ...filtres, typeTransfert: e.target.value as any })}
          >
            <option value="tous">Tous les types</option>
            <option value="stock_vers_rayon">Stock → Rayon</option>
            <option value="rayon_vers_stock">Rayon → Stock</option>
            <option value="rayon_vers_rayon">Rayon → Rayon</option>
          </Select>
        </div>

        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => exporterDonnees('csv')}
            className="flex items-center gap-2"
          >
            <Download size={16} />
            Exporter CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => exporterDonnees('json')}
            className="flex items-center gap-2"
          >
            <Download size={16} />
            Exporter JSON
          </Button>
        </div>
      </Card>

      {/* Indicateurs principaux */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Transferts</p>
              <p className="text-2xl font-bold text-gray-900">{statistiques.totalTransferts}</p>
            </div>
            <ArrowRightLeft className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Quantité Transférée</p>
              <p className="text-2xl font-bold text-gray-900">{statistiques.quantiteTotaleTransferee}</p>
            </div>
            <Package className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Stock → Rayon</p>
              <p className="text-2xl font-bold text-blue-600">{statistiques.transfertsParType.stock_vers_rayon}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rayon → Stock</p>
              <p className="text-2xl font-bold text-orange-600">{statistiques.transfertsParType.rayon_vers_stock}</p>
            </div>
            <TrendingDown className="w-8 h-8 text-orange-500" />
          </div>
        </Card>
      </div>

      {/* Graphiques et analyses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rayons les plus actifs */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={20} className="text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Rayons les Plus Actifs</h3>
          </div>
          <div className="space-y-3">
            {statistiques.rayonsLesPlus.map((item, index) => (
              <div key={item.rayon.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                    <span className="text-emerald-600 font-semibold text-sm">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{item.rayon.nom}</p>
                    <p className="text-xs text-gray-600">{item.rayon.emplacement}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{item.transferts} transferts</p>
                  <p className="text-xs text-gray-600">{item.quantite} unités</p>
                </div>
              </div>
            ))}
            {statistiques.rayonsLesPlus.length === 0 && (
              <p className="text-gray-500 text-center py-4">Aucun transfert sur cette période</p>
            )}
          </div>
        </Card>

        {/* Médicaments les plus transférés */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <PieChart size={20} className="text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Médicaments les Plus Transférés</h3>
          </div>
          <div className="space-y-3">
            {statistiques.medicamentsLesPlusTransferes.map((item, index) => (
              <div key={item.medicament.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-sm">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{item.medicament.nom}</p>
                    <p className="text-xs text-gray-600">{item.medicament.forme}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{item.quantite} unités</p>
                  <p className="text-xs text-gray-600">{item.transferts} transferts</p>
                </div>
              </div>
            ))}
            {statistiques.medicamentsLesPlusTransferes.length === 0 && (
              <p className="text-gray-500 text-center py-4">Aucun transfert sur cette période</p>
            )}
          </div>
        </Card>
      </div>

      {/* Taux d'occupation des rayons */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={20} className="text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Taux d'Occupation des Rayons</h3>
        </div>
        <div className="space-y-4">
          {statistiques.occupationRayons.map(item => (
            <div key={item.rayon.id} className="space-y-2">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">{item.rayon.nom}</p>
                  <p className="text-sm text-gray-600">{item.rayon.emplacement}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {item.quantiteTotale} / {item.rayon.capaciteMax}
                  </p>
                  <p className="text-sm text-gray-600">{item.tauxOccupation.toFixed(1)}%</p>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={cn(
                    "h-3 rounded-full transition-all",
                    item.tauxOccupation > 90 ? "bg-red-500" :
                    item.tauxOccupation > 70 ? "bg-yellow-500" : "bg-green-500"
                  )}
                  style={{ width: `${Math.min(item.tauxOccupation, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500">
                {item.nombreMedicaments} médicament(s) différent(s)
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
