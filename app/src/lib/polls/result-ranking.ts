export type ResultOption = {
  id: string
  label: string
  description?: string | null
  image_url?: string | null
  player_id?: string | null
}

export type ResultOptionPlayer = {
  photo_url?: string | null
}

export type PollResultItem<TOption extends ResultOption = ResultOption> = {
  option: TOption
  count: number
  percent: number
  imageUrl: string | null
  isMine: boolean
}

export function buildPollResultItems<TOption extends ResultOption>(
  options: TOption[],
  voteCounts: Record<string, number | undefined>,
  myOptionId: string | null,
  optionPlayers: Record<string, ResultOptionPlayer | null | undefined> | null | undefined
): PollResultItem<TOption>[] {
  const counts = options.map(option => voteCounts[option.id] ?? 0)
  const total = counts.reduce((sum, count) => sum + count, 0)
  const percents = total === 0
    ? counts.map(() => 0)
    : counts.map(count => Math.round((count / total) * 100))

  const rankedItems = options
    .map((option, index) => ({
      option,
      count: counts[index],
      percent: percents[index],
      imageUrl: option.image_url ?? (
        option.player_id && optionPlayers
          ? optionPlayers[option.player_id]?.photo_url ?? null
          : null
      ),
      isMine: option.id === myOptionId,
      originalIndex: index,
    }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count
      return a.originalIndex - b.originalIndex
    })

  return rankedItems.map(item => ({
    option: item.option,
    count: item.count,
    percent: item.percent,
    imageUrl: item.imageUrl,
    isMine: item.isMine,
  }))
}
