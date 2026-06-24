export type CreatePollType = 'subject_options' | 'question_targets' | 'free_choice' | 'overall_rating'

export type FreeOption = {
  label: string
  description: string
  imageUrl: string
}

export type CreatePollOptionsPlayer = {
  id: string
  name: string
}

type SubjectOptionPayload = {
  label: string
}

export type FreeChoiceOptionPayload = {
  label: string
  description: string | null
  image_url: string | null
  imageField: string
}

type PlayerTargetOptionPayload = {
  label: string
  player_id: string
}

type CreatePollOptionsResult = {
  ok: true
  playerId: string | null
  options: Array<SubjectOptionPayload | FreeChoiceOptionPayload | PlayerTargetOptionPayload>
} | {
  ok: false
  message: string
}

export function buildCreatePollOptions({
  pollType,
  textOptions,
  freeOptions,
  selectedSubjectPlayerId,
  selectedPlayerIds,
  players,
}: {
  pollType: CreatePollType
  textOptions: string[]
  freeOptions: FreeOption[]
  selectedSubjectPlayerId: string | null
  selectedPlayerIds: string[]
  players: CreatePollOptionsPlayer[]
}): CreatePollOptionsResult {
  if (pollType === 'subject_options') {
    const options = textOptions.map(option => option.trim()).filter(Boolean)
    if (!selectedSubjectPlayerId) {
      return { ok: false, message: '대상 선수를 선택해주세요.' }
    }
    if (options.length < 2) {
      return { ok: false, message: '선택지를 최소 2개 입력해주세요.' }
    }

    return {
      ok: true,
      playerId: selectedSubjectPlayerId,
      options: options.map(label => ({ label })),
    }
  }

  if (pollType === 'free_choice') {
    const options = freeOptions
      .map((option, index) => ({
        label: option.label.trim(),
        description: option.description.trim() || null,
        image_url: option.imageUrl.trim() || null,
        imageField: `free_option_image_${index}`,
      }))
      .filter(option => option.label)

    if (options.length < 2) {
      return { ok: false, message: '선택지를 최소 2개 입력해주세요.' }
    }

    return { ok: true, playerId: null, options }
  }

  if (selectedPlayerIds.length < 2) {
    return { ok: false, message: '선수를 최소 2명 선택해주세요.' }
  }

  return {
    ok: true,
    playerId: null,
    options: selectedPlayerIds.map(id => {
      const player = players.find(item => item.id === id)
      return { label: player?.name ?? id, player_id: id }
    }),
  }
}
