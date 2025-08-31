import { useState, useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { usePharmacieData } from './usePharmacieData';
import { 
  Rayon, 
  MedicamentRayon, 
  TransfertRayon,
  Medicament
} from '@/types';
import { generateId } from '@/utils';

// Données de démonstration pour les rayons
const rayonsDemo: Rayon[] = [
  {
    id: '1',
    nom: 'Rayon A',
    description: 'Médicaments sans ordonnance',
    emplacement: 'Allée 1, Étagère 1-3',
    capaciteMax: 100,
    dateCreation: new Date('2024-01-01'),
    dateModification: new Date('2024-01-01'),
  },
  {
    id: '2',
    nom: 'Rayon B',
    description: 'Antibiotiques et médicaments sur ordonnance',
    emplacement: 'Allée 2, Étagère 1-2',
    capaciteMax: 80,
    dateCreation: new Date('2024-01-01'),
    dateModification: new Date('2024-01-01'),
  },
  {
    id: '3',
    nom: 'Rayon C',
    description: 'Sirops et médicaments liquides',
    emplacement: 'Allée 1, Étagère 4-5',
    capaciteMax: 60,
    dateCreation: new Date('2024-01-01'),
    dateModification: new Date('2024-01-01'),
  },
];

const medicamentsRayonsDemo: MedicamentRayon[] = [
  {
    id: '1',
    medicamentId: '1',
    rayonId: '1',
    quantiteEnRayon: 50,
    quantiteMinimale: 10,
    dateTransfert: new Date('2024-01-15'),
    statut: 'en_vente',
  },
  {
    id: '2',
    medicamentId: '2',
    rayonId: '2',
    quantiteEnRayon: 5,
    quantiteMinimale: 5,
    dateTransfert: new Date('2024-02-01'),
    statut: 'en_vente',
  },
  {
    id: '3',
    medicamentId: '3',
    rayonId: '3',
    quantiteEnRayon: 15,
    quantiteMinimale: 8,
    dateTransfert: new Date('2024-01-20'),
    statut: 'en_vente',
  },
];

export function useRayonData() {
  const { medicaments, mettreAJourStock } = usePharmacieData();
  const [rayons, setRayons] = useLocalStorage<Rayon[]>('rayons', rayonsDemo);
  const [medicamentsRayons, setMedicamentsRayons] = useLocalStorage<MedicamentRayon[]>('medicamentsRayons', medicamentsRayonsDemo);
  const [transferts, setTransferts] = useLocalStorage<TransfertRayon[]>('transferts', []);

  // Gestion des rayons
  const ajouterRayon = useCallback((rayon: Omit<Rayon, 'id' | 'dateCreation' | 'dateModification'>) => {
    const nouveauRayon: Rayon = {
      ...rayon,
      id: generateId(),
      dateCreation: new Date(),
      dateModification: new Date(),
    };
    setRayons(prev => [...prev, nouveauRayon]);
    return nouveauRayon;
  }, [setRayons]);

  const modifierRayon = useCallback((id: string, modifications: Partial<Rayon>) => {
    setRayons(prev => 
      prev.map(rayon => 
        rayon.id === id 
          ? { ...rayon, ...modifications, dateModification: new Date() }
          : rayon
      )
    );
  }, [setRayons]);

  const supprimerRayon = useCallback((id: string) => {
    // Vérifier s'il y a des médicaments dans ce rayon
    const medicamentsDansRayon = medicamentsRayons.filter(mr => mr.rayonId === id);
    
    if (medicamentsDansRayon.length > 0) {
      // Retourner les médicaments au stock principal
      medicamentsDansRayon.forEach(mr => {
        const medicament = medicaments.find(med => med.id === mr.medicamentId);
        if (medicament) {
          mettreAJourStock(mr.medicamentId, medicament.quantiteStock + mr.quantiteEnRayon);
          
          // Créer un transfert de retour au stock
          const transfertRetour: TransfertRayon = {
            id: generateId(),
            medicamentId: mr.medicamentId,
            medicament: medicament,
            rayonId: id,
            rayon: rayons.find(r => r.id === id),
            quantiteTransferee: mr.quantiteEnRayon,
            typeTransfert: 'rayon_vers_stock',
            date: new Date(),
            utilisateur: 'Système (suppression rayon)',
            commentaire: 'Retour automatique lors de la suppression du rayon'
          };
          setTransferts(prev => [...prev, transfertRetour]);
        }
      });
      
      // Supprimer les médicaments du rayon
      setMedicamentsRayons(prev => prev.filter(mr => mr.rayonId !== id));
    }
    
    // Supprimer le rayon
    setRayons(prev => prev.filter(rayon => rayon.id !== id));
  }, [setRayons, setMedicamentsRayons, setTransferts, medicamentsRayons, medicaments, mettreAJourStock, rayons]);

  // Gestion des transferts
  const transfererMedicament = useCallback((transfert: Omit<TransfertRayon, 'id' | 'date' | 'medicament' | 'rayon' | 'rayonDestination'>) => {
    const medicament = medicaments.find(med => med.id === transfert.medicamentId);
    const rayon = rayons.find(r => r.id === transfert.rayonId);
    const rayonDestination = transfert.rayonDestinationId ? rayons.find(r => r.id === transfert.rayonDestinationId) : undefined;
    
    if (!medicament || !rayon) {
      console.error('Médicament ou rayon introuvable');
      return;
    }

    // Vérifier les quantités disponibles
    if (transfert.typeTransfert === 'stock_vers_rayon') {
      if (medicament.quantiteStock < transfert.quantiteTransferee) {
        console.error('Stock insuffisant');
        return;
      }
      
      // Vérifier la capacité du rayon
      const medicamentsRayon = medicamentsRayons.filter(mr => mr.rayonId === transfert.rayonId);
      const quantiteTotaleRayon = medicamentsRayon.reduce((sum, mr) => sum + mr.quantiteEnRayon, 0);
      
      if (quantiteTotaleRayon + transfert.quantiteTransferee > rayon.capaciteMax) {
        console.error('Capacité du rayon dépassée');
        return;
      }
      
      // Effectuer le transfert
      mettreAJourStock(transfert.medicamentId, medicament.quantiteStock - transfert.quantiteTransferee);
      
      // Ajouter ou mettre à jour le médicament dans le rayon
      const medicamentRayonExistant = medicamentsRayons.find(mr => 
        mr.medicamentId === transfert.medicamentId && mr.rayonId === transfert.rayonId
      );
      
      if (medicamentRayonExistant) {
        setMedicamentsRayons(prev => 
          prev.map(mr => 
            mr.id === medicamentRayonExistant.id 
              ? { ...mr, quantiteEnRayon: mr.quantiteEnRayon + transfert.quantiteTransferee, dateTransfert: new Date() }
              : mr
          )
        );
      } else {
        const nouveauMedicamentRayon: MedicamentRayon = {
          id: generateId(),
          medicamentId: transfert.medicamentId,
          medicament: medicament,
          rayonId: transfert.rayonId,
          rayon: rayon,
          quantiteEnRayon: transfert.quantiteTransferee,
          quantiteMinimale: Math.ceil(transfert.quantiteTransferee * 0.2), // 20% comme minimum
          dateTransfert: new Date(),
          statut: 'en_vente',
        };
        setMedicamentsRayons(prev => [...prev, nouveauMedicamentRayon]);
      }
    } else if (transfert.typeTransfert === 'rayon_vers_stock') {
      const medicamentRayon = medicamentsRayons.find(mr => 
        mr.medicamentId === transfert.medicamentId && mr.rayonId === transfert.rayonId
      );
      
      if (!medicamentRayon || medicamentRayon.quantiteEnRayon < transfert.quantiteTransferee) {
        console.error('Quantité insuffisante dans le rayon');
        return;
      }
      
      // Effectuer le transfert
      mettreAJourStock(transfert.medicamentId, medicament.quantiteStock + transfert.quantiteTransferee);
      
      if (medicamentRayon.quantiteEnRayon === transfert.quantiteTransferee) {
        // Supprimer complètement du rayon
        setMedicamentsRayons(prev => prev.filter(mr => mr.id !== medicamentRayon.id));
      } else {
        // Réduire la quantité dans le rayon
        setMedicamentsRayons(prev => 
          prev.map(mr => 
            mr.id === medicamentRayon.id 
              ? { ...mr, quantiteEnRayon: mr.quantiteEnRayon - transfert.quantiteTransferee, dateTransfert: new Date() }
              : mr
          )
        );
      }
    } else if (transfert.typeTransfert === 'rayon_vers_rayon') {
      if (!rayonDestination) {
        console.error('Rayon de destination introuvable');
        return;
      }
      
      const medicamentRayonSource = medicamentsRayons.find(mr => 
        mr.medicamentId === transfert.medicamentId && mr.rayonId === transfert.rayonId
      );
      
      if (!medicamentRayonSource || medicamentRayonSource.quantiteEnRayon < transfert.quantiteTransferee) {
        console.error('Quantité insuffisante dans le rayon source');
        return;
      }
      
      // Vérifier la capacité du rayon de destination
      const medicamentsRayonDest = medicamentsRayons.filter(mr => mr.rayonId === transfert.rayonDestinationId);
      const quantiteTotaleRayonDest = medicamentsRayonDest.reduce((sum, mr) => sum + mr.quantiteEnRayon, 0);
      
      if (quantiteTotaleRayonDest + transfert.quantiteTransferee > rayonDestination.capaciteMax) {
        console.error('Capacité du rayon de destination dépassée');
        return;
      }
      
      // Retirer du rayon source
      if (medicamentRayonSource.quantiteEnRayon === transfert.quantiteTransferee) {
        setMedicamentsRayons(prev => prev.filter(mr => mr.id !== medicamentRayonSource.id));
      } else {
        setMedicamentsRayons(prev => 
          prev.map(mr => 
            mr.id === medicamentRayonSource.id 
              ? { ...mr, quantiteEnRayon: mr.quantiteEnRayon - transfert.quantiteTransferee }
              : mr
          )
        );
      }
      
      // Ajouter au rayon de destination
      const medicamentRayonDestExistant = medicamentsRayons.find(mr => 
        mr.medicamentId === transfert.medicamentId && mr.rayonId === transfert.rayonDestinationId
      );
      
      if (medicamentRayonDestExistant) {
        setMedicamentsRayons(prev => 
          prev.map(mr => 
            mr.id === medicamentRayonDestExistant.id 
              ? { ...mr, quantiteEnRayon: mr.quantiteEnRayon + transfert.quantiteTransferee, dateTransfert: new Date() }
              : mr
          )
        );
      } else {
        const nouveauMedicamentRayon: MedicamentRayon = {
          id: generateId(),
          medicamentId: transfert.medicamentId,
          medicament: medicament,
          rayonId: transfert.rayonDestinationId!,
          rayon: rayonDestination,
          quantiteEnRayon: transfert.quantiteTransferee,
          quantiteMinimale: Math.ceil(transfert.quantiteTransferee * 0.2),
          dateTransfert: new Date(),
          statut: 'en_vente',
        };
        setMedicamentsRayons(prev => [...prev, nouveauMedicamentRayon]);
      }
    }

    // Enregistrer le transfert
    const nouveauTransfert: TransfertRayon = {
      ...transfert,
      id: generateId(),
      date: new Date(),
      medicament: medicament,
      rayon: rayon,
      rayonDestination: rayonDestination,
    };
    
    setTransferts(prev => [...prev, nouveauTransfert]);
    return nouveauTransfert;
  }, [medicaments, rayons, medicamentsRayons, mettreAJourStock, setMedicamentsRayons, setTransferts]);

  // Fonctions utilitaires
  const obtenirMedicamentsParRayon = useCallback((rayonId: string) => {
    return medicamentsRayons
      .filter(mr => mr.rayonId === rayonId)
      .map(mr => ({
        ...mr,
        medicament: medicaments.find(med => med.id === mr.medicamentId),
        rayon: rayons.find(r => r.id === mr.rayonId)
      }));
  }, [medicamentsRayons, medicaments, rayons]);

  const obtenirStatistiquesRayon = useCallback((rayonId: string) => {
    const medicamentsRayon = obtenirMedicamentsParRayon(rayonId);
    const rayon = rayons.find(r => r.id === rayonId);
    
    if (!rayon) return null;
    
    const quantiteTotale = medicamentsRayon.reduce((sum, mr) => sum + mr.quantiteEnRayon, 0);
    const pourcentageRemplissage = (quantiteTotale / rayon.capaciteMax) * 100;
    const nombreMedicamentsDifferents = medicamentsRayon.length;
    const valeurTotale = medicamentsRayon.reduce((sum, mr) => {
      const medicament = medicaments.find(med => med.id === mr.medicamentId);
      return sum + (medicament ? medicament.prix * mr.quantiteEnRayon : 0);
    }, 0);
    
    return {
      quantiteTotale,
      pourcentageRemplissage,
      nombreMedicamentsDifferents,
      valeurTotale,
      capaciteRestante: rayon.capaciteMax - quantiteTotale
    };
  }, [obtenirMedicamentsParRayon, rayons, medicaments]);

  return {
    // Données
    rayons,
    medicamentsRayons: medicamentsRayons.map(mr => ({
      ...mr,
      medicament: medicaments.find(med => med.id === mr.medicamentId),
      rayon: rayons.find(r => r.id === mr.rayonId)
    })),
    transferts: transferts.map(t => ({
      ...t,
      medicament: medicaments.find(med => med.id === t.medicamentId),
      rayon: rayons.find(r => r.id === t.rayonId),
      rayonDestination: t.rayonDestinationId ? rayons.find(r => r.id === t.rayonDestinationId) : undefined
    })),
    medicaments,
    
    // Actions rayons
    ajouterRayon,
    modifierRayon,
    supprimerRayon,
    
    // Actions transferts
    transfererMedicament,
    
    // Fonctions utilitaires
    obtenirMedicamentsParRayon,
    obtenirStatistiquesRayon,
  };
}
