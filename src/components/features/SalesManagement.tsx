import { useState, useMemo } from 'react';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { usePharmacieData } from '@/hooks/usePharmacieData';
import type { Vente, Medicament, Client } from '@/types';
import { Search, ShoppingCart, Plus, Minus, Package, X } from 'lucide-react';

interface CartItem {
  medicament: Medicament;
  quantite: number;
  remise: number;
}

export const SalesManagement = () => {
  const { ventes, ajouterVente, medicaments, clients } = usePharmacieData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | undefined>();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'especes' | 'carte' | 'cheque' | 'virement'>('especes');
  const [globalDiscount, setGlobalDiscount] = useState(0);

  // Filter medications based on search and category
  const filteredMedicaments = useMemo(() => {
    return medicaments.filter(med => {
      const matchesSearch = med.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           med.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || med.categorie === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [medicaments, searchTerm, selectedCategory]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = [...new Set(medicaments.map(med => med.categorie))];
    return cats.filter(Boolean);
  }, [medicaments]);

  // Calculate cart totals
  const cartTotals = useMemo(() => {
    const sousTotal = cart.reduce((sum, item) => {
      const itemTotal = item.medicament.prix * item.quantite;
      const itemDiscount = itemTotal * (item.remise / 100);
      return sum + (itemTotal - itemDiscount);
    }, 0);
    
    const globalDiscountAmount = sousTotal * (globalDiscount / 100);
    const afterDiscount = sousTotal - globalDiscountAmount;
    const tva = afterDiscount * 0.18; // 18% TVA
    const total = afterDiscount + tva;

    return { sousTotal, globalDiscountAmount, tva, total };
  }, [cart, globalDiscount]);

  const addToCart = (medicament: Medicament) => {
    const existingItem = cart.find(item => item.medicament.id === medicament.id);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.medicament.id === medicament.id
          ? { ...item, quantite: item.quantite + 1 }
          : item
      ));
    } else {
      setCart([...cart, { medicament, quantite: 1, remise: 0 }]);
    }
  };

  const updateCartItemQuantity = (medicamentId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(medicamentId);
      return;
    }
    
    setCart(cart.map(item =>
      item.medicament.id === medicamentId
        ? { ...item, quantite: newQuantity }
        : item
    ));
  };

  const updateCartItemDiscount = (medicamentId: string, discount: number) => {
    setCart(cart.map(item =>
      item.medicament.id === medicamentId
        ? { ...item, remise: Math.max(0, Math.min(100, discount)) }
        : item
    ));
  };

  const removeFromCart = (medicamentId: string) => {
    setCart(cart.filter(item => item.medicament.id !== medicamentId));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedClient(undefined);
    setGlobalDiscount(0);
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;

    const saleItems = cart.map(item => ({
      id: Math.random().toString(36).substring(2, 9),
      medicamentId: item.medicament.id,
      medicament: item.medicament,
      quantite: item.quantite,
      remise: item.remise,
      prixUnitaire: item.medicament.prix,
      sousTotal: item.medicament.prix * item.quantite * (1 - item.remise / 100)
    }));

    const newSale = {
      client: selectedClient,
      vendeur: 'admin',
      items: saleItems,
      sousTotal: cartTotals.sousTotal,
      tva: cartTotals.tva,
      remise: globalDiscount,
      total: cartTotals.total,
      methodePaiement: paymentMethod,
      statut: 'en_cours' as const
    };

    ajouterVente(newSale);
    clearCart();
    setIsCheckoutOpen(false);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Point de Vente</h1>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Button
                onClick={() => setIsCheckoutOpen(true)}
                className="flex items-center space-x-2"
                disabled={cart.length === 0}
              >
                <ShoppingCart size={20} />
                <span>Panier ({cart.length})</span>
                {cart.length > 0 && (
                  <span className="bg-emerald-600 text-white text-xs px-2 py-1 rounded-full">
                    {cartTotals.total.toFixed(0)} FCFA
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              type="text"
              placeholder="Rechercher un médicament..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">Toutes les catégories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </Select>
        </div>
      </div>

      {/* Products Grid */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMedicaments.map((medicament) => (
            <Card key={medicament.id} className="hover:shadow-lg transition-shadow">
              <div className="p-4">
                {/* Product Image Placeholder */}
                <div className="w-full h-32 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-lg mb-4 flex items-center justify-center">
                  <Package className="text-emerald-600" size={40} />
                </div>
                
                {/* Product Info */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900 line-clamp-2">{medicament.nom}</h3>
                  <p className="text-sm text-gray-600">{medicament.categorie}</p>
                  <p className="text-sm text-gray-500 line-clamp-2">{medicament.description}</p>
                  
                  {/* Stock Status */}
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      medicament.quantiteStock > 10 
                        ? 'bg-green-100 text-green-800' 
                        : medicament.quantiteStock > 0 
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      Stock: {medicament.quantiteStock}
                    </span>
                    <span className="font-bold text-emerald-600">{medicament.prix} FCFA</span>
                  </div>
                  
                  {/* Add to Cart Button */}
                  <Button
                    onClick={() => addToCart(medicament)}
                    disabled={medicament.quantiteStock === 0}
                    className="w-full mt-3"
                    size="sm"
                  >
                    <Plus size={16} className="mr-1" />
                    Ajouter au panier
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredMedicaments.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-500">Aucun médicament trouvé</p>
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      <Modal 
        isOpen={isCheckoutOpen} 
        onClose={() => setIsCheckoutOpen(false)} 
        title="Finaliser la vente"
        size="lg"
      >
        <div className="space-y-6">
          {/* Client Selection */}
          <Select
            label="Client"
            value={selectedClient?.id || ''}
            onChange={(e) => {
              const client = clients.find(c => c.id === e.target.value);
              setSelectedClient(client);
            }}
          >
            <option value="">Client anonyme</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.nom} {client.prenom}
              </option>
            ))}
          </Select>

          {/* Cart Items */}
          <div className="space-y-4">
            <h3 className="font-semibold">Articles dans le panier</h3>
            {cart.map((item) => (
              <div key={item.medicament.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Package className="text-emerald-600" size={20} />
                </div>
                
                <div className="flex-1">
                  <h4 className="font-medium">{item.medicament.nom}</h4>
                  <p className="text-sm text-gray-600">{item.medicament.prix} FCFA/unité</p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateCartItemQuantity(item.medicament.id, item.quantite - 1)}
                  >
                    <Minus size={16} />
                  </Button>
                  <span className="w-8 text-center">{item.quantite}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateCartItemQuantity(item.medicament.id, item.quantite + 1)}
                  >
                    <Plus size={16} />
                  </Button>
                </div>
                
                <div className="w-20">
                  <Input
                    type="number"
                    placeholder="Remise %"
                    value={item.remise}
                    onChange={(e) => updateCartItemDiscount(item.medicament.id, parseFloat(e.target.value) || 0)}
                    min="0"
                    max="100"
                  />
                </div>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => removeFromCart(item.medicament.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X size={16} />
                </Button>
              </div>
            ))}
          </div>

          {/* Global Discount and Payment Method */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              label="Remise globale (%)"
              value={globalDiscount}
              onChange={(e) => setGlobalDiscount(parseFloat(e.target.value) || 0)}
              min="0"
              max="100"
            />
            <Select
              label="Méthode de paiement"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
            >
              <option value="especes">Espèces</option>
              <option value="carte">Carte</option>
              <option value="cheque">Chèque</option>
              <option value="virement">Virement</option>
            </Select>
          </div>

          {/* Totals */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span>Sous-total:</span>
              <span>{cartTotals.sousTotal.toFixed(0)} FCFA</span>
            </div>
            {globalDiscount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Remise ({globalDiscount}%):</span>
                <span>-{cartTotals.globalDiscountAmount.toFixed(0)} FCFA</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>TVA (18%):</span>
              <span>{cartTotals.tva.toFixed(0)} FCFA</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total:</span>
              <span>{cartTotals.total.toFixed(0)} FCFA</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-4">
            <Button variant="outline" onClick={clearCart} className="flex-1">
              Vider le panier
            </Button>
            <Button onClick={handleCheckout} className="flex-1">
              Confirmer la vente
            </Button>
          </div>
        </div>
      </Modal>

      {/* Recent Sales */}
      <div className="bg-white border-t border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Ventes récentes</h2>
        <div className="grid gap-4 max-h-40 overflow-y-auto">
          {ventes.slice(0, 3).map((vente) => (
            <Card key={vente.id}>
              <div className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Facture #{vente.numeroFacture}</h3>
                    <p className="text-sm text-gray-600">
                      {vente.client?.nom || 'Client anonyme'} - {new Date(vente.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-600">{vente.total} FCFA</p>
                    <p className="text-sm text-gray-600">{vente.methodePaiement}</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
