// Types pour les médicaments
export interface Medicament {
  id: string;
  nom: string;
  description: string;
  prix: number;
  quantiteStock: number;
  seuilAlerte: number;
  dateExpiration: Date;
  categorie: string;
  fournisseur: string;
  codeBarres?: string;
  dosage?: string;
  forme: 'comprimé' | 'gélule' | 'sirop' | 'injection' | 'pommade' | 'autre';
  prescription: boolean;
  photo?: string; // URL ou base64 de l'image
  dateAjout: Date;
  dateModification: Date;
}

// Types pour les ventes
export interface Vente {
  id: string;
  numeroFacture: string;
  date: Date;
  client?: Client;
  items: ItemVente[];
  sousTotal: number;
  tva: number;
  remise: number;
  total: number;
  methodePaiement: 'especes' | 'carte' | 'cheque' | 'virement';
  statut: 'en_cours' | 'terminee' | 'annulee';
  vendeur: string;
}

export interface ItemVente {
  id: string;
  medicamentId: string;
  medicament?: Medicament;
  quantite: number;
  prixUnitaire: number;
  remise: number;
  sousTotal: number;
}

// Types pour les clients
export interface Client {
  id: string;
  nom: string;
  prenom: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  dateNaissance?: Date;
  numeroSecu?: string;
  dateInscription: Date;
}

// Types pour les fournisseurs
export interface Fournisseur {
  id: string;
  nom: string;
  contact: string;
  telephone: string;
  email?: string;
  adresse: string;
  dateAjout: Date;
}

// Types pour les commandes fournisseurs
export interface CommandeFournisseur {
  id: string;
  numeroCommande: string;
  fournisseur: Fournisseur;
  date: Date;
  items: ItemCommande[];
  statut: 'en_attente' | 'confirmee' | 'livree' | 'annulee';
  total: number;
  dateReception?: Date;
}

export interface ItemCommande {
  id: string;
  medicamentId: string;
  medicament: Medicament;
  quantiteCommandee: number;
  quantiteRecue?: number;
  prixUnitaire: number;
  sousTotal: number;
}

// Types pour les statistiques
export interface StatistiquesVente {
  ventesDuJour: number;
  ventesDuMois: number;
  ventesAnnuelles: number;
  nombreTransactions: number;
  medicamentsPlusVendus: {
    medicament: Medicament;
    quantiteVendue: number;
  }[];
}

export interface StatistiquesStock {
  totalMedicaments: number;
  stockFaible: number;
  medicamentsExpires: number;
  valeurTotaleStock: number;
  alertesStock: {
    medicament: Medicament;
    quantiteRestante: number;
  }[];
}

// Types pour les alertes
export interface Alerte {
  id: string;
  type: 'stock_faible' | 'expiration' | 'rupture';
  medicament: Medicament;
  message: string;
  date: Date;
  lue: boolean;
  priorite: 'basse' | 'moyenne' | 'haute';
}

// Types pour les utilisateurs
export interface Utilisateur {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: 'admin' | 'pharmacien' | 'vendeur';
  dateCreation: Date;
  actif: boolean;
}

// Types pour les filtres et recherches
export interface FiltresMedicaments {
  nom?: string;
  categorie?: string;
  fournisseur?: string;
  stockFaible?: boolean;
  expiresSoon?: boolean;
  prescription?: boolean;
}

export interface FiltresVentes {
  dateDebut?: Date;
  dateFin?: Date;
  client?: string;
  vendeur?: string;
  methodePaiement?: string;
  statut?: string;
}

// Types pour les modals et UI
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export interface TableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
}

// Types pour les rayons
export interface Rayon {
  id: string;
  nom: string;
  description: string;
  emplacement: string;
  capaciteMax: number;
  dateCreation: Date;
  dateModification: Date;
}

export interface MedicamentRayon {
  id: string;
  medicamentId: string;
  medicament?: Medicament;
  rayonId: string;
  rayon?: Rayon;
  quantiteEnRayon: number;
  quantiteMinimale: number;
  dateTransfert: Date;
  statut: 'en_vente' | 'reserve' | 'expire';
}

export interface TransfertRayon {
  id: string;
  medicamentId: string;
  medicament?: Medicament;
  rayonId: string;
  rayon?: Rayon;
  quantiteTransferee: number;
  typeTransfert: 'stock_vers_rayon' | 'rayon_vers_stock' | 'rayon_vers_rayon';
  rayonDestinationId?: string;
  rayonDestination?: Rayon;
  date: Date;
  utilisateur: string;
  commentaire?: string;
}

// Types pour les formulaires
export interface FormulaireMedicament {
  nom: string;
  description: string;
  prix: string;
  quantiteStock: string;
  seuilAlerte: string;
  dateExpiration: string;
  categorie: string;
  fournisseur: string;
  codeBarres?: string;
  dosage: string;
  forme: Medicament['forme'];
  prescription: boolean;
}

export interface FormulaireVente {
  client?: Client;
  items: {
    medicamentId: string;
    quantite: number;
    remise: number;
  }[];
  remiseGlobale: number;
  methodePaiement: Vente['methodePaiement'];
}

export interface FormulaireRayon {
  nom: string;
  description: string;
  emplacement: string;
  capaciteMax: string;
}

export interface FormulaireTransfertRayon {
  medicamentId: string;
  rayonId: string;
  quantite: string;
  typeTransfert: TransfertRayon['typeTransfert'];
  rayonDestinationId?: string;
  commentaire?: string;
}
