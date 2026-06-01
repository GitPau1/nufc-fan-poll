'use server'

import { revalidatePath } from 'next/cache'
import type { PlayerStatus, PollType, Position, TransferDirection, TransferType } from '@/types/database'
import { requireAdminClient, type AnySupabase } from '@/lib/supabase/admin'
import { datetimeLocalToKoreaIso } from '@/lib/datetime'

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
  return (
    (message.includes('column') && message.includes('does not exist')) ||
    (message.includes('schema cache') && message.includes('image_url'))
  )
}

function isMissingRelationError(error: unknown): boolean {
  const message = String((error as { message?: string } | null)?.message ?? '')
  return message.includes('schema cache') || message.includes('does not exist')
}

async function requireAdmin(): Promise<AnySupabase> {
  return requireAdminClient()
}

function isPermanentDeparture(type: TransferType): boolean {
  return type === 'transferred' || type === 'contract_expired' || type === 'released'
}

function isInboundStory(type: TransferType): boolean {
  return type === 'signing' || type === 'loan_in' || type === 'promotion' || type === 'loan_return'
}

async function syncPlayerTransferState(
  supabase: AnySupabase,
  playerId: string,
  direction: TransferDirection,
  transferType: TransferType,
) {
  if (direction === 'in') {
    const { error } = await supabase
      .from('players')
      .update({ is_active: true, squad_status: 'first_team' })
      .eq('id', playerId)
    if (error) throw new Error(error.message)
    return
  }

  if (transferType === 'loan_out') {
    const { error } = await supabase
      .from('players')
      .update({ is_active: true, squad_status: 'loan' })
      .eq('id', playerId)
    if (error) throw new Error(error.message)
    return
  }

  if (isPermanentDeparture(transferType)) {
    const { error } = await supabase
      .from('players')
      .update({ is_active: false })
      .eq('id', playerId)
    if (error) throw new Error(error.message)
  }
}

async function createInboundStory(
  supabase: AnySupabase,
  playerId: string,
  transferType: TransferType,
  clubName: string | null,
  note: string | null,
  bannerImageUrl: string | null,
) {
  if (!isInboundStory(transferType)) return

  const { error } = await supabase.from('farewells').insert({
    player_id: playerId,
    departure_type: transferType,
    destination_club: clubName,
    departure_note: note,
    banner_image_url: bannerImageUrl,
    appearances: null,
    goals: null,
    assists: null,
    clean_sheets: null,
    joined_at: null,
    left_at: null,
    is_published: true,
  })
  if (error && isMissingRelationError(error)) return
  if (error) throw new Error(error.message)
}

async function resolveCurrentSeason(
  supabase: AnySupabase,
  seasonIdInput: string | null,
  seasonNameInput: string | null,
): Promise<{ id: string | null; name: string | null }> {
  let currentSeasonId = seasonIdInput
  let currentSeason = seasonNameInput

  if (currentSeason) {
    const { data, error } = await supabase
      .from('seasons')
      .upsert({ name: currentSeason, updated_at: new Date().toISOString() }, { onConflict: 'name' })
      .select('id, name')
      .single()

    if (error && isMissingRelationError(error)) {
      throw new Error('seasons table is missing. Apply the Supabase migration before setting the current season.')
    }
    if (error) throw new Error(error.message)
    currentSeasonId = (data as { id?: string } | null)?.id ?? currentSeasonId
    currentSeason = (data as { name?: string } | null)?.name ?? currentSeason
  } else if (currentSeasonId) {
    const { data, error } = await supabase
      .from('seasons')
      .select('id, name')
      .eq('id', currentSeasonId)
      .single()

    if (error && isMissingRelationError(error)) {
      throw new Error('seasons table is missing. Apply the Supabase migration before setting the current season.')
    }
    if (error) throw new Error(error.message)
    currentSeason = (data as { name?: string } | null)?.name ?? null
  }

  if (currentSeasonId) {
    const { error: clearError } = await supabase
      .from('seasons')
      .update({ is_current: false, updated_at: new Date().toISOString() })
      .neq('id', currentSeasonId)
    if (clearError && isMissingRelationError(clearError)) {
      throw new Error('seasons table is missing. Apply the Supabase migration before setting the current season.')
    }
    if (clearError) throw new Error(clearError.message)

    const { error: currentError } = await supabase
      .from('seasons')
      .update({ is_current: true, updated_at: new Date().toISOString() })
      .eq('id', currentSeasonId)
    if (currentError) throw new Error(currentError.message)
  }

  return { id: currentSeasonId, name: currentSeason }
}


