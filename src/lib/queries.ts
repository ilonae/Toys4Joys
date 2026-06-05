import { supabase } from './supabase'
import type { Product, Category, Level, BadgeType } from '@/types'

// ── Storage URL helper ────────────────────────────────────────────────────
// Products store only the filename in image_path.
// This function builds the full public URL.
export function productImageUrl(imagePath: string | null | undefined): string | undefined {
  if (!imagePath) return undefined
  // Already a full URL (e.g. migrated from Sanity or external CDN)
  if (imagePath.startsWith('http')) return imagePath
  const { data } = supabase.storage.from('product-images').getPublicUrl(imagePath)
  return data.publicUrl
}

// ── Column list (matches schema.sql) ─────────────────────────────────────
export const PRODUCT_COLS = 'id, name, brand, cat, sub, price, old_price, badge, rating, rev, mat, lvl, description, image_path, image_paths, featured, stock, name_translations, desc_translations'
const COLS = PRODUCT_COLS

// ── Row → Product ─────────────────────────────────────────────────────────
export function mapProduct(row: Record<string, unknown>): Product {
  // image_paths is a Postgres text[] — Supabase returns it as string[]
  const paths = Array.isArray(row.image_paths) && (row.image_paths as string[]).length > 0
    ? row.image_paths as string[]
    : row.image_path ? [row.image_path as string] : []

  const images = paths.map(p => productImageUrl(p)).filter((u): u is string => !!u)

  return {
    id:     String(row.id),
    name:   String(row.name        ?? ''),
    brand:  String(row.brand       ?? ''),
    cat:    row.cat as Category,
    sub:    String(row.sub         ?? ''),
    price:  Number(row.price),
    old:    row.old_price != null   ? Number(row.old_price) : null,
    badge:  (row.badge as BadgeType) ?? null,
    rating: Number(row.rating      ?? 0),
    rev:    Number(row.rev         ?? 0),
    mat:    String(row.mat         ?? ''),
    lvl:    (row.lvl ?? 'All levels') as Level,
    desc:              String(row.description ?? ''),
    image:             images[0],
    images,
    stock:             Number(row.stock ?? 0),
    name_translations: (row.name_translations as Record<string, string>) ?? {},
    desc_translations: (row.desc_translations as Record<string, string>) ?? {},
  }
}

// ── Public query functions ────────────────────────────────────────────────

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(COLS)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapProduct)
}

export async function fetchFeaturedProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(COLS)
    .eq('featured', true)
    .limit(8)
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapProduct)
}

export async function fetchRelatedProducts(cat: string, excludeId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(COLS)
    .eq('cat', cat)
    .neq('id', excludeId)
    .limit(4)
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapProduct)
}

export async function fetchSubcategories(cat: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('products')
    .select('sub')
    .eq('cat', cat)
    .not('sub', 'is', null)
    .neq('sub', '')
  if (error) throw new Error(error.message)
  return [...new Set((data ?? []).map(r => String(r.sub)))].sort()
}
