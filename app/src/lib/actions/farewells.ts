'use server'

import { revalidatePath } from 'next/cache'
import { IS_MOCK } from '@/lib/config'
import { isAdmin } from '@/lib/admin'
import type { DepartureType } from '@/types/database'

type ActionResult = { success: true } | { error: string }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any

function parseIntOrNull(value: FormDataEntryValue | null): number | null {
  if (!value) return null
  const n = parseInt(value as string, 10)
  return isNaN(n) ? null : n
}

function stringOrNull(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? '').trim()
  return text || null
}

async function requireAdmin(): Promise<AnySupabase> {
  const supabase = await import('@/lib/supabase/server').then(mod => mod.createClient())
  const { data: { user } } = await supabase.auth.getUser()
  if (!isAdmin(user?.email)) throw new Error('권한이 없습니다.')

  const { createClient: createServiceClient } = await import('@supabase/supabase-js')
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  ) as AnySupabase
}

export async function createFarewell(playerId: string, formData: FormData): Promise<{ error?: string }> {
  try {
    if (!playerId) throw new Error('선수를 선택해 주세요.')
    const supabase = await requireAdmin()

    const payload = {
      player_id: playerId,
      departure_type: (formData.get('departure_type') as DepartureType) || 'released',
      destination_club: stringOrNull(formData.get('destination_club')),
      departure_note: stringOrNull(formData.get('departure_note')),
      appearances: parseIntOrNull(formData.get('appearances')),
      goals: parseIntOrNull(formData.get('goals')),
      assists: parseIntOrNull(formData.get('assists')),
      clean_sheets: parseIntOrNull(formData.get('clean_sheets')),
      joined_at: stringOrNull(formData.get('joined_at')),
      left_at: stringOrNull(formData.get('left_at')),
      is_published: formData.get('is_published') === 'on',
      updated_at: new Date().toISOString(),
    }

    const { error: farewellError } = await supabase.from('farewells').insert(payload)
    if (farewellError) throw new Error(farewellError.message)

    const { error: playerError } = await supabase
      .from('players')
      .update({ is_active: false })
      .eq('id', playerId)
    if (playerError) throw new Error(playerError.message)

    revalidatePath('/')
    revalidatePath('/admin')
    revalidatePath('/club')
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function toggleFarewellPublished(
  farewellId: string,
  isPublished: boolean,
): Promise<{ error?: string }> {
  try {
    const supabase = await requireAdmin()
    const { error } = await supabase
      .from('farewells')
      .update({ is_published: isPublished, updated_at: new Date().toISOString() })
      .eq('id', farewellId)

    if (error) throw new Error(error.message)

    revalidatePath('/')
    revalidatePath('/admin')
    revalidatePath(`/farewells/${farewellId}`)
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function submitFarewellComment(
  farewellId: string,
  content: string,
): Promise<ActionResult> {
  if (!content.trim()) return { error: 'empty' }

  if (IS_MOCK) {
    revalidatePath(`/farewells/${farewellId}`)
    return { success: true }
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('farewell_comments')
    .insert({ farewell_id: farewellId, user_id: user.id, content: content.trim() })

  if (error) return { error: 'failed' }

  revalidatePath(`/farewells/${farewellId}`)
  revalidatePath('/')
  return { success: true }
}
