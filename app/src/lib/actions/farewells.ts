'use server'

import { revalidatePath } from 'next/cache'
import { IS_MOCK } from '@/lib/config'
import type { DepartureType } from '@/types/database'
import type { FarewellCommentItem } from '@/lib/queries/farewells'
import { requireAdminClient, type AnySupabase } from '@/lib/supabase/admin'

type ActionResult = { success: true; comment: FarewellCommentItem } | { error: string }

function parseIntOrNull(value: FormDataEntryValue | null): number | null {
  if (!value) return null
  const n = parseInt(value as string, 10)
  return isNaN(n) ? null : n
}

function stringOrNull(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? '').trim()
  return text || null
}

function isMissingRelationError(error: unknown): boolean {
  const message = String((error as { message?: string } | null)?.message ?? '')
  return message.includes('schema cache') || message.includes('does not exist')
}

function seasonStartYear(season: string): number | null {
  const match = season.match(/\d{4}/)
  return match ? parseInt(match[0], 10) : null
}

function seasonEndYear(season: string): number | null {
  const start = seasonStartYear(season)
  if (!start) return null
  const shortEnd = season.match(/-(\d{2})$/)?.[1]
  if (shortEnd) {
    const century = Math.floor(start / 100) * 100
    const end = century + parseInt(shortEnd, 10)
    return end < start ? end + 100 : end
  }
  return start
}

async function getCareerSummary(supabase: AnySupabase, playerId: string) {
  const { data, error } = await supabase
    .from('player_season_stats')
    .select('season, appearances, goals, assists')
    .eq('player_id', playerId)

  if (error && isMissingRelationError(error)) {
    return { appearances: null, goals: null, assists: null, joined_at: null, left_at: null }
  }

  const rows = (data ?? []) as Array<{ season: string; appearances: number; goals: number; assists: number }>
  if (rows.length === 0) {
    return { appearances: null, goals: null, assists: null, joined_at: null, left_at: null }
  }

  const startYears = rows.map(row => seasonStartYear(row.season)).filter((year): year is number => year !== null)
  const endYears = rows.map(row => seasonEndYear(row.season)).filter((year): year is number => year !== null)

  return {
    appearances: rows.reduce((sum, row) => sum + (row.appearances ?? 0), 0),
    goals: rows.reduce((sum, row) => sum + (row.goals ?? 0), 0),
    assists: rows.reduce((sum, row) => sum + (row.assists ?? 0), 0),
    joined_at: startYears.length > 0 ? `${Math.min(...startYears)}-07-01` : null,
    left_at: endYears.length > 0 ? `${Math.max(...endYears)}-06-30` : null,
  }
}

async function requireAdmin(): Promise<AnySupabase> {
  return requireAdminClient()
}

export async function createFarewell(playerId: string, formData: FormData): Promise<{ error?: string }> {
  try {
    if (!playerId) throw new Error('?좎닔瑜??좏깮?댁＜?몄슂.')
    const supabase = await requireAdmin()
    const careerSummary = await getCareerSummary(supabase, playerId)
    const departureType = (formData.get('departure_type') as DepartureType) || 'released'

    const payload = {
      player_id: playerId,
      departure_type: departureType,
      destination_club: departureType === 'contract_expired' ? 'FA' : stringOrNull(formData.get('destination_club')),
      departure_note: stringOrNull(formData.get('departure_note')),
      appearances: careerSummary.appearances,
      goals: careerSummary.goals,
      assists: careerSummary.assists,
      clean_sheets: parseIntOrNull(formData.get('clean_sheets')),
      joined_at: careerSummary.joined_at,
      left_at: careerSummary.left_at,
      is_published: formData.get('is_published') === 'on',
      updated_at: new Date().toISOString(),
    }

    const { error: farewellError } = await supabase.from('farewells').insert(payload)
    if (farewellError) throw new Error(farewellError.message)

    if (departureType === 'transferred' || departureType === 'contract_expired' || departureType === 'released') {
      const { error: playerError } = await supabase
        .from('players')
        .update({ is_active: false })
        .eq('id', playerId)
      if (playerError) throw new Error(playerError.message)
    }

    if (departureType === 'loan_out') {
      const { error: playerError } = await supabase
        .from('players')
        .update({ squad_status: 'loan' })
        .eq('id', playerId)
      if (playerError) throw new Error(playerError.message)
    }

    revalidatePath('/')
    revalidatePath('/admin')
    revalidatePath('/club')
    revalidatePath('/transfers')
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
    revalidatePath('/transfers')
    revalidatePath(`/farewells/${farewellId}`)
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function updateFarewell(farewellId: string, formData: FormData): Promise<{ error?: string }> {
  try {
    const supabase = await requireAdmin()
    const departureType = (formData.get('departure_type') as DepartureType) || 'transferred'
    const destinationClub = departureType === 'contract_expired' ? 'FA' : stringOrNull(formData.get('destination_club'))

    const { error } = await supabase
      .from('farewells')
      .update({
        departure_type: departureType,
        destination_club: destinationClub,
        departure_note: stringOrNull(formData.get('departure_note')),
        updated_at: new Date().toISOString(),
      })
      .eq('id', farewellId)

    if (error) throw new Error(error.message)

    revalidatePath('/')
    revalidatePath('/admin')
    revalidatePath('/transfers')
    revalidatePath(`/farewells/${farewellId}`)
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function restorePlayerFromFarewell(farewellId: string, playerId: string): Promise<{ error?: string }> {
  try {
    if (!playerId) throw new Error('선수 정보가 없습니다.')
    const supabase = await requireAdmin()

    const { error: playerError } = await supabase
      .from('players')
      .update({
        is_active: true,
        squad_status: 'first_team',
      })
      .eq('id', playerId)
    if (playerError) throw new Error(playerError.message)

    const { error: farewellError } = await supabase
      .from('farewells')
      .update({
        is_published: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', farewellId)
    if (farewellError) throw new Error(farewellError.message)

    revalidatePath('/')
    revalidatePath('/admin')
    revalidatePath('/club')
    revalidatePath('/transfers')
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
    const comment = {
      id: `mock-${Date.now()}`,
      farewell_id: farewellId,
      content: content.trim(),
      created_at: new Date().toISOString(),
      user: { display_name: 'Mock user', avatar_url: null },
    }
    revalidatePath(`/farewells/${farewellId}`)
    return { success: true, comment }
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('farewell_comments')
    .insert({ farewell_id: farewellId, user_id: user.id, content: content.trim() })
    .select(`
      id, farewell_id, content, created_at,
      user:public_profiles!farewell_comments_public_profiles_user_id_fkey(display_name, avatar_url)
    `)
    .single()

  if (error) return { error: 'failed' }

  revalidatePath(`/farewells/${farewellId}`)
  revalidatePath('/')
  return {
    success: true,
    comment: {
      id: data.id,
      farewell_id: data.farewell_id,
      content: data.content,
      created_at: data.created_at,
      user: {
        display_name: data.user?.display_name ?? user.user_metadata?.name ?? user.email ?? null,
        avatar_url: data.user?.avatar_url ?? user.user_metadata?.avatar_url ?? null,
      },
    },
  }
}
