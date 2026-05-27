'use server'

import { getPollList } from '@/lib/queries/polls'

export async function loadMorePolls(page: number) {
  return getPollList(page)
}