export async function updateClubStatus(formData: FormData): Promise<{ error?: string }> {
  try {
    const supabase = await requireAdmin()
    const resolvedSeason = await resolveCurrentSeason(
      supabase,
      (formData.get('current_season_id') as string)?.trim() || null,
      (formData.get('current_season') as string)?.trim() || null,
    )

    const payload = {
      current_season: resolvedSeason.name,
      current_season_id: resolvedSeason.id,
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
    revalidatePath('/transfers')
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function setCurrentSeason(formData: FormData): Promise<{ error?: string; seasonId?: string; seasonName?: string }> {
  try {
    const supabase = await requireAdmin()
    const resolvedSeason = await resolveCurrentSeason(
      supabase,
      (formData.get('current_season_id') as string)?.trim() || null,
      (formData.get('current_season') as string)?.trim() || null,
    )

    if (!resolvedSeason.id || !resolvedSeason.name) {
      throw new Error('현재 시즌을 선택하거나 새 시즌을 입력해주세요.')
    }

    const { error } = await supabase
      .from('club_status')
      .update({
        current_season: resolvedSeason.name,
        current_season_id: resolvedSeason.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1)

    if (error) throw new Error(error.message)

    revalidatePath('/')
    revalidatePath('/admin')
    revalidatePath('/transfers')
    return { seasonId: resolvedSeason.id, seasonName: resolvedSeason.name }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function createTransfer(formData: FormData): Promise<{ error?: string }> {
  try {
    const supabase = await requireAdmin()

    const playerId = (formData.get('player_id') as string)?.trim()
    const direction = (formData.get('direction') as TransferDirection | null) ?? 'in'
    const transferType = (formData.get('transfer_type') as TransferType | null) ?? 'signing'
    const seasonId = (formData.get('season_id') as string)?.trim() || null
    let season = (formData.get('season') as string)?.trim()

    if (!playerId) throw new Error('선수 정보가 없습니다.')
    if (!seasonId && !season) throw new Error('현재 시즌을 먼저 설정해주세요.')
    if (seasonId && !season) {
      const { data } = await supabase
        .from('seasons')
        .select('name')
        .eq('id', seasonId)
        .single()
      season = (data as { name?: string } | null)?.name?.trim() ?? ''
    }
    if (!season) throw new Error('현재 시즌을 먼저 설정해주세요.')

    const payload = {
      player_id: playerId,
      direction,
      transfer_type: transferType,
      season,
      season_id: seasonId,
      club_name: (formData.get('club_name') as string)?.trim() || null,
      note: (formData.get('note') as string)?.trim() || null,
      is_published: true,
      updated_at: new Date().toISOString(),
    }
    const bannerImageUrl = (formData.get('banner_image_url') as string)?.trim() || null

    const { error } = await supabase.from('transfers').insert(payload)
    if (error && isMissingRelationError(error)) {
      throw new Error('transfers table is missing. Apply the Supabase migration before saving transfer history.')
    }
    if (error) throw new Error(error.message)
    await syncPlayerTransferState(supabase, playerId, direction, transferType)
    if (direction === 'in') {
      await createInboundStory(supabase, playerId, transferType, payload.club_name, payload.note, bannerImageUrl)
    }

    revalidatePath('/')
    revalidatePath('/admin')
    revalidatePath('/transfers')
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function updateTransfer(transferId: string, formData: FormData): Promise<{ error?: string }> {
  try {
    const supabase = await requireAdmin()
    const transferType = (formData.get('transfer_type') as TransferType | null) ?? 'signing'
    const { data: existingTransfer, error: readError } = await supabase
      .from('transfers')
      .select('player_id, direction')
      .eq('id', transferId)
      .single()

    if (readError && isMissingRelationError(readError)) {
      throw new Error('transfers table is missing. Apply the Supabase migration before updating transfer history.')
    }
    if (readError) throw new Error(readError.message)

    const { error } = await supabase
      .from('transfers')
      .update({
        transfer_type: transferType,
        club_name: (formData.get('club_name') as string)?.trim() || null,
        note: (formData.get('note') as string)?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', transferId)

    if (error && isMissingRelationError(error)) {
      throw new Error('transfers table is missing. Apply the Supabase migration before updating transfer history.')
    }
    if (error) throw new Error(error.message)
    if (existingTransfer?.player_id && existingTransfer?.direction) {
      await syncPlayerTransferState(
        supabase,
        String(existingTransfer.player_id),
        existingTransfer.direction as TransferDirection,
        transferType,
      )
    }

    revalidatePath('/')
    revalidatePath('/admin')
    revalidatePath('/transfers')
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
      season_id?: string
      appearances?: unknown
      goals?: unknown
      assists?: unknown
    }> : []

    const seasonIds = Array.from(new Set(parsed.map(row => String(row.season_id ?? '').trim()).filter(Boolean)))
    const seasonsById = new Map<string, string>()
    if (seasonIds.length > 0) {
      const { data: seasonData, error: seasonError } = await supabase
        .from('seasons')
        .select('id, name')
        .in('id', seasonIds)
      if (seasonError && isMissingRelationError(seasonError)) {
        throw new Error('seasons table is missing. Apply the Supabase migration before saving season stats.')
      }
      if (seasonError) throw new Error(seasonError.message)
      for (const season of (seasonData ?? []) as Array<{ id: string; name: string }>) {
        seasonsById.set(season.id, season.name)
      }
    }

    const rows = parsed
      .map(row => {
        const seasonId = String(row.season_id ?? '').trim()
        return {
        player_id: playerId,
        season_id: seasonId,
        season: seasonsById.get(seasonId) ?? '',
        appearances: parseIntOrZero(row.appearances),
        goals: parseIntOrZero(row.goals),
        assists: parseIntOrZero(row.assists),
        updated_at: new Date().toISOString(),
        }
      })
      .filter(row => row.season_id && row.season)

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
    const closesAtInput = String(formData.get('closes_at') ?? '')
    const closes_at = datetimeLocalToKoreaIso(closesAtInput)
    if (!title) throw new Error('?쒕ぉ? ?꾩닔?낅땲??')
    if (!closesAtInput) throw new Error('醫낅즺?쇱? ?꾩닔?낅땲??')

    const type = (formData.get('type') as PollType) ?? 'evaluation'
    const pollPayload = {
      title,
      type,
      description: formData.get('description') as string || null,
      player_id: formData.get('player_id') as string || null,
      thumbnail_url: formData.get('thumbnail_url') as string || null,
      status: 'active',
      scheduled_at: null,
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
      let options: Array<{ label: string; description?: string | null; player_id?: string; image_url?: string | null }> = []
      try {
        options = JSON.parse(optionsRaw) as Array<{ label: string; description?: string | null; player_id?: string; image_url?: string | null }>
      } catch {
        return { error: '?듭뀡 ?뺤떇???щ컮瑜댁? ?딆뒿?덈떎.' }
      }
      const optionRows = options.map((opt, index) => ({
        poll_id: poll.id,
        label: opt.label,
        description: opt.description ? String(opt.description).trim() : null,
        player_id: opt.player_id ?? null,
        image_url: opt.image_url ?? null,
        display_order: index,
      }))
      let { error: optError } = await supabase.from('poll_options').insert(optionRows)
      if (optError && isMissingColumnError(optError)) {
        const fallbackRows = optionRows.map(row => ({
          poll_id: row.poll_id,
          label: row.label,
          player_id: row.player_id,
          display_order: row.display_order,
        }))
        const fallback = await supabase.from('poll_options').insert(fallbackRows)
        optError = fallback.error
      }
      if (optError) throw new Error(optError.message)
    }

    revalidatePath('/')
    revalidatePath('/polls')
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
    revalidatePath('/polls')
    revalidatePath('/admin')
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}
