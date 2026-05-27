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
      appointments: {
        Row: {
          clinic_id: string
          created_at: string
          doctor_id: string | null
          id: string
          notes: string | null
          patient_id: string
          scheduled_at: string
          status: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          doctor_id?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          scheduled_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          doctor_id?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          scheduled_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      billing_events: {
        Row: {
          amount_cents: number | null
          clinic_id: string | null
          created_at: string | null
          currency: string | null
          event_type: string
          id: string
          metadata: Json | null
          stripe_event_id: string | null
        }
        Insert: {
          amount_cents?: number | null
          clinic_id?: string | null
          created_at?: string | null
          currency?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          stripe_event_id?: string | null
        }
        Update: {
          amount_cents?: number | null
          clinic_id?: string | null
          created_at?: string | null
          currency?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          stripe_event_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_events_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_gallery_photos: {
        Row: {
          caption: string | null
          clinic_id: string | null
          created_at: string | null
          id: string
          order_index: number | null
          public_url: string
          storage_path: string
        }
        Insert: {
          caption?: string | null
          clinic_id?: string | null
          created_at?: string | null
          id?: string
          order_index?: number | null
          public_url: string
          storage_path: string
        }
        Update: {
          caption?: string | null
          clinic_id?: string | null
          created_at?: string | null
          id?: string
          order_index?: number | null
          public_url?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_gallery_photos_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_specialties: {
        Row: {
          clinic_id: string | null
          icon: string | null
          id: string
          name: string
          order_index: number | null
        }
        Insert: {
          clinic_id?: string | null
          icon?: string | null
          id?: string
          name: string
          order_index?: number | null
        }
        Update: {
          clinic_id?: string | null
          icon?: string | null
          id?: string
          name?: string
          order_index?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "clinic_specialties_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_testimonials: {
        Row: {
          avatar_url: string | null
          clinic_id: string | null
          content: string
          created_at: string | null
          id: string
          is_published: boolean | null
          order_index: number | null
          patient_name: string
          rating: number | null
        }
        Insert: {
          avatar_url?: string | null
          clinic_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          order_index?: number | null
          patient_name: string
          rating?: number | null
        }
        Update: {
          avatar_url?: string | null
          clinic_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          order_index?: number | null
          patient_name?: string
          rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "clinic_testimonials_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_comments: {
        Row: {
          content: string
          created_at: string | null
          doctor_id: string | null
          id: string
          is_visible_to_patient: boolean | null
          patient_id: string | null
          photo_id: string | null
          treatment_id: string | null
          week_number: number | null
        }
        Insert: {
          content: string
          created_at?: string | null
          doctor_id?: string | null
          id?: string
          is_visible_to_patient?: boolean | null
          patient_id?: string | null
          photo_id?: string | null
          treatment_id?: string | null
          week_number?: number | null
        }
        Update: {
          content?: string
          created_at?: string | null
          doctor_id?: string | null
          id?: string
          is_visible_to_patient?: boolean | null
          patient_id?: string | null
          photo_id?: string | null
          treatment_id?: string | null
          week_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "clinical_comments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_comments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_comments_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "evolution_photos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_comments_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      clinics: {
        Row: {
          access_code: string
          brand_color_accent: string | null
          brand_color_dark: string | null
          brand_color_light: string | null
          brand_color_primary: string | null
          created_at: string | null
          doctor_name: string
          favicon_url: string | null
          id: string
          logo_url: string | null
          max_patients: number | null
          name: string
          onboarding_completed_at: string | null
          plan: string | null
          profile_address: string | null
          profile_banner_url: string | null
          profile_city: string | null
          profile_cnpj: string | null
          profile_crm: string | null
          profile_description: string | null
          profile_instagram: string | null
          profile_phone: string | null
          profile_photo_url: string | null
          profile_state: string | null
          profile_tagline: string | null
          profile_website: string | null
          profile_whatsapp: string | null
          specialty: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          trial_ends_at: string | null
          updated_at: string | null
          uv_alert_message: string | null
          years_experience: number | null
        }
        Insert: {
          access_code: string
          brand_color_accent?: string | null
          brand_color_dark?: string | null
          brand_color_light?: string | null
          brand_color_primary?: string | null
          created_at?: string | null
          doctor_name: string
          favicon_url?: string | null
          id?: string
          logo_url?: string | null
          max_patients?: number | null
          name: string
          onboarding_completed_at?: string | null
          plan?: string | null
          profile_address?: string | null
          profile_banner_url?: string | null
          profile_city?: string | null
          profile_cnpj?: string | null
          profile_crm?: string | null
          profile_description?: string | null
          profile_instagram?: string | null
          profile_phone?: string | null
          profile_photo_url?: string | null
          profile_state?: string | null
          profile_tagline?: string | null
          profile_website?: string | null
          profile_whatsapp?: string | null
          specialty?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          uv_alert_message?: string | null
          years_experience?: number | null
        }
        Update: {
          access_code?: string
          brand_color_accent?: string | null
          brand_color_dark?: string | null
          brand_color_light?: string | null
          brand_color_primary?: string | null
          created_at?: string | null
          doctor_name?: string
          favicon_url?: string | null
          id?: string
          logo_url?: string | null
          max_patients?: number | null
          name?: string
          onboarding_completed_at?: string | null
          plan?: string | null
          profile_address?: string | null
          profile_banner_url?: string | null
          profile_city?: string | null
          profile_cnpj?: string | null
          profile_crm?: string | null
          profile_description?: string | null
          profile_instagram?: string | null
          profile_phone?: string | null
          profile_photo_url?: string | null
          profile_state?: string | null
          profile_tagline?: string | null
          profile_website?: string | null
          profile_whatsapp?: string | null
          specialty?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          uv_alert_message?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
      content_bookmarks: {
        Row: {
          created_at: string | null
          id: string
          patient_id: string | null
          post_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          patient_id?: string | null
          post_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          patient_id?: string | null
          post_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_bookmarks_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_bookmarks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "content_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      content_post_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          patient_id: string | null
          post_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          patient_id?: string | null
          post_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          patient_id?: string | null
          post_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_post_comments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "content_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      content_post_likes: {
        Row: {
          created_at: string | null
          id: string
          patient_id: string | null
          post_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          patient_id?: string | null
          post_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          patient_id?: string | null
          post_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_post_likes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "content_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      content_posts: {
        Row: {
          author_id: string | null
          category: string | null
          clinic_id: string | null
          comment_count: number | null
          content: string | null
          cover_image_url: string | null
          created_at: string | null
          duration_seconds: number | null
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          like_count: number | null
          published_at: string | null
          read_time_minutes: number | null
          related_condition_id: string | null
          slug: string
          summary: string | null
          tags: string[] | null
          title: string
          type: string
          updated_at: string | null
          video_storage_path: string | null
          video_thumbnail_url: string | null
          video_url: string | null
          view_count: number | null
        }
        Insert: {
          author_id?: string | null
          category?: string | null
          clinic_id?: string | null
          comment_count?: number | null
          content?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          like_count?: number | null
          published_at?: string | null
          read_time_minutes?: number | null
          related_condition_id?: string | null
          slug: string
          summary?: string | null
          tags?: string[] | null
          title: string
          type: string
          updated_at?: string | null
          video_storage_path?: string | null
          video_thumbnail_url?: string | null
          video_url?: string | null
          view_count?: number | null
        }
        Update: {
          author_id?: string | null
          category?: string | null
          clinic_id?: string | null
          comment_count?: number | null
          content?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          like_count?: number | null
          published_at?: string | null
          read_time_minutes?: number | null
          related_condition_id?: string | null
          slug?: string
          summary?: string | null
          tags?: string[] | null
          title?: string
          type?: string
          updated_at?: string | null
          video_storage_path?: string | null
          video_thumbnail_url?: string | null
          video_url?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "content_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_posts_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_posts_related_condition_id_fkey"
            columns: ["related_condition_id"]
            isOneToOne: false
            referencedRelation: "wiki_conditions"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_feedback: {
        Row: {
          clinic_id: string | null
          created_at: string
          doctor_id: string | null
          id: string
          include_ai_analysis: boolean
          message: string | null
          next_steps: Json
          patient_id: string
          photo_id: string | null
          progress_level: string
          sent_at: string | null
          status: string
          treatment_id: string | null
          updated_at: string
          week_number: number | null
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string
          doctor_id?: string | null
          id?: string
          include_ai_analysis?: boolean
          message?: string | null
          next_steps?: Json
          patient_id: string
          photo_id?: string | null
          progress_level: string
          sent_at?: string | null
          status?: string
          treatment_id?: string | null
          updated_at?: string
          week_number?: number | null
        }
        Update: {
          clinic_id?: string | null
          created_at?: string
          doctor_id?: string | null
          id?: string
          include_ai_analysis?: boolean
          message?: string | null
          next_steps?: Json
          patient_id?: string
          photo_id?: string | null
          progress_level?: string
          sent_at?: string | null
          status?: string
          treatment_id?: string | null
          updated_at?: string
          week_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "doctor_feedback_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_feedback_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_feedback_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_feedback_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "evolution_photos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_feedback_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          avatar_url: string | null
          bio: string | null
          clinic_id: string | null
          created_at: string | null
          crm: string | null
          email: string
          full_name: string
          id: string
          role: string | null
          specialty: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          clinic_id?: string | null
          created_at?: string | null
          crm?: string | null
          email: string
          full_name: string
          id?: string
          role?: string | null
          specialty?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          clinic_id?: string | null
          created_at?: string | null
          crm?: string | null
          email?: string
          full_name?: string
          id?: string
          role?: string | null
          specialty?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctors_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      evolution_photos: {
        Row: {
          ai_analysis: Json | null
          ai_visible_to_patient: boolean
          angle: string | null
          checklist_accessories: boolean | null
          checklist_background: boolean | null
          checklist_light: boolean | null
          clinic_id: string | null
          created_at: string | null
          doctor_approved_at: string | null
          doctor_comment: string | null
          id: string
          improvement_score: number | null
          patient_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          storage_path: string
          taken_at: string | null
          thumbnail_path: string | null
          treatment_id: string | null
          week_number: number
        }
        Insert: {
          ai_analysis?: Json | null
          ai_visible_to_patient?: boolean
          angle?: string | null
          checklist_accessories?: boolean | null
          checklist_background?: boolean | null
          checklist_light?: boolean | null
          clinic_id?: string | null
          created_at?: string | null
          doctor_approved_at?: string | null
          doctor_comment?: string | null
          id?: string
          improvement_score?: number | null
          patient_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          storage_path: string
          taken_at?: string | null
          thumbnail_path?: string | null
          treatment_id?: string | null
          week_number: number
        }
        Update: {
          ai_analysis?: Json | null
          ai_visible_to_patient?: boolean
          angle?: string | null
          checklist_accessories?: boolean | null
          checklist_background?: boolean | null
          checklist_light?: boolean | null
          clinic_id?: string | null
          created_at?: string | null
          doctor_approved_at?: string | null
          doctor_comment?: string | null
          id?: string
          improvement_score?: number | null
          patient_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          storage_path?: string
          taken_at?: string | null
          thumbnail_path?: string | null
          treatment_id?: string | null
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "evolution_photos_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evolution_photos_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evolution_photos_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evolution_photos_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          clinic_id: string | null
          created_at: string | null
          data: Json | null
          id: string
          read_at: string | null
          recipient_id: string
          title: string
          type: string
        }
        Insert: {
          body: string
          clinic_id?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          read_at?: string | null
          recipient_id: string
          title: string
          type: string
        }
        Update: {
          body?: string
          clinic_id?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          read_at?: string | null
          recipient_id?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_achievements: {
        Row: {
          achievement: string
          clinic_id: string | null
          id: string
          patient_id: string
          unlocked_at: string
        }
        Insert: {
          achievement: string
          clinic_id?: string | null
          id?: string
          patient_id: string
          unlocked_at?: string
        }
        Update: {
          achievement?: string
          clinic_id?: string | null
          id?: string
          patient_id?: string
          unlocked_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_achievements_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_achievements_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          city: string | null
          clinic_id: string | null
          cpf: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          lat: number | null
          lng: number | null
          phone: string | null
          state: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          city?: string | null
          clinic_id?: string | null
          cpf?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          lat?: number | null
          lng?: number | null
          phone?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          city?: string | null
          clinic_id?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          lat?: number | null
          lng?: number | null
          phone?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patients_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          price_id: string
          product_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id: string
          product_id: string
          status?: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id?: string
          product_id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      treatments: {
        Row: {
          clinic_id: string | null
          condition_name: string
          created_at: string | null
          current_week: number | null
          doctor_id: string | null
          id: string
          notes: string | null
          patient_id: string | null
          protocol: string | null
          started_at: string
          status: string | null
          total_weeks: number
          updated_at: string | null
        }
        Insert: {
          clinic_id?: string | null
          condition_name: string
          created_at?: string | null
          current_week?: number | null
          doctor_id?: string | null
          id?: string
          notes?: string | null
          patient_id?: string | null
          protocol?: string | null
          started_at: string
          status?: string | null
          total_weeks: number
          updated_at?: string | null
        }
        Update: {
          clinic_id?: string | null
          condition_name?: string
          created_at?: string | null
          current_week?: number | null
          doctor_id?: string | null
          id?: string
          notes?: string | null
          patient_id?: string | null
          protocol?: string | null
          started_at?: string
          status?: string | null
          total_weeks?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "treatments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      uv_protection_logs: {
        Row: {
          city: string | null
          clinic_id: string | null
          id: string
          lat: number | null
          lng: number | null
          patient_id: string | null
          registered_at: string | null
          temperature: number | null
          uv_index: number | null
        }
        Insert: {
          city?: string | null
          clinic_id?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          patient_id?: string | null
          registered_at?: string | null
          temperature?: number | null
          uv_index?: number | null
        }
        Update: {
          city?: string | null
          clinic_id?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          patient_id?: string | null
          registered_at?: string | null
          temperature?: number | null
          uv_index?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "uv_protection_logs_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uv_protection_logs_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      wiki_conditions: {
        Row: {
          category: string | null
          causes: string | null
          clinic_id: string | null
          created_at: string | null
          description: string
          diagnosis: string | null
          emoji: string | null
          home_care_steps: Json | null
          id: string
          is_published: boolean | null
          name: string
          prevention_tips: string | null
          slug: string
          symptoms: string | null
          treatment_info: string | null
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          category?: string | null
          causes?: string | null
          clinic_id?: string | null
          created_at?: string | null
          description: string
          diagnosis?: string | null
          emoji?: string | null
          home_care_steps?: Json | null
          id?: string
          is_published?: boolean | null
          name: string
          prevention_tips?: string | null
          slug: string
          symptoms?: string | null
          treatment_info?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          category?: string | null
          causes?: string | null
          clinic_id?: string | null
          created_at?: string | null
          description?: string
          diagnosis?: string | null
          emoji?: string | null
          home_care_steps?: Json | null
          id?: string
          is_published?: boolean | null
          name?: string
          prevention_tips?: string | null
          slug?: string
          symptoms?: string | null
          treatment_info?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "wiki_conditions_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      wiki_videos: {
        Row: {
          clinic_id: string | null
          condition_id: string | null
          created_at: string | null
          description: string | null
          duration_seconds: number | null
          id: string
          order_index: number | null
          section: string | null
          storage_path: string
          thumbnail_path: string | null
          title: string
        }
        Insert: {
          clinic_id?: string | null
          condition_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          id?: string
          order_index?: number | null
          section?: string | null
          storage_path: string
          thumbnail_path?: string | null
          title: string
        }
        Update: {
          clinic_id?: string | null
          condition_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          id?: string
          order_index?: number | null
          section?: string | null
          storage_path?: string
          thumbnail_path?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "wiki_videos_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wiki_videos_condition_id_fkey"
            columns: ["condition_id"]
            isOneToOne: false
            referencedRelation: "wiki_conditions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_clinic_access_code: { Args: never; Returns: string }
      get_user_clinic_id: { Args: never; Returns: string }
      has_active_subscription: {
        Args: { check_env?: string; user_uuid: string }
        Returns: boolean
      }
      is_doctor: { Args: never; Returns: boolean }
      is_patient: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
