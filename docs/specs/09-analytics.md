# 09 — Mixpanel Activation Loop Tracking

## Measurement Goal

Mixpanel tracking is focused on validating the activation loop of an early participatory product. The primary question is not "how many page views did we get?", but:

> Can a visitor move from first feed exposure to first meaningful value, then into emotional response or content creation?

For this MVP, activation is:

```text
Activation = first vote_submitted + poll_result_viewed
```

Voting alone is not enough. The user reaches the product's first value after seeing how their opinion compares with other fans.

## Core Funnels

### 1. Activation Funnel

Primary portfolio funnel.

```text
app_opened
→ poll_feed_viewed
→ poll_card_clicked
→ vote_submitted
→ poll_result_viewed
```

Measures whether users reach the first meaningful value of the product.

```text
Activated User Rate = users with vote_submitted + poll_result_viewed / users with app_opened
```

### 2. Auth Friction Funnel

```text
auth_prompt_viewed
→ login_completed
→ vote_submitted
```

Measures whether the required login step blocks first participation.

```text
Login Conversion = login_completed / auth_prompt_viewed
```

### 3. Time to Value

```text
app_opened
→ poll_result_viewed
```

Measures how quickly a user reaches the first value moment.

```text
Time to Value = time from app_opened to first poll_result_viewed
```

### 4. Emotional Loop Funnel

```text
poll_result_viewed
→ comment_submitted
→ comment_liked
```

Measures whether result viewing creates emotional or social response.

```text
Comment Rate = comment_submitted / poll_result_viewed
Like Rate = comment_liked / poll_result_viewed
```

### 5. Creator Loop Funnel

```text
poll_result_viewed
→ create_poll_clicked
→ poll_published
→ poll_first_vote_received
```

Measures whether activated users move from participant to creator.

```text
Creator Intent Rate = create_poll_clicked / poll_result_viewed
Creator Activation Rate = poll_published / create_poll_clicked
Creator Aha Rate = poll_first_vote_received / poll_published
```

### 6. Return Loop

```text
activated user
→ return_visit
```

Measures whether the first value experience creates a reason to come back.

```text
Return Visit Rate = users with return_visit / activated users
```

## Event Plan

Track only the events needed to validate the MVP loops.

| Event | Trigger | Product Question |
|---|---|---|
| `app_opened` | User starts a session or lands on the service. | How many users enter the product? |
| `poll_feed_viewed` | Home or poll list feed is visible. | Did the user see initial content? |
| `poll_card_clicked` | User opens a poll from a card. | Did a poll topic create interest? |
| `auth_prompt_viewed` | Login prompt appears before voting, commenting, or creating. | Where does auth friction appear? |
| `login_completed` | User successfully logs in. | Do users cross the login barrier? |
| `vote_submitted` | Vote is successfully saved. | Did the user complete first participation? |
| `poll_result_viewed` | Result screen is viewed. | Did the user reach the Aha Moment candidate? |
| `comment_submitted` | Comment is successfully created. | Did results drive emotional response? |
| `comment_liked` | User likes a comment. | Did users react to other fans' opinions? |
| `create_poll_clicked` | User enters or starts poll creation. | Did the user show creator intent? |
| `poll_published` | User-created poll is successfully published. | Did creator activation happen? |
| `poll_first_vote_received` | A user-created poll receives its first vote. | Did the creator reach their reward moment? |
| `return_visit` | User returns after a previous session. | Does the loop create repeat visits? |

## Event Properties

### Common Properties

Attach these when available:

```ts
{
  source_page: "home" | "polls" | "poll_detail" | "my" | "create" | "direct",
  is_first_session: boolean,
  is_logged_in: boolean,
  user_role: "guest" | "user" | "admin"
}
```

`is_first_session` is currently supplied by the analytics helper. `is_logged_in` and `user_role` are target properties for a later identity pass, because they require auth context across more surfaces.

### Auth Prompt Properties

Attach to `auth_prompt_viewed`:

```ts
{
  trigger_action: "vote" | "comment" | "create_poll"
}
```

### Poll Event Properties

Attach to poll-related events:

```ts
{
  poll_id: string,
  poll_type: "subject_options" | "free_choice" | "overall_rating" | "selection" | "question_targets" | "evaluation",
  poll_status: "active" | "scheduled" | "closed",
  creator_type: "admin" | "user",
  is_first_vote: boolean
}
```

### Poll Creation Properties

Attach to `create_poll_clicked` and `poll_published`:

```ts
{
  poll_type: "subject_options" | "free_choice" | "overall_rating",
  option_count: number,
  has_thumbnail: boolean
}
```

### Creator Aha Properties

Attach to `poll_first_vote_received`:

```ts
{
  poll_id: string,
  poll_type: "subject_options" | "free_choice" | "overall_rating" | "selection" | "question_targets" | "evaluation",
  creator_type: "user",
  minutes_since_published: number
}
```

## Deferred UX Diagnostic Events

These events can help debug detailed UX drop-off, but they are not required for the portfolio activation dashboard:

- `vote_option_selected`
- `vote_modal_shown`
- `vote_modal_cancelled`
- `scheduled_poll_viewed`
- `mypage_visited`
- `logout`
- `account_deleted`
- `feedback_opened`
- `feedback_submitted`

Add them only when a specific dashboard question needs them.
