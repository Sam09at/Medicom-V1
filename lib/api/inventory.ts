import { supabase } from '../supabase';

interface InventoryItemRow {
  id: string;
  tenant_id: string;
  name: string;
  category: string | null;
  quantity: number;
  min_threshold: number;
  unit: string;
  supplier: string | null;
  unit_price: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  id: string;
  tenantId: string;
  name: string;
  category: string | null;
  quantity: number;
  minThreshold: number;
  unit: string;
  supplier: string | null;
  unitPrice: number | null;
  isActive: boolean;
  isLow: boolean;
  createdAt: string;
  updatedAt: string;
}

function toInventoryItem(row: InventoryItemRow): InventoryItem {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    category: row.category,
    quantity: row.quantity,
    minThreshold: row.min_threshold,
    unit: row.unit,
    supplier: row.supplier,
    unitPrice: row.unit_price,
    isActive: row.is_active,
    isLow: row.quantity <= row.min_threshold,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getInventoryItems(tenantId: string): Promise<InventoryItem[]> {
  if (!supabase) {
    const { MOCK_INVENTORY } = await import('../../constants');
    return (MOCK_INVENTORY as any[]).map((item: any) => ({
      id: item.id,
      tenantId,
      name: item.name,
      category: item.category ?? null,
      quantity: item.quantity ?? item.stock ?? 0,
      minThreshold: item.minThreshold ?? item.minQuantity ?? 5,
      unit: item.unit ?? 'unité',
      supplier: item.supplier ?? null,
      unitPrice: item.unitPrice ?? item.price ?? null,
      isActive: true,
      isLow: (item.quantity ?? item.stock ?? 0) <= (item.minThreshold ?? item.minQuantity ?? 5),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  }

  const { data } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('name');

  return (data ?? []).map((r) => toInventoryItem(r as InventoryItemRow));
}

export async function upsertInventoryItem(
  tenantId: string,
  item: Omit<InventoryItem, 'id' | 'tenantId' | 'isLow' | 'createdAt' | 'updatedAt'> & { id?: string }
): Promise<InventoryItem | null> {
  if (!supabase) return null;

  const row: Partial<InventoryItemRow> & { tenant_id: string } = {
    tenant_id: tenantId,
    name: item.name,
    category: item.category,
    quantity: item.quantity,
    min_threshold: item.minThreshold,
    unit: item.unit,
    supplier: item.supplier,
    unit_price: item.unitPrice,
    is_active: item.isActive,
  };
  if (item.id) row.id = item.id;

  const { data, error } = await supabase
    .from('inventory_items')
    .upsert(row, { onConflict: 'id' })
    .select()
    .single();

  if (error || !data) return null;
  return toInventoryItem(data as InventoryItemRow);
}

export async function setItemQuantity(itemId: string, quantity: number): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from('inventory_items')
    .update({ quantity })
    .eq('id', itemId);
  return !error;
}

export async function softDeleteInventoryItem(itemId: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from('inventory_items')
    .update({ is_active: false })
    .eq('id', itemId);
  return !error;
}
