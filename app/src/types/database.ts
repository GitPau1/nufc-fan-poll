// DB schema types for the poll-only application.

export type PollType = 'evaluation' | 'selection' | 'subject_options' | 'question_targets' | 'free_choice'
export type PollStatus = 'scheduled' | 'active' | 'closed'
export type Position = 'GK' | 'DEF' | 'MID' | 'FWD' | 'MGR'
export type PlayerStatus = 'first_team' | 'loan' | 'u21'

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
      public_profiles: {
        Row: {
          id: string
          display_name: string | null
          avatar_url: string | null
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['public_profiles']['Row'], 'updated_at'>
        Update: Partial<Database['public']['Tables']['public_profiles']['Insert']>
      }
      players: {
        Row: {
          id: string
          name: string
          position: Position
          squad_number: number | null
          photo_url: string | null
          base_rating: number
          is_active: boolean
          squad_status: PlayerStatus
        }
        Insert: Omit<Database['public']['Tables']['players']['Row'], 'id' | 'is_active' | 'squad_status'> & {
          is_active?: boolean
          squad_status?: PlayerStatus
        }
        Update: Partial<Database['public']['Tables']['players']['Insert']>
      }
      polls: {
        Row: {
          id: string
          type: PollType
          title: string
          description: string | null
          player_id: string | null
          created_by: string | null
          status: PollStatus
          thumbnail_url: string | null
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
          description?: string | null
          player_id: string | null
          image_url?: string | null
          display_order: number
          created_at?: string
        }
        Insert: Omit<Database['public']['Tables']['poll_options']['Row'], 'id' | 'created_at'>
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
        Update: never
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
      poll_type: PollType
      poll_status: PollStatus
    }
  }
}

export type UserRow = Database['public']['Tables']['users']['Row']
export type PublicProfileRow = Database['public']['Tables']['public_profiles']['Row']
export type PlayerRow = Database['public']['Tables']['players']['Row']
export type PollRow = Database['public']['Tables']['polls']['Row']
export type PollOptionRow = Database['public']['Tables']['poll_options']['Row']
export type VoteRow = Database['public']['Tables']['votes']['Row']
export type CommentRow = Database['public']['Tables']['comments']['Row']
export type CommentLikeRow = Database['public']['Tables']['comment_likes']['Row']

export type PollWithOptions = PollRow & {
  poll_options: PollOptionRow[]
  player?: PlayerRow | null
  vote_count: number
  my_vote?: VoteRow | null
}

export type CommentWithMeta = CommentRow & {
  user: Pick<PublicProfileRow, 'display_name' | 'avatar_url'>
  like_count: number
  is_liked: boolean
}
