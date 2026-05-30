'use server'

import { revalidatePath } from 'next/cache'
import type { PlayerStatus, PollType, Position } from '@/types/database'
import { requireAdminClient, type AnySupabase } from '@/lib/supabase/admin'

function parseIntOrNull(value: FormDataEntryValue | null): number | null {
  if (!value) return null
  const n = parseInt(value as string, 10)
  return isNaN(n) ? null : n
}

function parseIntOrZero(value: unknown): number {
  const n = parseInt(String(value ?? ''), 10)
  return isNaN(n) ? 0 : Math.max(0, n)
}

function isMissingColumnError(error: unknown): boolean {
  const message = String((error as { message?: string } | null)?.message ?? '')
  return message.includes('column') && message.includes('does not exist')
}

function isMissingRelationError(error: unknown): boolean {
  const message = String((error as { message?: string } | null)?.message ?? '')
  return message.includes('schema cache') || message.includes('does not exist')
}

async function requireAdmin(): Promise<AnySupabase> {
  return requireAdminClient()
}


export async function updateClubStatus(formData: FormData): Promise<{ error?: string }> {
  try {
    const supabase = await requireAdmin()

    const payload = {
      league_rank: parseIntOrNull(formData.get('league_rank')),
      next_match_opponent: (formData.get('next_match_opponent') as string)?.trim() || null,
      next_match_date: (formData.get('next_match_date') as string)?.trim() || null,
      next_match_venue: (formData.get('next_match_venue') as string)?.trim() as 'home' | 'away' | null || null,
      top_appearances_player_id: formData.get('top_appearances_player_id') as string || null,
      top_appearances_count: parseIntOrNull(formData.get('top_appearances_count')),
      top_goals_player_id: formData.get('top_goals_player_id') as string || null,
      top_goals_count: parseIntOrNull(formData.get('top_goals_count')),
      top_assists_player_id: formData.get('top_assists_player_id') as string || null,
      top_assists_count: parseIntOrNull(formData.get('top_assists_count')),
      updated_at: new Date().toISOString(),
    }

    // club_status is a singleton table ??always a single row with id=1
    const { error } = await supabase.from('club_status').update(payload).eq('id', 1)
    if (error) throw new Error(error.message)

    revalidatePath('/club')
    revalidatePath('/admin')
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function createPlayer(formData: FormData): Promise<{ error?: string; playerId?: string }> {
  try {
    const supabase = await requireAdmin()

    const name = formData.get('name') as string
    if (!name) throw new Error('?대쫫? ?꾩닔?낅땲??')

    const payload = {
      name,
      position: formData.get('position') as Position,
      squad_number: parseIntOrNull(formData.get('squad_number')),
      photo_url: formData.get('photo_url') as string || null,
      squad_status: (formData.get('squad_status') as PlayerStatus) || 'first_team',
      nationality: formData.get('nationality') as string || null,
      birth_date: formData.get('birth_date') as string || null,
    }

    let { data, error } = await supabase.from('players').insert(payload).select('id').single()
    if (error && isMissingColumnError(error)) {
      const fallbackPayload = {
        name: payload.name,
        position: payload.position,
        squad_number: payload.squad_number,
        photo_url: payload.photo_url,
        nationality: payload.nationality,
        birth_date: payload.birth_date,
      }
      const fallback = await supabase.from('players').insert(fallbackPayload).select('id').single()
      data = fallback.data
      error = fallback.error
    }
    if (error) throw new Error(error.message)

    revalidatePath('/club')
    revalidatePath('/admin')
    return { playerId: data?.id }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function updatePlayer(playerId: string, formData: FormData): Promise<{ error?: string }> {
  try {
    const supabase = await requireAdmin()

    const payload = {
      name: ((formData.get('name') as string)?.trim()) || null,
      position: ((formData.get('position') as string)?.trim() as Position) || null,
      squad_number: parseIntOrNull(formData.get('squad_number')),
      photo_url: formData.get('photo_url') as string || null,
      squad_status: (formData.get('squad_status') as PlayerStatus) || 'first_team',
      nationality: formData.get('nationality') as string || null,
      birth_date: formData.get('birth_date') as string || null,
    }

    let { error } = await supabase.from('players').update(payload).eq('id', playerId)
    if (error && isMissingColumnError(error)) {
      const fallbackPayload = {
        name: payload.name,
        position: payload.position,
        squad_number: payload.squad_number,
        photo_url: payload.photo_url,
        nationality: payload.nationality,
        birth_date: payload.birth_date,
      }
      const fallback = await supabase.from('players').update(fallbackPayload).eq('id', playerId)
      error = fallback.error
    }
    if (error) throw new Error(error.message)

    revalidatePath('/club')
    revalidatePath('/admin')
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function updatePlayerSeasonStats(playerId: string, formData: FormData): Promise<{ error?: string }> {
  try {
    const supabase = await requireAdmin()
    const raw = formData.get('season_stats') as string | null
    const parsed = raw ? JSON.parse(raw) as Array<{
      season?: string
      appearances?: unknown
      goals?: unknown
      assists?: unknown
    }> : []

    const rows = parsed
      .map(row => ({
        player_id: playerId,
        season: String(row.season ?? '').trim(),
        appearances: parseIntOrZero(row.appearances),
        goals: parseIntOrZero(row.goals),
        assists: parseIntOrZero(row.assists),
        updated_at: new Date().toISOString(),
      }))
      .filter(row => row.season)

    const { error: deleteError } = await supabase
      .from('player_season_stats')
      .delete()
      .eq('player_id', playerId)
    if (deleteError && isMissingRelationError(deleteError)) {
      throw new Error('player_season_stats table is missing. Apply the Supabase migration before saving season stats.')
    }
    if (deleteError) throw new Error(deleteError.message)

    if (rows.length > 0) {
      const { error: insertError } = await supabase.from('player_season_stats').insert(rows)
      if (insertError && isMissingRelationError(insertError)) {
        throw new Error('player_season_stats table is missing. Apply the Supabase migration before saving season stats.')
      }
      if (insertError) throw new Error(insertError.message)
    }

    revalidatePath('/club')
    revalidatePath('/admin')
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function deletePlayer(playerId: string): Promise<{ error?: string }> {
  try {
    const supabase = await requireAdmin()

    const { error } = await supabase.from('players').update({ is_active: false }).eq('id', playerId)
    if (error) throw new Error(error.message)

    revalidatePath('/club')
    revalidatePath('/admin')
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function togglePlayerActive(playerId: string, isActive: boolean): Promise<{ error?: string }> {
  try {
    const supabase = await requireAdmin()

    const { error } = await supabase.from('players').update({ is_active: isActive }).eq('id', playerId)
    if (error) throw new Error(error.message)

    revalidatePath('/club')
    revalidatePath('/admin')
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function createPoll(formData: FormData): Promise<{ error?: string }> {
  try {
    const supabase = await requireAdmin()

    const title = formData.get('title') as string
    const closes_at = formData.get('closes_at') as string
    if (!title) throw new Error('?쒕ぉ? ?꾩닔?낅땲??')
    if (!closes_at) throw new Error('醫낅즺?쇱? ?꾩닔?낅땲??')

    const type = (formData.get('type') as PollType) ?? 'evaluation'
    const scheduled_at = formData.get('scheduled_at') as string || null
    const status = scheduled_at ? 'scheduled' : 'active'

    const pollPayload = {
      title,
      type,
      description: formData.get('description') as string || null,
      player_id: formData.get('player_id') as string || null,
      thumbnail_url: formData.get('thumbnail_url') as string || null,
      status,
      scheduled_at,
      closes_at,
    }

    let { data: poll, error: pollError } = await supabase
      .from('polls')
      .insert(pollPayload)
      .select('id')
      .single()
    if (pollError && isMissingColumnError(pollError)) {
      const fallbackPayload = {
        title: pollPayload.title,
        type: pollPayload.type,
        description: pollPayload.description,
        player_id: pollPayload.player_id,
        status: pollPayload.status,
        scheduled_at: pollPayload.scheduled_at,
        closes_at: pollPayload.closes_at,
      }
      const fallback = await supabase
        .from('polls')
        .insert(fallbackPayload)
        .select('id')
        .single()
      poll = fallback.data
      pollError = fallback.error
    }
    if (pollError) throw new Error(pollError.message)

    // Save options for both types (evaluation = text options for one player; selection = player choices)
    const optionsRaw = formData.get('options') as string
    if (optionsRaw) {
      let options: Array<{ label: string; player_id?: string }> = []
      try {
        options = JSON.parse(optionsRaw) as Array<{ label: string; player_id?: string }>
      } catch {
        return { error: '?듭뀡 ?뺤떇???щ컮瑜댁? ?딆뒿?덈떎.' }
      }
      const optionRows = options.map((opt, index) => ({
        poll_id: poll.id,
        label: opt.label,
        player_id: opt.player_id ?? null,
        display_order: index,
      }))
      const { error: optError } = await supabase.from('poll_options').insert(optionRows)
      if (optError) throw new Error(optError.message)
    }

    revalidatePath('/')
    revalidatePath('/admin')
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function uploadPhoto(formData: FormData): Promise<{ url?: string; error?: string }> {
  try {
    const supabase = await requireAdmin()

    const file = formData.get('file') as File | null
    if (!file || file.size === 0) return { error: '?뚯씪???놁뼱??' }

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const folder = (formData.get('folder') as string) || 'players'
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const bytes = await file.arrayBuffer()
    const { error } = await supabase.storage
      .from('player-photos')
      .upload(path, bytes, { contentType: file.type, upsert: true })

    if (error) return { error: error.message }

    const { data } = supabase.storage.from('player-photos').getPublicUrl(path)
    return { url: data.publicUrl }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function updatePollStatus(pollId: string, status: 'active' | 'closed'): Promise<{ error?: string }> {
  try {
    const supabase = await requireAdmin()

    const { error } = await supabase.from('polls').update({ status }).eq('id', pollId)
    if (error) throw new Error(error.message)

    revalidatePath('/')
    revalidatePath('/admin')
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}
