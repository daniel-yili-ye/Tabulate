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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      item_shares: {
        Row: {
          item_id: string
          participant_id: string
          tab_id: string
          weight: number
        }
        Insert: {
          item_id: string
          participant_id: string
          tab_id: string
          weight?: number
        }
        Update: {
          item_id?: string
          participant_id?: string
          tab_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "item_shares_item_id_tab_id_fkey"
            columns: ["item_id", "tab_id"]
            isOneToOne: false
            referencedRelation: "tab_items"
            referencedColumns: ["id", "tab_id"]
          },
          {
            foreignKeyName: "item_shares_participant_id_tab_id_fkey"
            columns: ["participant_id", "tab_id"]
            isOneToOne: false
            referencedRelation: "tab_participants"
            referencedColumns: ["id", "tab_id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          id: string
          payment_message: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string
          id: string
          payment_message?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          payment_message?: string
          updated_at?: string
        }
        Relationships: []
      }
      receipt_scans: {
        Row: {
          created_at: string
          id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: never
          user_id: string
        }
        Update: {
          created_at?: string
          id?: never
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipt_scans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tab_items: {
        Row: {
          id: string
          name: string
          position: number
          price_cents: number
          split_type: Database["public"]["Enums"]["split_type"]
          tab_id: string
        }
        Insert: {
          id?: string
          name?: string
          position: number
          price_cents: number
          split_type?: Database["public"]["Enums"]["split_type"]
          tab_id: string
        }
        Update: {
          id?: string
          name?: string
          position?: number
          price_cents?: number
          split_type?: Database["public"]["Enums"]["split_type"]
          tab_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tab_items_tab_id_fkey"
            columns: ["tab_id"]
            isOneToOne: false
            referencedRelation: "tabs"
            referencedColumns: ["id"]
          },
        ]
      }
      tab_participants: {
        Row: {
          id: string
          name: string
          position: number
          tab_id: string
        }
        Insert: {
          id?: string
          name: string
          position: number
          tab_id: string
        }
        Update: {
          id?: string
          name?: string
          position?: number
          tab_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tab_participants_tab_id_fkey"
            columns: ["tab_id"]
            isOneToOne: false
            referencedRelation: "tabs"
            referencedColumns: ["id"]
          },
        ]
      }
      tabs: {
        Row: {
          business_name: string
          created_at: string
          discount_cents: number
          id: string
          owner_id: string
          payment_message: string
          receipt_date: string
          receipt_image_path: string | null
          slug: string
          tax_cents: number
          tip_cents: number
          updated_at: string
        }
        Insert: {
          business_name: string
          created_at?: string
          discount_cents?: number
          id?: string
          owner_id?: string
          payment_message?: string
          receipt_date: string
          receipt_image_path?: string | null
          slug: string
          tax_cents?: number
          tip_cents?: number
          updated_at?: string
        }
        Update: {
          business_name?: string
          created_at?: string
          discount_cents?: number
          id?: string
          owner_id?: string
          payment_message?: string
          receipt_date?: string
          receipt_image_path?: string | null
          slug?: string
          tax_cents?: number
          tip_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tabs_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_receipt_scan: { Args: never; Returns: boolean }
      get_shared_tab: { Args: { p_slug: string }; Returns: Json }
      owns_tab: { Args: { p_tab_id: string }; Returns: boolean }
      save_tab: {
        Args: { p_create: boolean; p_slug: string; p_tab: Json }
        Returns: string
      }
    }
    Enums: {
      split_type: "equal" | "shares" | "percentage" | "custom"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      split_type: ["equal", "shares", "percentage", "custom"],
    },
  },
} as const
