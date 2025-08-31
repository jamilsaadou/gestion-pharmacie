import { useState, useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { Client, Vente } from '@/types';
import { generateId } from '@/utils';

// Données de démonstration pour les clients
const clientsDemo: Client[] = [
  {
    id: '1',
    nom: 'Diallo',
    prenom: 'Amadou',
    telephone: '70 12 34 56',
    email: 'amadou.diallo@email.com',
    adresse: 'Quartier Liberté, Niamey',
    dateNaissance: new Date('1985-03-15'),
    numeroSecu: '1850315123456',
    dateInscription: new Date('2024-01-10'),
  },
  {
    id: '2',
    nom: 'Kone',
    prenom: 'Fatima',
    telephone: '96 78 90 12',
    email: 'fatima.kone@email.com',
    adresse: 'Plateau, Niamey',
    dateNaissance: new Date('1992-07-22'),
    numeroSecu: '2920722654321',
    dateInscription: new Date('2024-02-15'),
  },
  {
    id: '3',
    nom: 'Oumarou',
    prenom: 'Ibrahim',
    telephone: '90 45 67 89',
    adresse: 'Gamkallé, Niamey',
    dateNaissance: new Date('1978-11-08'),
    dateInscription: new Date('2024-03-01'),
  },
  {
    id: '4',
    nom: 'Saidou',
    prenom: 'Aïcha',
    telephone: '70 98 76 54',
    email: 'aicha.saidou@email.com',
    adresse: 'Kirkissoye, Niamey',
    dateNaissance: new Date('1990-05-12'),
    numeroSecu: '2900512987654',
    dateInscription: new Date('2024-01-25'),
  },
  {
    id: '5',
    nom: 'Mamadou',
    prenom: 'Zeinab',
    telephone: '96 12 34 78',
    adresse: 'Lazaret, Niamey',
    dateNaissance: new Date('1988-09-30'),
    dateInscription: new Date('2024-02-28'),
  },
];

export interface StatistiquesClient {
  totalClients: number;
  nouveauxClientsMois: number;
  clientsActifs: number;
  clientsFideles: Client[];
  repartitionParAge: {
    tranche: string;
    nombre: number;
  }[];
}

export function useClientData() {
  const [clients, setClients] = useLocalStorage<Client[]>('clients', clientsDemo);
  const [ventes] = useLocalStorage<Vente[]>('ventes', []);

  // Ajouter un nouveau client
  const ajouterClient = useCallback((clientData: Omit<Client, 'id' | 'dateInscription'>) => {
    const nouveauClient: Client = {
      ...clientData,
      id: generateId(),
      dateInscription: new Date(),
    };
    setClients(prev => [...prev, nouveauClient]);
    return nouveauClient;
  }, [setClients]);

  // Modifier un client existant
  const modifierClient = useCallback((id: string, modifications: Partial<Omit<Client, 'id' | 'dateInscription'>>) => {
    setClients(prev => 
      prev.map(client => 
        client.id === id ? { ...client, ...modifications } : client
      )
    );
  }, [setClients]);

  // Supprimer un client
  const supprimerClient = useCallback((id: string) => {
    setClients(prev => prev.filter(client => client.id !== id));
  }, [setClients]);

  // Rechercher des clients
  const rechercherClients = useCallback((terme: string) => {
    if (!terme.trim()) return clients;
    
    const termeNormalise = terme.toLowerCase().trim();
    return clients.filter(client => 
      client.nom.toLowerCase().includes(termeNormalise) ||
      client.prenom.toLowerCase().includes(termeNormalise) ||
      client.telephone?.includes(termeNormalise) ||
      client.email?.toLowerCase().includes(termeNormalise) ||
      client.numeroSecu?.includes(termeNormalise)
    );
  }, [clients]);

  // Obtenir un client par ID
  const obtenirClient = useCallback((id: string) => {
    return clients.find(client => client.id === id);
  }, [clients]);

  // Obtenir l'historique des achats d'un client
  const obtenirHistoriqueClient = useCallback((clientId: string) => {
    return ventes.filter(vente => vente.client?.id === clientId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [ventes]);

  // Calculer le total des achats d'un client
  const calculerTotalAchatsClient = useCallback((clientId: string) => {
    const ventesClient = obtenirHistoriqueClient(clientId);
    return ventesClient.reduce((total, vente) => total + vente.total, 0);
  }, [obtenirHistoriqueClient]);

  // Calculer l'âge d'un client
  const calculerAge = useCallback((dateNaissance?: Date) => {
    if (!dateNaissance) return null;
    const aujourd = new Date();
    const age = aujourd.getFullYear() - dateNaissance.getFullYear();
    const moisDiff = aujourd.getMonth() - dateNaissance.getMonth();
    
    if (moisDiff < 0 || (moisDiff === 0 && aujourd.getDate() < dateNaissance.getDate())) {
      return age - 1;
    }
    return age;
  }, []);

  // Statistiques des clients
  const statistiquesClients = useMemo((): StatistiquesClient => {
    const aujourd = new Date();
    const debutMois = new Date(aujourd.getFullYear(), aujourd.getMonth(), 1);

    // Nouveaux clients ce mois
    const nouveauxClientsMois = clients.filter(client => 
      new Date(client.dateInscription) >= debutMois
    ).length;

    // Clients actifs (qui ont fait au moins un achat)
    const clientsAvecAchats = new Set(ventes.map(vente => vente.client?.id).filter(Boolean));
    const clientsActifs = clientsAvecAchats.size;

    // Clients fidèles (plus de 5 achats)
    const achatsParClient = new Map<string, number>();
    ventes.forEach(vente => {
      if (vente.client?.id) {
        achatsParClient.set(vente.client.id, (achatsParClient.get(vente.client.id) || 0) + 1);
      }
    });

    const clientsFideles = clients
      .filter(client => (achatsParClient.get(client.id) || 0) >= 5)
      .sort((a, b) => (achatsParClient.get(b.id) || 0) - (achatsParClient.get(a.id) || 0))
      .slice(0, 10);

    // Répartition par âge
    const tranches = {
      '18-25': 0,
      '26-35': 0,
      '36-45': 0,
      '46-55': 0,
      '56-65': 0,
      '65+': 0,
      'Non renseigné': 0
    };

    clients.forEach(client => {
      const age = calculerAge(client.dateNaissance);
      if (age === null) {
        tranches['Non renseigné']++;
      } else if (age <= 25) {
        tranches['18-25']++;
      } else if (age <= 35) {
        tranches['26-35']++;
      } else if (age <= 45) {
        tranches['36-45']++;
      } else if (age <= 55) {
        tranches['46-55']++;
      } else if (age <= 65) {
        tranches['56-65']++;
      } else {
        tranches['65+']++;
      }
    });

    const repartitionParAge = Object.entries(tranches).map(([tranche, nombre]) => ({
      tranche,
      nombre
    }));

    return {
      totalClients: clients.length,
      nouveauxClientsMois,
      clientsActifs,
      clientsFideles,
      repartitionParAge,
    };
  }, [clients, ventes, calculerAge]);

  // Valider les données d'un client
  const validerClient = useCallback((clientData: Partial<Client>) => {
    const erreurs: string[] = [];

    if (!clientData.nom?.trim()) {
      erreurs.push('Le nom est obligatoire');
    }

    if (!clientData.prenom?.trim()) {
      erreurs.push('Le prénom est obligatoire');
    }

    if (clientData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientData.email)) {
      erreurs.push('L\'email n\'est pas valide');
    }

    if (clientData.telephone && !/^[0-9\s\-\+\(\)]{8,}$/.test(clientData.telephone)) {
      erreurs.push('Le numéro de téléphone n\'est pas valide');
    }

    if (clientData.numeroSecu && clientData.numeroSecu.length !== 13) {
      erreurs.push('Le numéro de sécurité sociale doit contenir 13 chiffres');
    }

    return {
      valide: erreurs.length === 0,
      erreurs
    };
  }, []);

  // Exporter les données clients
  const exporterClients = useCallback(() => {
    const donneesExport = clients.map(client => ({
      ...client,
      age: calculerAge(client.dateNaissance),
      totalAchats: calculerTotalAchatsClient(client.id),
      nombreAchats: obtenirHistoriqueClient(client.id).length,
    }));

    const csv = [
      'ID,Nom,Prénom,Téléphone,Email,Adresse,Âge,Date d\'inscription,Total achats,Nombre d\'achats',
      ...donneesExport.map(client => 
        `${client.id},"${client.nom}","${client.prenom}","${client.telephone || ''}","${client.email || ''}","${client.adresse || ''}",${client.age || ''},${client.dateInscription.toLocaleDateString()},${client.totalAchats},${client.nombreAchats}`
      )
    ].join('\n');

    return csv;
  }, [clients, calculerAge, calculerTotalAchatsClient, obtenirHistoriqueClient]);

  return {
    // Données
    clients,
    statistiquesClients,

    // Actions CRUD
    ajouterClient,
    modifierClient,
    supprimerClient,

    // Recherche et filtrage
    rechercherClients,
    obtenirClient,

    // Historique et statistiques
    obtenirHistoriqueClient,
    calculerTotalAchatsClient,
    calculerAge,

    // Utilitaires
    validerClient,
    exporterClients,
  };
}
