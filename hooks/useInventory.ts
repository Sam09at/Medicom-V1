import { useState, useEffect, useCallback } from 'react';
import { useMedicomStore } from '../store';
import {
  getInventoryItems,
  upsertInventoryItem,
  setItemQuantity,
  softDeleteInventoryItem,
  InventoryItem,
} from '../lib/api/inventory';

export function useInventory() {
  const { currentTenant, showToast } = useMedicomStore();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!currentTenant) { setLoading(false); return; }
    setLoading(true);
    const data = await getInventoryItems(currentTenant.id);
    setItems(data);
    setLoading(false);
  }, [currentTenant]);

  useEffect(() => { refetch(); }, [refetch]);

  const save = async (
    item: Omit<InventoryItem, 'tenantId' | 'isLow' | 'createdAt' | 'updatedAt'>
  ) => {
    if (!currentTenant) return;
    const result = await upsertInventoryItem(currentTenant.id, item);
    if (result) {
      await refetch();
      showToast({ type: 'success', message: 'Article enregistré.' });
    } else {
      showToast({ type: 'error', message: "Impossible d'enregistrer l'article." });
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    const ok = await setItemQuantity(itemId, quantity);
    if (ok) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === itemId ? { ...i, quantity, isLow: quantity <= i.minThreshold } : i
        )
      );
    } else {
      showToast({ type: 'error', message: 'Impossible de mettre à jour la quantité.' });
    }
  };

  const remove = async (itemId: string) => {
    const ok = await softDeleteInventoryItem(itemId);
    if (ok) setItems((prev) => prev.filter((i) => i.id !== itemId));
    else showToast({ type: 'error', message: "Impossible de supprimer l'article." });
  };

  const lowStockCount = items.filter((i) => i.isLow).length;

  return { items, loading, lowStockCount, save, updateQuantity, remove, refetch };
}
