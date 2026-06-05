export type Page = 'home' | 'shop' | 'product' | 'cart' | 'checkout' | 'about' | 'shipping' | 'privacy' | 'terms' | 'imprint' | 'press' | 'withdrawal' | 'profile' | 'admin'

export type BadgeType = 'sale' | 'bestseller' | 'new' | 'expert' | null

export type Level = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' | 'All levels'

export interface Product {
  id: string
  name: string
  brand: string
  cat: Category
  sub: string
  price: number
  old: number | null
  badge: BadgeType
  rating: number
  rev: number
  mat: string
  lvl: Level
  desc: string
  stock: number
  supplier_sku?: string | null   // SKU from the supplier/wholesaler
  image?: string                 // primary image URL (resolved)
  images: string[]               // all image URLs in display order
}

export type Category =
  | 'Latex & Fetischwear'
  | 'BDSM & Kontrolle'
  | 'Vibratoren & Elektro'
  | 'Dildos'
  | 'Anal'

export interface CategoryDef {
  name: 'Alle' | Category
  subs: string[]
}

export interface CartItem {
  product: Product
  qty: number
}

// ── Orders ────────────────────────────────────────────────────

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'

export interface OrderItem {
  id: string
  product_id: string | null
  name: string
  price: number
  qty: number
  image_path: string | null
}

export interface Order {
  id: string
  email: string
  status: OrderStatus
  subtotal: number
  shipping_cost: number
  total: number
  shipping_address: Record<string, string> | null
  stripe_payment_intent_id: string | null
  tracking_number: string | null
  created_at: string
  updated_at: string
  order_items: OrderItem[]
}

export interface ShippingAddress {
  firstName: string
  lastName:  string
  email:     string
  street:    string
  zip:       string
  city:      string
  country:   string
}
