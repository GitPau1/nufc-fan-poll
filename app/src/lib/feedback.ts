export const FEEDBACK_MAX_LENGTH = 500

type FeedbackResult = { content: string } | { error: string }

export function normalizeFeedbackContent(input: string): FeedbackResult {
  const content = input.trim()

  if (!content) return { error: '피드백을 입력해주세요.' }
  if (content.length > FEEDBACK_MAX_LENGTH) {
    return { error: '피드백은 500자 이하로 입력해주세요.' }
  }

  return { content }
}
