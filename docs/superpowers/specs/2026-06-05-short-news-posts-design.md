# Short News Posts Design

## Goal

Logged-in users can publish short Newcastle-related posts, attach one URL, react with a fixed emoji set from the feed card, and edit or delete their own posts.

## Scope

- Add a short post feed for user-created news and thoughts.
- Allow all logged-in users to create posts.
- Support three post types: `free`, `info`, and `official`.
- Limit post body text to 300 characters.
- Require a URL when the post type is `official`.
- Show helper text for `official` posts asking users to share only content from official accounts, club announcements, player channels, or trusted official sources.
- Support author-only edit and delete.
- Mark edited posts with a small `edited` indicator.
- Allow operators to hide posts through admin-level access.
- Add feed-card emoji reactions with one reaction per user per post.
- Support rich embeds for X and YouTube only.

Out of scope:

- Image upload.
- Open-ended custom emojis.
- Comments or threaded discussion.
- User reports.
- Full edit history display.
- Automatic official-source verification.
- Thumbnail-rich previews for every URL.

## Post Types

`free` is for short opinions, quick thoughts, and casual fan notes.

`info` is for useful fan-shared information that is not necessarily an official announcement.

`official` is for posts based on official or trusted source material. Any logged-in user can select it, but the write form must nudge them toward source discipline. `official` posts require a URL so source-less official claims are not created.

## Reactions

Use a fixed set of five reactions that represent distinct emotional lanes:

- `expecting`: `🙌` 기대
- `shocked`: `😳` 충격
- `angry`: `😡` 분노
- `sad`: `😢` 아쉬움
- `curious`: `🤔` 의문

Users can react directly from the post list card. Each user can have at most one active reaction per post. Selecting another reaction changes the existing reaction. Selecting the same reaction again removes it.

The card shows each reaction count and highlights the current user's selected reaction.

## URL Embeds

Every post can attach at most one URL.

General URLs render as a lightweight link card with domain and fetched title when available. If metadata lookup fails, the card falls back to domain and URL.

X URLs render through the official X embed path when possible. The app should keep a fallback general link card because X embed markup and availability can change.

YouTube URLs render as a lightweight video card in the feed. The card shows a thumbnail and play affordance first, then loads an iframe player inside the card when clicked. Supported URL shapes include `youtube.com/watch`, `youtu.be`, and `youtube.com/shorts`.

No external thumbnail or media file is stored by the app in the first version.

## Data Model

Add a `posts` table:

- `id`
- `user_id`
- `type`
- `content`
- `url`
- `embed_kind`
- `embed_title`
- `embed_domain`
- `is_hidden`
- `created_at`
- `updated_at`

Add a `post_reactions` table:

- `id`
- `post_id`
- `user_id`
- `reaction_type`
- `created_at`
- unique constraint on `post_id, user_id`

RLS rules:

- Everyone can read non-hidden posts.
- Authenticated users can insert posts as themselves.
- Authors can update and delete their own posts.
- Operators can hide posts through privileged access.
- Everyone can read reaction counts.
- Authenticated users can create, update, or delete their own post reaction.

## UI

Add a dedicated `/posts` feed route with mobile-first cards matching the app's compact sports-feed style.

The composer includes:

- Post type segmented control.
- Textarea with 300-character counter.
- URL field.
- Contextual helper text when `official` is selected.
- Submit state and validation messaging.

Each feed card includes:

- Post type badge.
- Author display name and timestamp.
- Edited indicator when `updated_at` differs from `created_at`.
- Body content.
- URL embed card.
- Reaction row.
- Author-only edit and delete controls.

The bottom navigation includes the new feed as `소식`, making it a primary destination alongside home, polls, and club information.

## Data Flow

1. User opens the post feed.
2. Feed loads recent non-hidden posts with author info, embed metadata, reaction counts, and current user's reaction when logged in.
3. User writes content, selects a type, and optionally adds a URL.
4. Server action validates authentication, type, content length, URL shape, and official URL requirement.
5. Server action derives `embed_kind`, title, and domain for the URL when possible.
6. Supabase inserts or updates the post.
7. Feed refreshes or prepends the changed post.
8. User clicks a reaction on a card.
9. Server action inserts, updates, or deletes the user's reaction, then returns updated counts.

## Testing

- Add pure tests for post content validation, post type validation, official URL requirement, URL normalization, and embed kind detection.
- Add pure tests for reaction toggling decisions: create, change, and remove.
- Add query/action coverage where the existing project test style allows it.
- Run the new tests and the app's available type or build verification before implementation is considered complete.
