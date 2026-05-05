export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      courses: {
        Row: {
          cefr_level: Database["public"]["Enums"]["cefr_level"]
          created_at: string
          description: string | null
          id: string
          meta_description: string | null
          meta_title: string | null
          order_index: number
          published_at: string | null
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          cefr_level: Database["public"]["Enums"]["cefr_level"]
          created_at?: string
          description?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          order_index?: number
          published_at?: string | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          cefr_level?: Database["public"]["Enums"]["cefr_level"]
          created_at?: string
          description?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          order_index?: number
          published_at?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      lesson_contents: {
        Row: {
          block_type: Database["public"]["Enums"]["content_block_type"]
          content: Json
          created_at: string
          id: string
          lesson_id: string
          order_index: number
        }
        Insert: {
          block_type: Database["public"]["Enums"]["content_block_type"]
          content?: Json
          created_at?: string
          id?: string
          lesson_id: string
          order_index?: number
        }
        Update: {
          block_type?: Database["public"]["Enums"]["content_block_type"]
          content?: Json
          created_at?: string
          id?: string
          lesson_id?: string
          order_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "lesson_contents_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_vocabulary: {
        Row: {
          context_sentence: string | null
          created_at: string
          lesson_id: string
          order_index: number
          vocabulary_id: string
        }
        Insert: {
          context_sentence?: string | null
          created_at?: string
          lesson_id: string
          order_index?: number
          vocabulary_id: string
        }
        Update: {
          context_sentence?: string | null
          created_at?: string
          lesson_id?: string
          order_index?: number
          vocabulary_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_vocabulary_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_vocabulary_vocabulary_id_fkey"
            columns: ["vocabulary_id"]
            isOneToOne: false
            referencedRelation: "vocabulary"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          category: Database["public"]["Enums"]["lesson_category"]
          cefr_level: Database["public"]["Enums"]["cefr_level"] | null
          created_at: string
          created_by: string | null
          description: string | null
          estimated_minutes: number
          id: string
          meta_description: string | null
          meta_title: string | null
          order_index: number
          passing_score: number
          published_at: string | null
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          thumbnail_url: string | null
          title: string
          unit_id: string
          updated_at: string
          xp_reward: number
        }
        Insert: {
          category: Database["public"]["Enums"]["lesson_category"]
          cefr_level?: Database["public"]["Enums"]["cefr_level"] | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimated_minutes?: number
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          order_index?: number
          passing_score?: number
          published_at?: string | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          thumbnail_url?: string | null
          title: string
          unit_id: string
          updated_at?: string
          xp_reward?: number
        }
        Update: {
          category?: Database["public"]["Enums"]["lesson_category"]
          cefr_level?: Database["public"]["Enums"]["cefr_level"] | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimated_minutes?: number
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          order_index?: number
          passing_score?: number
          published_at?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          thumbnail_url?: string | null
          title?: string
          unit_id?: string
          updated_at?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "lessons_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          onboarding_completed: boolean
          preferred_cefr_level: Database["public"]["Enums"]["cefr_level"] | null
          role: Database["public"]["Enums"]["user_role"]
          timezone: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          onboarding_completed?: boolean
          preferred_cefr_level?:
            | Database["public"]["Enums"]["cefr_level"]
            | null
          role?: Database["public"]["Enums"]["user_role"]
          timezone?: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          onboarding_completed?: boolean
          preferred_cefr_level?:
            | Database["public"]["Enums"]["cefr_level"]
            | null
          role?: Database["public"]["Enums"]["user_role"]
          timezone?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      quiz_answers: {
        Row: {
          answered_at: string
          attempt_id: string
          id: string
          is_correct: boolean
          points_awarded: number
          question_id: string
          selected_option_id: string | null
        }
        Insert: {
          answered_at?: string
          attempt_id: string
          id?: string
          is_correct?: boolean
          points_awarded?: number
          question_id: string
          selected_option_id?: string | null
        }
        Update: {
          answered_at?: string
          attempt_id?: string
          id?: string
          is_correct?: boolean
          points_awarded?: number
          question_id?: string
          selected_option_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_answers_selected_option_id_fkey"
            columns: ["selected_option_id"]
            isOneToOne: false
            referencedRelation: "public_quiz_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_answers_selected_option_id_fkey"
            columns: ["selected_option_id"]
            isOneToOne: false
            referencedRelation: "quiz_options"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          attempt_number: number
          created_at: string
          id: string
          lesson_id: string
          max_score: number
          passed: boolean
          percentage: number | null
          score: number
          time_taken_seconds: number | null
          user_id: string
          xp_earned: number
        }
        Insert: {
          attempt_number?: number
          created_at?: string
          id?: string
          lesson_id: string
          max_score?: number
          passed?: boolean
          percentage?: number | null
          score?: number
          time_taken_seconds?: number | null
          user_id: string
          xp_earned?: number
        }
        Update: {
          attempt_number?: number
          created_at?: string
          id?: string
          lesson_id?: string
          max_score?: number
          passed?: boolean
          percentage?: number | null
          score?: number
          time_taken_seconds?: number | null
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_options: {
        Row: {
          content: string
          feedback: string | null
          id: string
          is_correct: boolean
          order_index: number
          question_id: string
        }
        Insert: {
          content: string
          feedback?: string | null
          id?: string
          is_correct?: boolean
          order_index?: number
          question_id: string
        }
        Update: {
          content?: string
          feedback?: string | null
          id?: string
          is_correct?: boolean
          order_index?: number
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          created_at: string
          explanation: string | null
          id: string
          lesson_id: string
          media_url: string | null
          order_index: number
          points: number
          question: string
          type: Database["public"]["Enums"]["quiz_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          explanation?: string | null
          id?: string
          lesson_id: string
          media_url?: string | null
          order_index?: number
          points?: number
          question: string
          type?: Database["public"]["Enums"]["quiz_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          explanation?: string | null
          id?: string
          lesson_id?: string
          media_url?: string | null
          order_index?: number
          points?: number
          question?: string
          type?: Database["public"]["Enums"]["quiz_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          order_index: number
          published_at: string | null
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number
          published_at?: string | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number
          published_at?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity_days: {
        Row: {
          activities_count: number
          activity_date: string
          created_at: string
          study_time_seconds: number
          updated_at: string
          user_id: string
          xp_earned: number
        }
        Insert: {
          activities_count?: number
          activity_date: string
          created_at?: string
          study_time_seconds?: number
          updated_at?: string
          user_id: string
          xp_earned?: number
        }
        Update: {
          activities_count?: number
          activity_date?: string
          created_at?: string
          study_time_seconds?: number
          updated_at?: string
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_days_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress: {
        Row: {
          attempts: number
          best_score: number | null
          completed_at: string | null
          lesson_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["lesson_status"]
          time_spent_seconds: number
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts?: number
          best_score?: number | null
          completed_at?: string | null
          lesson_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["lesson_status"]
          time_spent_seconds?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts?: number
          best_score?: number | null
          completed_at?: string | null
          lesson_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["lesson_status"]
          time_spent_seconds?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          created_at: string
          daily_goal_minutes: number
          daily_goal_xp: number
          notification_enabled: boolean
          reminder_time: string | null
          sound_enabled: boolean
          theme: Database["public"]["Enums"]["theme"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_goal_minutes?: number
          daily_goal_xp?: number
          notification_enabled?: boolean
          reminder_time?: string | null
          sound_enabled?: boolean
          theme?: Database["public"]["Enums"]["theme"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_goal_minutes?: number
          daily_goal_xp?: number
          notification_enabled?: boolean
          reminder_time?: string | null
          sound_enabled?: boolean
          theme?: Database["public"]["Enums"]["theme"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_stats: {
        Row: {
          current_streak: number
          last_active_date: string | null
          lessons_completed: number
          level: number
          longest_streak: number
          quizzes_completed: number
          total_study_time_seconds: number
          total_xp: number
          updated_at: string
          user_id: string
          vocab_mastered: number
        }
        Insert: {
          current_streak?: number
          last_active_date?: string | null
          lessons_completed?: number
          level?: number
          longest_streak?: number
          quizzes_completed?: number
          total_study_time_seconds?: number
          total_xp?: number
          updated_at?: string
          user_id: string
          vocab_mastered?: number
        }
        Update: {
          current_streak?: number
          last_active_date?: string | null
          lessons_completed?: number
          level?: number
          longest_streak?: number
          quizzes_completed?: number
          total_study_time_seconds?: number
          total_xp?: number
          updated_at?: string
          user_id?: string
          vocab_mastered?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_vocabulary: {
        Row: {
          created_at: string
          ease_factor: number
          interval_days: number
          last_quality: number | null
          last_reviewed_at: string | null
          next_review_at: string | null
          repetition_count: number
          status: Database["public"]["Enums"]["vocab_status"]
          updated_at: string
          user_id: string
          vocabulary_id: string
        }
        Insert: {
          created_at?: string
          ease_factor?: number
          interval_days?: number
          last_quality?: number | null
          last_reviewed_at?: string | null
          next_review_at?: string | null
          repetition_count?: number
          status?: Database["public"]["Enums"]["vocab_status"]
          updated_at?: string
          user_id: string
          vocabulary_id: string
        }
        Update: {
          created_at?: string
          ease_factor?: number
          interval_days?: number
          last_quality?: number | null
          last_reviewed_at?: string | null
          next_review_at?: string | null
          repetition_count?: number
          status?: Database["public"]["Enums"]["vocab_status"]
          updated_at?: string
          user_id?: string
          vocabulary_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_vocabulary_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_vocabulary_vocabulary_id_fkey"
            columns: ["vocabulary_id"]
            isOneToOne: false
            referencedRelation: "vocabulary"
            referencedColumns: ["id"]
          },
        ]
      }
      user_xp_ledger: {
        Row: {
          amount: number
          created_at: string
          dedupe_date: string | null
          description: string | null
          id: string
          reference_id: string | null
          source: Database["public"]["Enums"]["xp_source"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          dedupe_date?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          source: Database["public"]["Enums"]["xp_source"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          dedupe_date?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          source?: Database["public"]["Enums"]["xp_source"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_xp_ledger_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vocabulary: {
        Row: {
          cefr_level: Database["public"]["Enums"]["cefr_level"] | null
          created_at: string
          definition: string
          definition_th: string | null
          difficulty: number | null
          example_sentence: string | null
          example_sentence_th: string | null
          frequency_rank: number | null
          id: string
          image_url: string | null
          normalized_word: string
          part_of_speech: Database["public"]["Enums"]["part_of_speech"] | null
          phonetic: string | null
          slug: string
          tags: string[]
          tts_audio_url: string | null
          updated_at: string
          word: string
        }
        Insert: {
          cefr_level?: Database["public"]["Enums"]["cefr_level"] | null
          created_at?: string
          definition: string
          definition_th?: string | null
          difficulty?: number | null
          example_sentence?: string | null
          example_sentence_th?: string | null
          frequency_rank?: number | null
          id?: string
          image_url?: string | null
          normalized_word: string
          part_of_speech?: Database["public"]["Enums"]["part_of_speech"] | null
          phonetic?: string | null
          slug: string
          tags?: string[]
          tts_audio_url?: string | null
          updated_at?: string
          word: string
        }
        Update: {
          cefr_level?: Database["public"]["Enums"]["cefr_level"] | null
          created_at?: string
          definition?: string
          definition_th?: string | null
          difficulty?: number | null
          example_sentence?: string | null
          example_sentence_th?: string | null
          frequency_rank?: number | null
          id?: string
          image_url?: string | null
          normalized_word?: string
          part_of_speech?: Database["public"]["Enums"]["part_of_speech"] | null
          phonetic?: string | null
          slug?: string
          tags?: string[]
          tts_audio_url?: string | null
          updated_at?: string
          word?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_quiz_options: {
        Row: {
          content: string | null
          id: string | null
          order_index: number | null
          question_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      award_xp_internal: {
        Args: {
          p_amount: number
          p_description?: string
          p_reference_id?: string
          p_source: Database["public"]["Enums"]["xp_source"]
          p_user_id: string
        }
        Returns: number
      }
      calculate_level: { Args: { total_xp: number }; Returns: number }
      complete_lesson: {
        Args: { p_lesson_id: string; p_study_time_seconds?: number }
        Returns: {
          lesson_id: string
          status: Database["public"]["Enums"]["lesson_status"]
          xp_earned: number
        }[]
      }
      normalize_english: { Args: { value: string }; Returns: string }
      record_activity_internal: {
        Args: {
          p_study_time_seconds?: number
          p_user_id: string
          p_xp_earned?: number
        }
        Returns: undefined
      }
      review_vocabulary: {
        Args: { p_quality: number; p_vocabulary_id: string }
        Returns: undefined
      }
      save_vocabulary: { Args: { p_vocabulary_id: string }; Returns: undefined }
      search_vocabulary: {
        Args: { p_limit?: number; p_query: string }
        Returns: {
          cefr_level: Database["public"]["Enums"]["cefr_level"]
          definition: string
          definition_th: string
          id: string
          part_of_speech: Database["public"]["Enums"]["part_of_speech"]
          phonetic: string
          similarity: number
          word: string
        }[]
      }
      server_complete_lesson: {
        Args: {
          p_lesson_id: string
          p_study_time_seconds?: number
          p_user_id: string
        }
        Returns: {
          lesson_id: string
          status: Database["public"]["Enums"]["lesson_status"]
          xp_earned: number
        }[]
      }
      server_review_vocabulary: {
        Args: { p_quality: number; p_user_id: string; p_vocabulary_id: string }
        Returns: undefined
      }
      server_save_vocabulary: {
        Args: { p_user_id: string; p_vocabulary_id: string }
        Returns: undefined
      }
      server_submit_lesson_quiz: {
        Args: {
          p_answers: Json
          p_lesson_id: string
          p_time_taken_seconds?: number
          p_user_id: string
        }
        Returns: {
          attempt_id: string
          max_score: number
          passed: boolean
          percentage: number
          score: number
          xp_earned: number
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      slugify: { Args: { value: string }; Returns: string }
      submit_lesson_quiz: {
        Args: {
          p_answers: Json
          p_lesson_id: string
          p_time_taken_seconds?: number
        }
        Returns: {
          attempt_id: string
          max_score: number
          passed: boolean
          percentage: number
          score: number
          xp_earned: number
        }[]
      }
      unaccent: { Args: { "": string }; Returns: string }
    }
    Enums: {
      cefr_level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2"
      content_block_type:
        | "text"
        | "image"
        | "audio"
        | "video"
        | "callout"
        | "table"
      content_status: "draft" | "published" | "archived"
      lesson_category:
        | "vocabulary"
        | "grammar"
        | "pronunciation"
        | "listening"
        | "reading"
        | "writing"
        | "speaking"
        | "conversation"
      lesson_status: "not_started" | "in_progress" | "completed"
      part_of_speech:
        | "noun"
        | "verb"
        | "adjective"
        | "adverb"
        | "preposition"
        | "conjunction"
        | "pronoun"
        | "interjection"
        | "determiner"
      quiz_type: "multiple_choice" | "true_false"
      theme: "light" | "dark" | "system"
      user_role: "user" | "admin"
      vocab_status: "new" | "learning" | "reviewing" | "mastered"
      xp_source:
        | "lesson_complete"
        | "quiz_pass"
        | "daily_login"
        | "vocab_review"
        | "admin_adjustment"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      cefr_level: ["A1", "A2", "B1", "B2", "C1", "C2"],
      content_block_type: [
        "text",
        "image",
        "audio",
        "video",
        "callout",
        "table",
      ],
      content_status: ["draft", "published", "archived"],
      lesson_category: [
        "vocabulary",
        "grammar",
        "pronunciation",
        "listening",
        "reading",
        "writing",
        "speaking",
        "conversation",
      ],
      lesson_status: ["not_started", "in_progress", "completed"],
      part_of_speech: [
        "noun",
        "verb",
        "adjective",
        "adverb",
        "preposition",
        "conjunction",
        "pronoun",
        "interjection",
        "determiner",
      ],
      quiz_type: ["multiple_choice", "true_false"],
      theme: ["light", "dark", "system"],
      user_role: ["user", "admin"],
      vocab_status: ["new", "learning", "reviewing", "mastered"],
      xp_source: [
        "lesson_complete",
        "quiz_pass",
        "daily_login",
        "vocab_review",
        "admin_adjustment",
      ],
    },
  },
} as const
