/**
 * Shared auth helper for Vercel API functions.
 *
 * Usage:
 *   const user = await getVerifiedAdmin(req, supabase)
 *   if (!user) return res.status(401).json({ error: 'Unauthorized' })
 */
import type { VercelRequest } from '@vercel/node'
import type { SupabaseClient } from '@supabase/supabase-js'

export async function getVerifiedUser(req: VercelRequest, supabase: SupabaseClient) {
  const auth = req.headers['authorization']
  if (!auth?.startsWith('Bearer ')) return null
  const token = auth.slice(7)
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null
  return user
}

export async function getVerifiedAdmin(req: VercelRequest, supabase: SupabaseClient) {
  const user = await getVerifiedUser(req, supabase)
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return null
  return user
}
