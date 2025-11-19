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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action_type: string
          admin_user_id: string
          created_at: string
          id: string
          ip_address: string | null
          new_value: Json | null
          old_value: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
        }
        Insert: {
          action_type: string
          admin_user_id: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
        }
        Update: {
          action_type?: string
          admin_user_id?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          created_at: string
          email: string
          id: string
          role: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          role?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          role?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      auth_otp_codes: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string
          id: string
          is_used: boolean | null
          otp_code: string
          purpose: string
          user_data: Json | null
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          is_used?: boolean | null
          otp_code: string
          purpose: string
          user_data?: Json | null
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          is_used?: boolean | null
          otp_code?: string
          purpose?: string
          user_data?: Json | null
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          created_at: string
          description: string
          email: string
          full_name: string
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          email: string
          full_name: string
          id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          email?: string
          full_name?: string
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      currencies: {
        Row: {
          code: string
          created_at: string
          exchange_rate: number | null
          id: string
          is_active: boolean | null
          name: string
          symbol: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          exchange_rate?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          symbol: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          exchange_rate?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          symbol?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          body: string
          created_at: string | null
          error_message: string | null
          id: string
          recipient_email: string
          recipient_name: string | null
          sent_at: string | null
          status: string
          subject: string
          template_key: string | null
          variables: Json | null
        }
        Insert: {
          body: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          recipient_email: string
          recipient_name?: string | null
          sent_at?: string | null
          status?: string
          subject: string
          template_key?: string | null
          variables?: Json | null
        }
        Update: {
          body?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          recipient_email?: string
          recipient_name?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          template_key?: string | null
          variables?: Json | null
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          body: Json
          created_at: string | null
          description: string | null
          from_email: string | null
          from_name: string | null
          id: string
          is_active: boolean | null
          reply_to: string | null
          subject: Json
          template_key: string
          template_name: Json
          updated_at: string | null
          variables: string[] | null
        }
        Insert: {
          body?: Json
          created_at?: string | null
          description?: string | null
          from_email?: string | null
          from_name?: string | null
          id?: string
          is_active?: boolean | null
          reply_to?: string | null
          subject?: Json
          template_key: string
          template_name?: Json
          updated_at?: string | null
          variables?: string[] | null
        }
        Update: {
          body?: Json
          created_at?: string | null
          description?: string | null
          from_email?: string | null
          from_name?: string | null
          id?: string
          is_active?: boolean | null
          reply_to?: string | null
          subject?: Json
          template_key?: string
          template_name?: Json
          updated_at?: string | null
          variables?: string[] | null
        }
        Relationships: []
      }
      families: {
        Row: {
          archived_at: string | null
          created_at: string
          creator_id: string | null
          custom_domain: string | null
          description: string | null
          id: string
          is_archived: boolean | null
          name: string
          share_gallery: boolean | null
          share_password: string | null
          share_token: string | null
          share_token_expires_at: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          creator_id?: string | null
          custom_domain?: string | null
          description?: string | null
          id?: string
          is_archived?: boolean | null
          name: string
          share_gallery?: boolean | null
          share_password?: string | null
          share_token?: string | null
          share_token_expires_at?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          creator_id?: string | null
          custom_domain?: string | null
          description?: string | null
          id?: string
          is_archived?: boolean | null
          name?: string
          share_gallery?: boolean | null
          share_password?: string | null
          share_token?: string | null
          share_token_expires_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      family_members: {
        Row: {
          family_id: string | null
          id: string
          joined_at: string
          role: string | null
          user_id: string | null
        }
        Insert: {
          family_id?: string | null
          id?: string
          joined_at?: string
          role?: string | null
          user_id?: string | null
        }
        Update: {
          family_id?: string | null
          id?: string
          joined_at?: string
          role?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "family_members_family_id_fkey_cascade"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      family_memories: {
        Row: {
          caption: string | null
          content_type: string
          created_at: string
          family_id: string
          file_path: string
          file_size: number
          id: string
          linked_member_id: string | null
          original_filename: string
          photo_date: string | null
          tags: string[] | null
          updated_at: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          caption?: string | null
          content_type: string
          created_at?: string
          family_id: string
          file_path: string
          file_size: number
          id?: string
          linked_member_id?: string | null
          original_filename: string
          photo_date?: string | null
          tags?: string[] | null
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Update: {
          caption?: string | null
          content_type?: string
          created_at?: string
          family_id?: string
          file_path?: string
          file_size?: number
          id?: string
          linked_member_id?: string | null
          original_filename?: string
          photo_date?: string | null
          tags?: string[] | null
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_memories_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_memories_linked_member_id_fkey"
            columns: ["linked_member_id"]
            isOneToOne: false
            referencedRelation: "family_tree_members"
            referencedColumns: ["id"]
          },
        ]
      }
      family_tree_members: {
        Row: {
          biography: string | null
          birth_date: string | null
          created_at: string
          created_by: string | null
          death_date: string | null
          family_id: string
          father_id: string | null
          first_name: string | null
          gender: string | null
          id: string
          image_url: string | null
          is_alive: boolean | null
          is_founder: boolean | null
          is_twin: boolean | null
          last_name: string | null
          marital_status: string | null
          mother_id: string | null
          name: string
          related_person_id: string | null
          spouse_id: string | null
          twin_group_id: string | null
          updated_at: string
        }
        Insert: {
          biography?: string | null
          birth_date?: string | null
          created_at?: string
          created_by?: string | null
          death_date?: string | null
          family_id: string
          father_id?: string | null
          first_name?: string | null
          gender?: string | null
          id?: string
          image_url?: string | null
          is_alive?: boolean | null
          is_founder?: boolean | null
          is_twin?: boolean | null
          last_name?: string | null
          marital_status?: string | null
          mother_id?: string | null
          name: string
          related_person_id?: string | null
          spouse_id?: string | null
          twin_group_id?: string | null
          updated_at?: string
        }
        Update: {
          biography?: string | null
          birth_date?: string | null
          created_at?: string
          created_by?: string | null
          death_date?: string | null
          family_id?: string
          father_id?: string | null
          first_name?: string | null
          gender?: string | null
          id?: string
          image_url?: string | null
          is_alive?: boolean | null
          is_founder?: boolean | null
          is_twin?: boolean | null
          last_name?: string | null
          marital_status?: string | null
          mother_id?: string | null
          name?: string
          related_person_id?: string | null
          spouse_id?: string | null
          twin_group_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_tree_members_family_id_fkey_cascade"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_tree_members_father_id_fkey_cascade"
            columns: ["father_id"]
            isOneToOne: false
            referencedRelation: "family_tree_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_tree_members_mother_id_fkey_cascade"
            columns: ["mother_id"]
            isOneToOne: false
            referencedRelation: "family_tree_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_tree_members_related_person_id_fkey"
            columns: ["related_person_id"]
            isOneToOne: false
            referencedRelation: "marriages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_tree_members_spouse_id_fkey_cascade"
            columns: ["spouse_id"]
            isOneToOne: false
            referencedRelation: "family_tree_members"
            referencedColumns: ["id"]
          },
        ]
      }
      homepage_content: {
        Row: {
          content: Json
          id: string
          is_active: boolean | null
          language_code: string | null
          section: string
          updated_at: string
        }
        Insert: {
          content: Json
          id?: string
          is_active?: boolean | null
          language_code?: string | null
          section: string
          updated_at?: string
        }
        Update: {
          content?: Json
          id?: string
          is_active?: boolean | null
          language_code?: string | null
          section?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_language"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          billing_agreement_id: string | null
          created_at: string
          currency: string | null
          due_date: string | null
          family_id: string | null
          id: string
          invoice_number: string | null
          is_recurring: boolean | null
          package_id: string | null
          payment_gateway: string | null
          payment_status: string | null
          paypal_capture_id: string | null
          paypal_order_id: string | null
          status: string | null
          stripe_payment_intent_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount: number
          billing_agreement_id?: string | null
          created_at?: string
          currency?: string | null
          due_date?: string | null
          family_id?: string | null
          id?: string
          invoice_number?: string | null
          is_recurring?: boolean | null
          package_id?: string | null
          payment_gateway?: string | null
          payment_status?: string | null
          paypal_capture_id?: string | null
          paypal_order_id?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          billing_agreement_id?: string | null
          created_at?: string
          currency?: string | null
          due_date?: string | null
          family_id?: string | null
          id?: string
          invoice_number?: string | null
          is_recurring?: boolean | null
          package_id?: string | null
          payment_gateway?: string | null
          payment_status?: string | null
          paypal_capture_id?: string | null
          paypal_order_id?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      languages: {
        Row: {
          code: string
          created_at: string
          currency: string | null
          direction: string
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          currency?: string | null
          direction?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          currency?: string | null
          direction?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          attempted_at: string | null
          email: string
          failure_reason: string | null
          id: string
          ip_address: string | null
          success: boolean | null
          user_agent: string | null
        }
        Insert: {
          attempted_at?: string | null
          email: string
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean | null
          user_agent?: string | null
        }
        Update: {
          attempted_at?: string | null
          email?: string
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean | null
          user_agent?: string | null
        }
        Relationships: []
      }
      marriages: {
        Row: {
          created_at: string
          family_id: string
          husband_id: string
          id: string
          is_active: boolean | null
          marital_status: string | null
          updated_at: string
          wife_id: string
        }
        Insert: {
          created_at?: string
          family_id: string
          husband_id: string
          id?: string
          is_active?: boolean | null
          marital_status?: string | null
          updated_at?: string
          wife_id: string
        }
        Update: {
          created_at?: string
          family_id?: string
          husband_id?: string
          id?: string
          is_active?: boolean | null
          marital_status?: string | null
          updated_at?: string
          wife_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marriages_family_id_fkey_cascade"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marriages_husband_id_fkey_cascade"
            columns: ["husband_id"]
            isOneToOne: false
            referencedRelation: "family_tree_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marriages_wife_id_fkey_cascade"
            columns: ["wife_id"]
            isOneToOne: false
            referencedRelation: "family_tree_members"
            referencedColumns: ["id"]
          },
        ]
      }
      member_memories: {
        Row: {
          caption: string | null
          content_type: string
          created_at: string
          file_path: string
          file_size: number
          id: string
          member_id: string
          original_filename: string
          updated_at: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          caption?: string | null
          content_type: string
          created_at?: string
          file_path: string
          file_size: number
          id?: string
          member_id: string
          original_filename: string
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Update: {
          caption?: string | null
          content_type?: string
          created_at?: string
          file_path?: string
          file_size?: number
          id?: string
          member_id?: string
          original_filename?: string
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_memories_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "family_tree_members"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscriptions: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      packages: {
        Row: {
          ai_features_enabled: boolean | null
          created_at: string
          custom_domains_enabled: boolean | null
          description: Json | null
          display_order: number | null
          features: Json | null
          id: string
          image_upload_enabled: boolean | null
          is_active: boolean | null
          is_featured: boolean | null
          max_family_members: number | null
          max_family_trees: number | null
          name: Json
          price_sar: number | null
          price_usd: number | null
          updated_at: string
        }
        Insert: {
          ai_features_enabled?: boolean | null
          created_at?: string
          custom_domains_enabled?: boolean | null
          description?: Json | null
          display_order?: number | null
          features?: Json | null
          id?: string
          image_upload_enabled?: boolean | null
          is_active?: boolean | null
          is_featured?: boolean | null
          max_family_members?: number | null
          max_family_trees?: number | null
          name: Json
          price_sar?: number | null
          price_usd?: number | null
          updated_at?: string
        }
        Update: {
          ai_features_enabled?: boolean | null
          created_at?: string
          custom_domains_enabled?: boolean | null
          description?: Json | null
          display_order?: number | null
          features?: Json | null
          id?: string
          image_upload_enabled?: boolean | null
          is_active?: boolean | null
          is_featured?: boolean | null
          max_family_members?: number | null
          max_family_trees?: number | null
          name?: Json
          price_sar?: number | null
          price_usd?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      pages: {
        Row: {
          content: Json
          created_at: string
          display_order: number | null
          id: string
          is_active: boolean
          meta_description: Json | null
          meta_keywords: Json | null
          quick_info: Json | null
          slug: string
          title: Json
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean
          meta_description?: Json | null
          meta_keywords?: Json | null
          quick_info?: Json | null
          slug: string
          title?: Json
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean
          meta_description?: Json | null
          meta_keywords?: Json | null
          quick_info?: Json | null
          slug?: string
          title?: Json
          updated_at?: string
        }
        Relationships: []
      }
      payment_funnel_events: {
        Row: {
          amount: number | null
          created_at: string
          currency: string | null
          event_type: Database["public"]["Enums"]["payment_event_type"]
          failure_reason: string | null
          id: string
          metadata: Json | null
          package_id: string | null
          payment_gateway: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          event_type: Database["public"]["Enums"]["payment_event_type"]
          failure_reason?: string | null
          id?: string
          metadata?: Json | null
          package_id?: string | null
          payment_gateway?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          event_type?: Database["public"]["Enums"]["payment_event_type"]
          failure_reason?: string | null
          id?: string
          metadata?: Json | null
          package_id?: string | null
          payment_gateway?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_funnel_events_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_gateway_settings: {
        Row: {
          created_at: string | null
          environment: string
          gateway_name: string
          id: string
          is_active: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          environment?: string
          gateway_name?: string
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          environment?: string
          gateway_name?: string
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      payment_tokens: {
        Row: {
          created_at: string
          customer_id: string | null
          id: string
          metadata: Json | null
          payment_gateway: string
          payment_source_type: string | null
          setup_token_id: string | null
          status: string
          token_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          id?: string
          metadata?: Json | null
          payment_gateway?: string
          payment_source_type?: string | null
          setup_token_id?: string | null
          status?: string
          token_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          id?: string
          metadata?: Json | null
          payment_gateway?: string
          payment_source_type?: string | null
          setup_token_id?: string | null
          status?: string
          token_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          date_preference: string | null
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          theme_mode: string | null
          theme_variant: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          date_preference?: string | null
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          theme_mode?: string | null
          theme_variant?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          date_preference?: string | null
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          theme_mode?: string | null
          theme_variant?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      scheduled_package_changes: {
        Row: {
          created_at: string
          current_package_id: string
          id: string
          scheduled_date: string
          status: string
          target_package_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_package_id: string
          id?: string
          scheduled_date: string
          status?: string
          target_package_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_package_id?: string
          id?: string
          scheduled_date?: string
          status?: string
          target_package_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      search_embeddings: {
        Row: {
          content: string
          content_type: string
          created_at: string
          embedding: string | null
          family_member_id: string
          id: string
          updated_at: string
        }
        Insert: {
          content: string
          content_type: string
          created_at?: string
          embedding?: string | null
          family_member_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          content?: string
          content_type?: string
          created_at?: string
          embedding?: string | null
          family_member_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "search_embeddings_family_member_id_fkey"
            columns: ["family_member_id"]
            isOneToOne: false
            referencedRelation: "family_tree_members"
            referencedColumns: ["id"]
          },
        ]
      }
      smart_suggestions: {
        Row: {
          confidence_score: number | null
          created_at: string
          family_member_id: string | null
          id: string
          status: string
          suggestion_data: Json
          suggestion_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          family_member_id?: string | null
          id?: string
          status?: string
          suggestion_data: Json
          suggestion_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          family_member_id?: string | null
          id?: string
          status?: string
          suggestion_data?: Json
          suggestion_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "smart_suggestions_family_member_id_fkey"
            columns: ["family_member_id"]
            isOneToOne: false
            referencedRelation: "family_tree_members"
            referencedColumns: ["id"]
          },
        ]
      }
      social_media_settings: {
        Row: {
          created_at: string
          default_description: Json
          id: string
          og_image_url: string | null
          site_name: Json
          twitter_handle: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_description?: Json
          id?: string
          og_image_url?: string | null
          site_name?: Json
          twitter_handle?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_description?: Json
          id?: string
          og_image_url?: string | null
          site_name?: Json
          twitter_handle?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      store_orders: {
        Row: {
          created_at: string
          currency: string | null
          id: string
          items: Json
          order_number: string
          shipping_address: Json | null
          status: string | null
          total_amount: number
          tracking_number: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          currency?: string | null
          id?: string
          items: Json
          order_number: string
          shipping_address?: Json | null
          status?: string | null
          total_amount: number
          tracking_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          currency?: string | null
          id?: string
          items?: Json
          order_number?: string
          shipping_address?: Json | null
          status?: string | null
          total_amount?: number
          tracking_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      translations: {
        Row: {
          category: string | null
          created_at: string
          id: string
          key: string
          language_code: string
          updated_at: string
          value: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          key: string
          language_code: string
          updated_at?: string
          value: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          key?: string
          language_code?: string
          updated_at?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "translations_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
        ]
      }
      tree_edit_suggestions: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          family_id: string
          id: string
          is_email_verified: boolean | null
          member_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitter_email: string
          submitter_name: string
          suggested_changes: Json | null
          suggestion_text: string
          suggestion_type: string
          updated_at: string | null
          verification_code: string | null
          verification_code_expires_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          family_id: string
          id?: string
          is_email_verified?: boolean | null
          member_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitter_email: string
          submitter_name: string
          suggested_changes?: Json | null
          suggestion_text: string
          suggestion_type: string
          updated_at?: string | null
          verification_code?: string | null
          verification_code_expires_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          family_id?: string
          id?: string
          is_email_verified?: boolean | null
          member_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitter_email?: string
          submitter_name?: string
          suggested_changes?: Json | null
          suggestion_text?: string
          suggestion_type?: string
          updated_at?: string | null
          verification_code?: string | null
          verification_code_expires_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tree_edit_suggestions_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tree_edit_suggestions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "family_tree_members"
            referencedColumns: ["id"]
          },
        ]
      }
      user_cookie_preferences: {
        Row: {
          analytics: boolean
          consent_date: string
          id: string
          marketing: boolean
          necessary: boolean
          preferences: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          analytics?: boolean
          consent_date?: string
          id?: string
          marketing?: boolean
          necessary?: boolean
          preferences?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          analytics?: boolean
          consent_date?: string
          id?: string
          marketing?: boolean
          necessary?: boolean
          preferences?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_status: {
        Row: {
          created_at: string
          id: string
          reason: string | null
          status: Database["public"]["Enums"]["user_status_type"]
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason?: string | null
          status?: Database["public"]["Enums"]["user_status_type"]
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string | null
          status?: Database["public"]["Enums"]["user_status_type"]
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          package_id: string
          payment_token_id: string | null
          paypal_subscription_id: string | null
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          package_id: string
          payment_token_id?: string | null
          paypal_subscription_id?: string | null
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          package_id?: string
          payment_token_id?: string | null
          paypal_subscription_id?: string | null
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_subscriptions_payment_token_id_fkey"
            columns: ["payment_token_id"]
            isOneToOne: false
            referencedRelation: "payment_tokens"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_change_user_package: {
        Args: {
          change_type?: string
          new_package_id: string
          target_user_id: string
        }
        Returns: boolean
      }
      admin_extend_subscription: {
        Args: { new_expiry_date: string; target_user_id: string }
        Returns: boolean
      }
      cancel_scheduled_package_change: {
        Args: { p_scheduled_change_id: string; p_user_id: string }
        Returns: boolean
      }
      check_failed_login_attempts: {
        Args: {
          max_attempts?: number
          time_window_minutes?: number
          user_email: string
        }
        Returns: {
          attempts_count: number
          is_allowed: boolean
          remaining_attempts: number
          reset_time: string
        }[]
      }
      cleanup_expired_otps: { Args: never; Returns: undefined }
      cleanup_old_login_attempts: { Args: never; Returns: undefined }
      complete_payment_and_upgrade: {
        Args: {
          p_invoice_id: string
          p_payment_gateway?: string
          p_payment_id?: string
        }
        Returns: boolean
      }
      create_admin_user: { Args: { admin_email: string }; Returns: undefined }
      create_invoice: {
        Args: {
          p_amount: number
          p_currency?: string
          p_family_id?: string
          p_package_id: string
          p_user_id: string
        }
        Returns: string
      }
      delete_family_complete: {
        Args: { family_uuid: string }
        Returns: boolean
      }
      generate_invoice_number: { Args: never; Returns: string }
      get_all_users_for_admin: {
        Args: never
        Returns: {
          created_at: string
          email: string
          email_confirmed_at: string
          first_name: string
          id: string
          last_name: string
          phone: string
          profile_id: string
          profile_phone: string
          status_reason: string
          subscription_expires_at: string
          subscription_package_name: Json
          subscription_status: string
          updated_at: string
          user_status: Database["public"]["Enums"]["user_status_type"]
        }[]
      }
      get_payment_funnel_analytics: {
        Args: { p_end_date?: string; p_start_date?: string }
        Returns: {
          avg_transaction_value: number
          conversion_rate_click_to_initiate: number
          conversion_rate_initiate_to_success: number
          conversion_rate_overall: number
          top_failure_reason: string
          top_package_id: string
          top_package_name: Json
          total_package_selections: number
          total_package_views: number
          total_payment_failures: number
          total_payment_initiations: number
          total_payment_successes: number
          total_revenue: number
          total_upgrade_clicks: number
        }[]
      }
      get_user_family_ids: {
        Args: { user_uuid: string }
        Returns: {
          family_id: string
        }[]
      }
      get_user_subscription_details: {
        Args: { user_uuid: string }
        Returns: {
          ai_features_enabled: boolean
          days_until_expiry: number
          expires_at: string
          is_expired: boolean
          package_name: Json
          status: string
          subscription_id: string
        }[]
      }
      is_admin: { Args: { user_uuid: string }; Returns: boolean }
      is_admin_secure: { Args: { user_uuid: string }; Returns: boolean }
      is_maintenance_mode_enabled: { Args: never; Returns: boolean }
      is_subscription_expired: { Args: { user_uuid: string }; Returns: boolean }
      log_login_attempt: {
        Args: {
          is_success: boolean
          reason?: string
          user_agent_text: string
          user_email: string
          user_ip: string
        }
        Returns: string
      }
      log_payment_event: {
        Args: {
          p_amount?: number
          p_currency?: string
          p_event_type: Database["public"]["Enums"]["payment_event_type"]
          p_failure_reason?: string
          p_metadata?: Json
          p_package_id?: string
          p_payment_gateway?: string
        }
        Returns: string
      }
      process_recurring_payment: {
        Args: {
          p_amount: number
          p_currency: string
          p_package_id: string
          p_payment_token_id: string
          p_user_id: string
        }
        Returns: string
      }
      process_scheduled_package_change: {
        Args: { p_scheduled_change_id: string; p_user_id: string }
        Returns: boolean
      }
      regenerate_share_token: {
        Args: { p_expires_in_hours?: number; p_family_id: string }
        Returns: {
          expires_at: string
          share_token: string
        }[]
      }
      update_user_status: {
        Args: {
          new_status: Database["public"]["Enums"]["user_status_type"]
          status_reason?: string
          target_user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      payment_event_type:
        | "view_packages"
        | "click_upgrade"
        | "select_package"
        | "initiate_payment"
        | "payment_success"
        | "payment_failed"
      user_status_type: "active" | "pending" | "suspended" | "inactive"
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
      payment_event_type: [
        "view_packages",
        "click_upgrade",
        "select_package",
        "initiate_payment",
        "payment_success",
        "payment_failed",
      ],
      user_status_type: ["active", "pending", "suspended", "inactive"],
    },
  },
} as const
