# 09 — Mixpanel 이벤트 추적

## 이벤트 목록

| 이벤트명 | 발생 시점 | 속성 |
|---------|----------|------|
| `page_view` | 모든 페이지 진입 | `page`, `user_id` |
| `poll_list_scroll` | 무한 스크롤 트리거 | `page_number` |
| `poll_card_click` | 투표 카드 클릭 | `poll_id`, `poll_type` |
| `vote_option_selected` | 선택지 탭 / 스와이프 | `poll_id`, `option_id`, `poll_type` |
| `vote_modal_shown` | 확인 모달 표시 | `poll_id` |
| `vote_modal_cancelled` | 모달에서 취소 | `poll_id` |
| `vote_submitted` | 투표 최종 제출 완료 | `poll_id`, `option_id`, `poll_type` |
| `result_viewed` | 결과 화면 진입 | `poll_id`, `is_revisit` |
| `comment_written` | 댓글 작성 완료 | `poll_id` |
| `comment_liked` | 댓글 좋아요 | `comment_id`, `poll_id` |
| `login_prompted` | 로그인 유도 모달 표시 | `trigger_action` (`vote` \| `comment`) |
| `login_completed` | 로그인 완료 | `method: 'google'` |
| `mypage_visited` | 마이페이지 진입 | — |
| `logout` | 로그아웃 | — |
| `account_deleted` | 탈퇴 완료 | — |
| `scheduled_poll_viewed` | 예정 투표 카드 노출 | `poll_id`, `time_remaining_seconds` |

## 가설별 측정 지표

| 가설 | 관련 이벤트 |
|------|------------|
| H1: 시즌 종료 후 강한 참여 욕구 | `page_view`, `vote_submitted` 추이 |
| H2: 투표 참여 장벽이 낮음 | `poll_card_click` → `vote_submitted` 전환율 |
| H3: 결과 후공개 참여율 증가 | `result_viewed` 체류 시간, `comment_written` 비율 |
| H4: 댓글/공감에서 감정 반응 | `comment_liked`, `comment_written` 수 |
| H5: 예정 투표가 재방문 유도 | `scheduled_poll_viewed`, 재방문 `page_view` |
