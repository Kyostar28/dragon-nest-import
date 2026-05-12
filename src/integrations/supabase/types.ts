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
      battle_sessions: {
        Row: {
          created_at: string
          current_mob_index: number
          dragon_id: string
          id: string
          mob_sequence: Json
          stage_id: number
          state: Json
          status: string
          turn: string
          turn_started_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_mob_index?: number
          dragon_id: string
          id?: string
          mob_sequence: Json
          stage_id: number
          state?: Json
          status?: string
          turn?: string
          turn_started_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_mob_index?: number
          dragon_id?: string
          id?: string
          mob_sequence?: Json
          stage_id?: number
          state?: Json
          status?: string
          turn?: string
          turn_started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "battle_sessions_dragon_id_fkey"
            columns: ["dragon_id"]
            isOneToOne: false
            referencedRelation: "user_dragons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battle_sessions_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "world_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      dragon_spells: {
        Row: {
          ap_cost: number
          damage: number
          description: string | null
          element: Database["public"]["Enums"]["dragon_element"]
          icon: string | null
          id: number
          min_level: number
          name: string
        }
        Insert: {
          ap_cost: number
          damage: number
          description?: string | null
          element: Database["public"]["Enums"]["dragon_element"]
          icon?: string | null
          id?: number
          min_level?: number
          name: string
        }
        Update: {
          ap_cost?: number
          damage?: number
          description?: string | null
          element?: Database["public"]["Enums"]["dragon_element"]
          icon?: string | null
          id?: number
          min_level?: number
          name?: string
        }
        Relationships: []
      }
      dragons_catalog: {
        Row: {
          base_ap: number
          base_crit: number
          base_defense: number
          base_hp: number
          description: string | null
          element: Database["public"]["Enums"]["dragon_element"]
          id: number
          interval_seconds: number
          name: string
          points_per_egg: number
          slug: string
        }
        Insert: {
          base_ap?: number
          base_crit?: number
          base_defense?: number
          base_hp?: number
          description?: string | null
          element?: Database["public"]["Enums"]["dragon_element"]
          id: number
          interval_seconds: number
          name: string
          points_per_egg: number
          slug: string
        }
        Update: {
          base_ap?: number
          base_crit?: number
          base_defense?: number
          base_hp?: number
          description?: string | null
          element?: Database["public"]["Enums"]["dragon_element"]
          id?: number
          interval_seconds?: number
          name?: string
          points_per_egg?: number
          slug?: string
        }
        Relationships: []
      }
      mobs: {
        Row: {
          ap: number
          attack: number
          crit: number
          defense: number
          element: Database["public"]["Enums"]["dragon_element"]
          hp: number
          icon: string | null
          id: number
          is_boss: boolean
          level: number
          name: string
          slug: string
        }
        Insert: {
          ap?: number
          attack: number
          crit?: number
          defense: number
          element?: Database["public"]["Enums"]["dragon_element"]
          hp: number
          icon?: string | null
          id?: number
          is_boss?: boolean
          level?: number
          name: string
          slug: string
        }
        Update: {
          ap?: number
          attack?: number
          crit?: number
          defense?: number
          element?: Database["public"]["Enums"]["dragon_element"]
          hp?: number
          icon?: string | null
          id?: number
          is_boss?: boolean
          level?: number
          name?: string
          slug?: string
        }
        Relationships: []
      }
      pool_contributions: {
        Row: {
          draco_points: number
          id: number
          pool_id: number
          user_id: string
        }
        Insert: {
          draco_points?: number
          id?: number
          pool_id: number
          user_id: string
        }
        Update: {
          draco_points?: number
          id?: number
          pool_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pool_contributions_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "reward_pools"
            referencedColumns: ["id"]
          },
        ]
      }
      pool_rewards: {
        Row: {
          created_at: string
          draco_points: number
          etc_amount: number
          id: number
          pool_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          draco_points?: number
          etc_amount?: number
          id?: number
          pool_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          draco_points?: number
          etc_amount?: number
          id?: number
          pool_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pool_rewards_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "reward_pools"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          draco_points_pool: number
          draco_points_total: number
          etc_balance: number
          id: string
          wallet_address: string
        }
        Insert: {
          created_at?: string
          draco_points_pool?: number
          draco_points_total?: number
          etc_balance?: number
          id: string
          wallet_address: string
        }
        Update: {
          created_at?: string
          draco_points_pool?: number
          draco_points_total?: number
          etc_balance?: number
          id?: string
          wallet_address?: string
        }
        Relationships: []
      }
      reward_pools: {
        Row: {
          closed_at: string | null
          id: number
          is_open: boolean
          period_end: string
          period_start: string
          total_etc: number
          total_points: number
        }
        Insert: {
          closed_at?: string | null
          id?: number
          is_open?: boolean
          period_end: string
          period_start?: string
          total_etc?: number
          total_points?: number
        }
        Update: {
          closed_at?: string | null
          id?: number
          is_open?: boolean
          period_end?: string
          period_start?: string
          total_etc?: number
          total_points?: number
        }
        Relationships: []
      }
      user_dragons: {
        Row: {
          catalog_id: number
          created_at: string
          current_hp: number | null
          egg_ready: boolean
          farming_started_at: string | null
          id: string
          level: number
          placed_in_nest: string | null
          rarity: Database["public"]["Enums"]["rarity"]
          user_id: string
          xp: number
        }
        Insert: {
          catalog_id: number
          created_at?: string
          current_hp?: number | null
          egg_ready?: boolean
          farming_started_at?: string | null
          id?: string
          level?: number
          placed_in_nest?: string | null
          rarity?: Database["public"]["Enums"]["rarity"]
          user_id: string
          xp?: number
        }
        Update: {
          catalog_id?: number
          created_at?: string
          current_hp?: number | null
          egg_ready?: boolean
          farming_started_at?: string | null
          id?: string
          level?: number
          placed_in_nest?: string | null
          rarity?: Database["public"]["Enums"]["rarity"]
          user_id?: string
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_dragons_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "dragons_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      user_eggs: {
        Row: {
          catalog_id: number
          created_at: string
          id: string
          rarity: Database["public"]["Enums"]["rarity"]
          user_id: string
        }
        Insert: {
          catalog_id: number
          created_at?: string
          id?: string
          rarity?: Database["public"]["Enums"]["rarity"]
          user_id: string
        }
        Update: {
          catalog_id?: number
          created_at?: string
          id?: string
          rarity?: Database["public"]["Enums"]["rarity"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_eggs_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "dragons_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      user_nests: {
        Row: {
          created_at: string
          id: string
          rarity: Database["public"]["Enums"]["rarity"]
          slot_index: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          rarity?: Database["public"]["Enums"]["rarity"]
          slot_index?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          rarity?: Database["public"]["Enums"]["rarity"]
          slot_index?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          max_stage_unlocked: number
          user_id: string
          zone_id: number
        }
        Insert: {
          max_stage_unlocked?: number
          user_id: string
          zone_id: number
        }
        Update: {
          max_stage_unlocked?: number
          user_id?: string
          zone_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "world_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      user_slots: {
        Row: {
          slot_index: number
          unlocked_at: string
          user_id: string
        }
        Insert: {
          slot_index: number
          unlocked_at?: string
          user_id: string
        }
        Update: {
          slot_index?: number
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      world_stages: {
        Row: {
          boss_mob_id: number | null
          has_boss: boolean
          id: number
          mob_pool: Json
          stage_number: number
          zone_id: number
        }
        Insert: {
          boss_mob_id?: number | null
          has_boss?: boolean
          id?: number
          mob_pool?: Json
          stage_number: number
          zone_id: number
        }
        Update: {
          boss_mob_id?: number | null
          has_boss?: boolean
          id?: number
          mob_pool?: Json
          stage_number?: number
          zone_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "world_stages_boss_mob_id_fkey"
            columns: ["boss_mob_id"]
            isOneToOne: false
            referencedRelation: "mobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_stages_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "world_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      world_zones: {
        Row: {
          description: string | null
          id: number
          kind: string
          name: string
          slug: string
        }
        Insert: {
          description?: string | null
          id?: number
          kind: string
          name: string
          slug: string
        }
        Update: {
          description?: string | null
          id?: number
          kind?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      breed_dragons: { Args: { d1: string; d2: string }; Returns: string }
      breed_nests: { Args: { n1: string; n2: string }; Returns: string }
      get_active_pool: { Args: never; Returns: number }
      next_rarity: {
        Args: { _r: Database["public"]["Enums"]["rarity"] }
        Returns: Database["public"]["Enums"]["rarity"]
      }
    }
    Enums: {
      dragon_element:
        | "fire"
        | "water"
        | "earth"
        | "air"
        | "light"
        | "dark"
        | "nature"
        | "arcane"
        | "ice"
        | "thunder"
      rarity: "common" | "uncommon" | "rare" | "epic" | "legendary"
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
      dragon_element: [
        "fire",
        "water",
        "earth",
        "air",
        "light",
        "dark",
        "nature",
        "arcane",
        "ice",
        "thunder",
      ],
      rarity: ["common", "uncommon", "rare", "epic", "legendary"],
    },
  },
} as const
