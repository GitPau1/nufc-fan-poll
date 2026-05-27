// DB 스키마 타입 — docs/specs/03-data-model.md 기반

export type PollType   = 'evaluation' | 'selection'
export type PollStatus = 'scheduled' | 'active' | 'closed'
export type Position   = 'GK' | 'DEF' | 'MID' | 'FWD' | 'MGR'

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          avatar_url: string | null
          display_name: string | null
          created_at: string
          deleted_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      players: {
        Row: {
          id: string
          name: string
          position: Position
          squad_number: number | null
          photo_url: string | null
          is_active: boolean
          nationality: string | null
          birth_date: string | null
        }
        Insert: Omit<Database['public']['Tables']['players']['Row'], 'id' | 'is_active'>
        Update: Partial<Database['public']['Tables']['players']['Insert']>
      }
      polls: {
        Row: {
          id: string
          type: PollType
          title: string
          description: string | null
          player_id: string | null     // Type A only
          status: PollStatus
          scheduled_at: string | null
          closes_at: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['polls']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['polls']['Insert']>
      }
      poll_options: {
        Row: {
          id: string
          poll_id: string
          label: string
          player_id: string | null     // Type B only
          display_order: number
        }
        Insert: Omit<Database['public']['Tables']['poll_options']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['poll_options']['Insert']>
      }
      votes: {
        Row: {
          id: string
          poll_id: string
          user_id: string
          option_id: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['votes']['Row'], 'id' | 'created_at'>
        Update: never  // votes are immutable
      }
      comments: {
        Row: {
          id: string
          poll_id: string
          user_id: string
          content: string
          is_hidden: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['comments']['Row'], 'id' | 'is_hidden' | 'created_at'>
        Update: Pick<Database['public']['Tables']['comments']['Row'], 'is_hidden'>
      }
      comment_likes: {
        Row: {
          id: string
          comment_id: string
          user_id: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['comment_likes']['Row'], 'id' | 'created_at'>
        Update: never
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      poll_type:   PollType
      poll_status: PollStatus
    }
  }
}

// ── 편의 타입 (Row shorthand) ──
export type UserRow         = Database['public']['Tables']['users']['Row']
export type PlayerRow       = Database['public']['Tables']['players']['Row']
export type PollRow         = Database['public']['Tables']['polls']['Row']
export type PollOptionRow   = Database['public']['Tables']['poll_options']['Row']
export type VoteRow         = Database['public']['Tables']['votes']['Row']
export type CommentRow      = Database['public']['Tables']['comments']['Row']
export type CommentLikeRow  = Database['public']['Tables']['comment_likes']['Row']

// ── 조합 타입 (UI에서 주로 사용) ──
export type PollWithOptions = PollRow & {
  poll_options: PollOptionRow[]
  player?: PlayerRow | null
  vote_count: number
  my_vote?: VoteRow | null
}

export type CommentWithMeta = CommentRow & {
  user: Pick<UserRow, 'display_name' | 'avatar_url'>
  like_count: number
  is_liked: boolean
}

// club_status 테이블
export type ClubStatusRow = {
  id: number
  league_rank: number | null
  next_match_opponent: string | null
  next_match_date: string | null
  next_match_venue: 'home' | 'away' | null
  top_appearances_player_id: string | null
  top_appearances_count: number | null
  top_goals_player_id: string | null
  top_goals_count: number | null
  top_assists_player_id: string | null
  top_assists_count: number | null
  updated_at: string
}

// 구단 정보 페이지용 조합 타입
export type ClubStatusWithStats = ClubStatusRow & {
  top_appearances_player: Pick<PlayerRow, 'id' | 'name' | 'photo_url'> | null
  top_goals_player: Pick<PlayerRow, 'id' | 'name' | 'photo_url'> | null
  top_assists_player: Pick<PlayerRow, 'id' | 'name' | 'photo_url'> | null
}
