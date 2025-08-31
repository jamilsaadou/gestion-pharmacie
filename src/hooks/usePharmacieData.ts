import { useState, useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { 
  Medicament, 
  Vente, 
  Client, 
  Fournisseur, 
  Alerte,
  StatistiquesVente,
  StatistiquesStock
} from '@/types';
import { 
  generateId, 
  generateInvoiceNumber, 
  isLowStock, 
  isExpired, 
  isExpiringSoon,
  calculateTotalWithTVA
} from '@/utils';

// Données de démonstration
const medicamentsDemo: Medicament[] = [
  {
    id: '1',
    nom: 'Paracétamol 500mg',
    description: 'Antalgique et antipyrétique',
    prix: 250,
    quantiteStock: 150,
    seuilAlerte: 20,
    dateExpiration: new Date('2025-12-31'),
    categorie: 'Antalgiques',
    fournisseur: 'Pharma Plus',
    codeBarres: '3401579804567',
    dosage: '500mg',
    forme: 'comprimé',
    prescription: false,
    photo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxyZWN0IHg9IjIwIiB5PSIzMCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iI0VGNDQ0NCIvPgo8dGV4dCB4PSI1MCIgeT0iNTUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlBBUkE8L3RleHQ+Cjx0ZXh0IHg9IjUwIiB5PSI4NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmaWxsPSIjNjc3NDhGIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj41MDBtZzwvdGV4dD4KPC9zdmc+',
    dateAjout: new Date('2024-01-15'),
    dateModification: new Date('2024-01-15'),
  },
  {
    id: '2',
    nom: 'Amoxicilline 1g',
    description: 'Antibiotique à large spectre',
    prix: 1200,
    quantiteStock: 8,
    seuilAlerte: 10,
    dateExpiration: new Date('2025-06-30'),
    categorie: 'Antibiotiques',
    fournisseur: 'MediCorp',
    codeBarres: '3401579804568',
    dosage: '1g',
    forme: 'comprimé',
    prescription: true,
    photo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxyZWN0IHg9IjIwIiB5PSIzMCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iIzM5OEVGNyIvPgo8dGV4dCB4PSI1MCIgeT0iNTUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkFNT1g8L3RleHQ+Cjx0ZXh0IHg9IjUwIiB5PSI4NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmaWxsPSIjNjc3NDhGIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj4xZzwvdGV4dD4KPC9zdmc+',
    dateAjout: new Date('2024-02-01'),
    dateModification: new Date('2024-02-01'),
  },
  {
    id: '3',
    nom: 'Sirop contre la toux',
    description: 'Sirop expectorant',
    prix: 850,
    quantiteStock: 25,
    seuilAlerte: 15,
    dateExpiration: new Date('2025-03-15'),
    categorie: 'Sirops',
    fournisseur: 'Pharma Plus',
    codeBarres: '3401579804569',
    dosage: '100ml',
    forme: 'sirop',
    prescription: false,
    photo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxyZWN0IHg9IjMwIiB5PSIyMCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjYwIiByeD0iOCIgZmlsbD0iIzEwQjk4MSIvPgo8cmVjdCB4PSIzNSIgeT0iMjUiIHdpZHRoPSIzMCIgaGVpZ2h0PSI1MCIgZmlsbD0iIzZFRTdCNyIvPgo8dGV4dCB4PSI1MCIgeT0iNTUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlNJUk9QPC90ZXh0Pgo8dGV4dCB4PSI1MCIgeT0iOTAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzY3NzQ4RiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+MTAwbWw8L3RleHQ+Cjwvc3ZnPg==',
    dateAjout: new Date('2024-01-20'),
    dateModification: new Date('2024-01-20'),
  },
];

const clientsDemo: Client[] = [
  {
    id: '1',
    nom: 'Diallo',
    prenom: 'Amadou',
    telephone: '70 12 34 56',
    email: 'amadou.diallo@email.com',
    adresse: 'Quartier Liberté, Niamey',
    dateInscription: new Date('2024-01-10'),
  },
  {
    id: '2',
    nom: 'Kone',
    prenom: 'Fatima',
    telephone: '96 78 90 12',
    adresse: 'Plateau, Niamey',
    dateInscription: new Date('2024-02-15'),
  },
];

const fournisseursDemo: Fournisseur[] = [
  {
    id: '1',
    nom: 'Pharma Plus',
    contact: 'Moussa Ibrahim',
    telephone: '20 73 45 67',
    email: 'contact@pharmaplus.ne',
    adresse: 'Zone Industrielle, Niamey',
    dateAjout: new Date('2024-01-01'),
  },
  {
    id: '2',
    nom: 'MediCorp',
    contact: 'Aisha Garba',
    telephone: '20 73 45 68',
    email: 'info@medicorp.ne',
    adresse: 'Centre-ville, Niamey',
    dateAjout: new Date('2024-01-01'),
  },
];

export function usePharmacieData() {
  const [medicaments, setMedicaments] = useLocalStorage<Medicament[]>('medicaments', medicamentsDemo);
  const [ventes, setVentes] = useLocalStorage<Vente[]>('ventes', []);
  const [clients, setClients] = useLocalStorage<Client[]>('clients', clientsDemo);
  const [fournisseurs, setFournisseurs] = useLocalStorage<Fournisseur[]>('fournisseurs', fournisseursDemo);

  // Gestion des médicaments
  const ajouterMedicament = useCallback((medicament: Omit<Medicament, 'id' | 'dateAjout' | 'dateModification'>) => {
    const nouveauMedicament: Medicament = {
      ...medicament,
      id: generateId(),
      dateAjout: new Date(),
      dateModification: new Date(),
    };
    setMedicaments(prev => [...prev, nouveauMedicament]);
    return nouveauMedicament;
  }, [setMedicaments]);

  const modifierMedicament = useCallback((id: string, modifications: Partial<Medicament>) => {
    setMedicaments(prev => 
      prev.map(med => 
        med.id === id 
          ? { ...med, ...modifications, dateModification: new Date() }
          : med
      )
    );
  }, [setMedicaments]);

  const supprimerMedicament = useCallback((id: string) => {
    setMedicaments(prev => prev.filter(med => med.id !== id));
  }, [setMedicaments]);

  const mettreAJourStock = useCallback((id: string, nouvelleQuantite: number) => {
    modifierMedicament(id, { quantiteStock: nouvelleQuantite });
  }, [modifierMedicament]);

  // Gestion des ventes
  const ajouterVente = useCallback((vente: Omit<Vente, 'id' | 'numeroFacture' | 'date'>) => {
    const nouvelleVente: Vente = {
      ...vente,
      id: generateId(),
      numeroFacture: generateInvoiceNumber(),
      date: new Date(),
    };
    
    // Mettre à jour le stock
    vente.items.forEach(item => {
      const medicament = medicaments.find(med => med.id === item.medicamentId);
      if (medicament) {
        mettreAJourStock(item.medicamentId, medicament.quantiteStock - item.quantite);
      }
    });
    
    setVentes(prev => [...prev, nouvelleVente]);
    return nouvelleVente;
  }, [setVentes, medicaments, mettreAJourStock]);

  // Gestion des clients
  const ajouterClient = useCallback((client: Omit<Client, 'id' | 'dateInscription'>) => {
    const nouveauClient: Client = {
      ...client,
      id: generateId(),
      dateInscription: new Date(),
    };
    setClients(prev => [...prev, nouveauClient]);
    return nouveauClient;
  }, [setClients]);

  const modifierClient = useCallback((id: string, modifications: Partial<Client>) => {
    setClients(prev => 
      prev.map(client => 
        client.id === id ? { ...client, ...modifications } : client
      )
    );
  }, [setClients]);

  // Gestion des fournisseurs
  const ajouterFournisseur = useCallback((fournisseur: Omit<Fournisseur, 'id' | 'dateAjout'>) => {
    const nouveauFournisseur: Fournisseur = {
      ...fournisseur,
      id: generateId(),
      dateAjout: new Date(),
    };
    setFournisseurs(prev => [...prev, nouveauFournisseur]);
    return nouveauFournisseur;
  }, [setFournisseurs]);

  // Calcul des alertes
  const alertes = useMemo((): Alerte[] => {
    const alertesStock: Alerte[] = medicaments
      .filter(med => isLowStock(med.quantiteStock, med.seuilAlerte))
      .map(med => ({
        id: generateId(),
        type: 'stock_faible' as const,
        medicament: med,
        message: `Stock faible pour ${med.nom} (${med.quantiteStock} restant)`,
        date: new Date(),
        lue: false,
        priorite: med.quantiteStock === 0 ? 'haute' as const : 'moyenne' as const,
      }));

    const alertesExpiration: Alerte[] = medicaments
      .filter(med => isExpiringSoon(med.dateExpiration))
      .map(med => ({
        id: generateId(),
        type: 'expiration' as const,
        medicament: med,
        message: `${med.nom} expire bientôt`,
        date: new Date(),
        lue: false,
        priorite: isExpired(med.dateExpiration) ? 'haute' as const : 'moyenne' as const,
      }));

    return [...alertesStock, ...alertesExpiration];
  }, [medicaments]);

  // Calcul des statistiques de vente
  const statistiquesVente = useMemo((): StatistiquesVente => {
    const aujourd = new Date();
    const debutMois = new Date(aujourd.getFullYear(), aujourd.getMonth(), 1);
    const debutAnnee = new Date(aujourd.getFullYear(), 0, 1);

    const ventesAujourdhui = ventes.filter(vente => 
      vente.date.toDateString() === aujourd.toDateString()
    );
    
    const ventesDuMois = ventes.filter(vente => 
      vente.date >= debutMois
    );
    
    const ventesAnnuelles = ventes.filter(vente => 
      vente.date >= debutAnnee
    );

    // Médicaments les plus vendus
    const ventesParMedicament = new Map<string, { medicament: Medicament; quantite: number }>();
    
    ventes.forEach(vente => {
      vente.items.forEach(item => {
        const existing = ventesParMedicament.get(item.medicamentId);
        if (existing) {
          existing.quantite += item.quantite;
        } else {
          ventesParMedicament.set(item.medicamentId, {
            medicament: item.medicament,
            quantite: item.quantite,
          });
        }
      });
    });

    const medicamentsPlusVendus = Array.from(ventesParMedicament.values())
      .sort((a, b) => b.quantite - a.quantite)
      .slice(0, 5)
      .map(item => ({
        medicament: item.medicament,
        quantiteVendue: item.quantite,
      }));

    return {
      ventesDuJour: ventesAujourdhui.reduce((sum, vente) => sum + vente.total, 0),
      ventesDuMois: ventesDuMois.reduce((sum, vente) => sum + vente.total, 0),
      ventesAnnuelles: ventesAnnuelles.reduce((sum, vente) => sum + vente.total, 0),
      nombreTransactions: ventes.length,
      medicamentsPlusVendus,
    };
  }, [ventes]);

  // Calcul des statistiques de stock
  const statistiquesStock = useMemo((): StatistiquesStock => {
    const stockFaible = medicaments.filter(med => isLowStock(med.quantiteStock, med.seuilAlerte));
    const medicamentsExpires = medicaments.filter(med => isExpired(med.dateExpiration));
    const valeurTotaleStock = medicaments.reduce((sum, med) => sum + (med.prix * med.quantiteStock), 0);

    const alertesStock = stockFaible.map(med => ({
      medicament: med,
      quantiteRestante: med.quantiteStock,
    }));

    return {
      totalMedicaments: medicaments.length,
      stockFaible: stockFaible.length,
      medicamentsExpires: medicamentsExpires.length,
      valeurTotaleStock,
      alertesStock,
    };
  }, [medicaments]);

  return {
    // Données
    medicaments,
    ventes,
    clients,
    fournisseurs,
    alertes,
    
    // Actions médicaments
    ajouterMedicament,
    modifierMedicament,
    supprimerMedicament,
    mettreAJourStock,
    
    // Actions ventes
    ajouterVente,
    
    // Actions clients
    ajouterClient,
    modifierClient,
    
    // Actions fournisseurs
    ajouterFournisseur,
    
    // Statistiques
    statistiquesVente,
    statistiquesStock,
  };
}
