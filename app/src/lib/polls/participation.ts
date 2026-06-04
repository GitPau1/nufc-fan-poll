export type RatingParticipantRow = {
  poll_id: string
  user_id: string
}

export function countRatingParticipantsByPoll(rows: RatingParticipantRow[]): Map<string, number> {
  const userIdsByPoll = new Map<string, Set<string>>()

  for (const row of rows) {
    const userIds = userIdsByPoll.get(row.poll_id) ?? new Set<string>()
    userIds.add(row.user_id)
    userIdsByPoll.set(row.poll_id, userIds)
  }

  return new Map(
    Array.from(userIdsByPoll.entries()).map(([pollId, userIds]) => [pollId, userIds.size])
  )
}
