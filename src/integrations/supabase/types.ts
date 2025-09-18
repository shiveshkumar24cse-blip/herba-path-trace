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
      batch_collections: {
        Row: {
          batch_id: string
          collection_event_id: string
          contribution_percentage: number
          created_at: string
          id: string
        }
        Insert: {
          batch_id: string
          collection_event_id: string
          contribution_percentage: number
          created_at?: string
          id?: string
        }
        Update: {
          batch_id?: string
          collection_event_id?: string
          contribution_percentage?: number
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "batch_collections_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batch_collections_collection_event_id_fkey"
            columns: ["collection_event_id"]
            isOneToOne: false
            referencedRelation: "collection_events"
            referencedColumns: ["id"]
          },
        ]
      }
      batches: {
        Row: {
          aggregator_id: string
          batch_id: string
          batch_status: string | null
          blockchain_hash: string | null
          created_at: string
          creation_timestamp: string
          herb_id: string
          id: string
          qr_code: string | null
          quality_notes: string | null
          storage_location: string | null
          total_quantity_kg: number
        }
        Insert: {
          aggregator_id: string
          batch_id: string
          batch_status?: string | null
          blockchain_hash?: string | null
          created_at?: string
          creation_timestamp?: string
          herb_id: string
          id?: string
          qr_code?: string | null
          quality_notes?: string | null
          storage_location?: string | null
          total_quantity_kg: number
        }
        Update: {
          aggregator_id?: string
          batch_id?: string
          batch_status?: string | null
          blockchain_hash?: string | null
          created_at?: string
          creation_timestamp?: string
          herb_id?: string
          id?: string
          qr_code?: string | null
          quality_notes?: string | null
          storage_location?: string | null
          total_quantity_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "batches_aggregator_id_fkey"
            columns: ["aggregator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batches_herb_id_fkey"
            columns: ["herb_id"]
            isOneToOne: false
            referencedRelation: "herbs"
            referencedColumns: ["id"]
          },
        ]
      }
      blockchain_records: {
        Row: {
          block_hash: string
          block_number: number
          created_at: string
          entity_id: string
          id: string
          merkle_root: string | null
          previous_hash: string | null
          timestamp: string
          transaction_data: Json
          transaction_type: string
        }
        Insert: {
          block_hash: string
          block_number: number
          created_at?: string
          entity_id: string
          id?: string
          merkle_root?: string | null
          previous_hash?: string | null
          timestamp?: string
          transaction_data: Json
          transaction_type: string
        }
        Update: {
          block_hash?: string
          block_number?: number
          created_at?: string
          entity_id?: string
          id?: string
          merkle_root?: string | null
          previous_hash?: string | null
          timestamp?: string
          transaction_data?: Json
          transaction_type?: string
        }
        Relationships: []
      }
      collection_events: {
        Row: {
          blockchain_hash: string | null
          collection_timestamp: string
          collector_id: string
          compliance_validated: boolean | null
          created_at: string
          environmental_data: Json | null
          harvest_season: string
          herb_id: string
          id: string
          initial_condition: string
          latitude: number
          longitude: number
          plant_part: string
          quantity_kg: number
          storage_conditions: Json | null
        }
        Insert: {
          blockchain_hash?: string | null
          collection_timestamp?: string
          collector_id: string
          compliance_validated?: boolean | null
          created_at?: string
          environmental_data?: Json | null
          harvest_season: string
          herb_id: string
          id?: string
          initial_condition: string
          latitude: number
          longitude: number
          plant_part: string
          quantity_kg: number
          storage_conditions?: Json | null
        }
        Update: {
          blockchain_hash?: string | null
          collection_timestamp?: string
          collector_id?: string
          compliance_validated?: boolean | null
          created_at?: string
          environmental_data?: Json | null
          harvest_season?: string
          herb_id?: string
          id?: string
          initial_condition?: string
          latitude?: number
          longitude?: number
          plant_part?: string
          quantity_kg?: number
          storage_conditions?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "collection_events_collector_id_fkey"
            columns: ["collector_id"]
            isOneToOne: false
            referencedRelation: "collectors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_events_herb_id_fkey"
            columns: ["herb_id"]
            isOneToOne: false
            referencedRelation: "herbs"
            referencedColumns: ["id"]
          },
        ]
      }
      collectors: {
        Row: {
          aadhaar_id: string | null
          collector_type: string
          contact_details: Json | null
          cooperative_id: string | null
          created_at: string
          id: string
          profile_id: string
          verification_status: string | null
        }
        Insert: {
          aadhaar_id?: string | null
          collector_type: string
          contact_details?: Json | null
          cooperative_id?: string | null
          created_at?: string
          id?: string
          profile_id: string
          verification_status?: string | null
        }
        Update: {
          aadhaar_id?: string | null
          collector_type?: string
          contact_details?: Json | null
          cooperative_id?: string | null
          created_at?: string
          id?: string
          profile_id?: string
          verification_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collectors_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_rules: {
        Row: {
          created_at: string
          herb_id: string
          id: string
          is_active: boolean | null
          rule_parameters: Json
          rule_type: string
        }
        Insert: {
          created_at?: string
          herb_id: string
          id?: string
          is_active?: boolean | null
          rule_parameters: Json
          rule_type: string
        }
        Update: {
          created_at?: string
          herb_id?: string
          id?: string
          is_active?: boolean | null
          rule_parameters?: Json
          rule_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_rules_herb_id_fkey"
            columns: ["herb_id"]
            isOneToOne: false
            referencedRelation: "herbs"
            referencedColumns: ["id"]
          },
        ]
      }
      handoffs: {
        Row: {
          blockchain_hash: string | null
          chain_of_custody: Json
          conditions: Json | null
          created_at: string
          from_entity_id: string
          handoff_timestamp: string
          handoff_type: string
          id: string
          item_id: string
          item_type: string
          quantity: number | null
          to_entity_id: string
        }
        Insert: {
          blockchain_hash?: string | null
          chain_of_custody: Json
          conditions?: Json | null
          created_at?: string
          from_entity_id: string
          handoff_timestamp?: string
          handoff_type: string
          id?: string
          item_id: string
          item_type: string
          quantity?: number | null
          to_entity_id: string
        }
        Update: {
          blockchain_hash?: string | null
          chain_of_custody?: Json
          conditions?: Json | null
          created_at?: string
          from_entity_id?: string
          handoff_timestamp?: string
          handoff_type?: string
          id?: string
          item_id?: string
          item_type?: string
          quantity?: number | null
          to_entity_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "handoffs_from_entity_id_fkey"
            columns: ["from_entity_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handoffs_to_entity_id_fkey"
            columns: ["to_entity_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      herbs: {
        Row: {
          approved_regions: string[] | null
          botanical_name: string
          conservation_status: string | null
          created_at: string
          harvest_season: string[] | null
          id: string
          local_name: string
          medicinal_properties: string[] | null
          plant_family: string | null
          quality_parameters: Json | null
        }
        Insert: {
          approved_regions?: string[] | null
          botanical_name: string
          conservation_status?: string | null
          created_at?: string
          harvest_season?: string[] | null
          id?: string
          local_name: string
          medicinal_properties?: string[] | null
          plant_family?: string | null
          quality_parameters?: Json | null
        }
        Update: {
          approved_regions?: string[] | null
          botanical_name?: string
          conservation_status?: string | null
          created_at?: string
          harvest_season?: string[] | null
          id?: string
          local_name?: string
          medicinal_properties?: string[] | null
          plant_family?: string | null
          quality_parameters?: Json | null
        }
        Relationships: []
      }
      processing_steps: {
        Row: {
          batch_id: string
          blockchain_hash: string | null
          completion_date: string | null
          created_at: string
          id: string
          input_quantity_kg: number
          output_quantity_kg: number | null
          process_conditions: Json | null
          process_date: string
          process_parameters: Json
          process_type: string
          processor_id: string
          quality_metrics: Json | null
        }
        Insert: {
          batch_id: string
          blockchain_hash?: string | null
          completion_date?: string | null
          created_at?: string
          id?: string
          input_quantity_kg: number
          output_quantity_kg?: number | null
          process_conditions?: Json | null
          process_date?: string
          process_parameters: Json
          process_type: string
          processor_id: string
          quality_metrics?: Json | null
        }
        Update: {
          batch_id?: string
          blockchain_hash?: string | null
          completion_date?: string | null
          created_at?: string
          id?: string
          input_quantity_kg?: number
          output_quantity_kg?: number | null
          process_conditions?: Json | null
          process_date?: string
          process_parameters?: Json
          process_type?: string
          processor_id?: string
          quality_metrics?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "processing_steps_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processing_steps_processor_id_fkey"
            columns: ["processor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          batch_ids: string[]
          blockchain_hash: string | null
          created_at: string
          expiry_date: string | null
          final_quantity: number
          formulation_details: Json
          id: string
          manufacturer_id: string
          manufacturing_date: string
          product_name: string
          product_type: string
          qr_code: string
          regulatory_approvals: Json | null
          unit_type: string
        }
        Insert: {
          batch_ids: string[]
          blockchain_hash?: string | null
          created_at?: string
          expiry_date?: string | null
          final_quantity: number
          formulation_details: Json
          id?: string
          manufacturer_id: string
          manufacturing_date?: string
          product_name: string
          product_type: string
          qr_code: string
          regulatory_approvals?: Json | null
          unit_type: string
        }
        Update: {
          batch_ids?: string[]
          blockchain_hash?: string | null
          created_at?: string
          expiry_date?: string | null
          final_quantity?: number
          formulation_details?: Json
          id?: string
          manufacturer_id?: string
          manufacturing_date?: string
          product_name?: string
          product_type?: string
          qr_code?: string
          regulatory_approvals?: Json | null
          unit_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_manufacturer_id_fkey"
            columns: ["manufacturer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          aadhaar_id: string | null
          cooperative_group: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          location: string | null
          organization: string | null
          phone: string | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          aadhaar_id?: string | null
          cooperative_group?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          location?: string | null
          organization?: string | null
          phone?: string | null
          role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          aadhaar_id?: string | null
          cooperative_group?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          location?: string | null
          organization?: string | null
          phone?: string | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quality_tests: {
        Row: {
          batch_id: string
          blockchain_hash: string | null
          certificate_url: string | null
          completion_date: string | null
          created_at: string
          id: string
          lab_id: string
          sample_id: string
          test_date: string
          test_parameters: Json
          test_results: Json
          test_status: string | null
          test_type: string
        }
        Insert: {
          batch_id: string
          blockchain_hash?: string | null
          certificate_url?: string | null
          completion_date?: string | null
          created_at?: string
          id?: string
          lab_id: string
          sample_id: string
          test_date?: string
          test_parameters: Json
          test_results: Json
          test_status?: string | null
          test_type: string
        }
        Update: {
          batch_id?: string
          blockchain_hash?: string | null
          certificate_url?: string | null
          completion_date?: string | null
          created_at?: string
          id?: string
          lab_id?: string
          sample_id?: string
          test_date?: string
          test_parameters?: Json
          test_results?: Json
          test_status?: string | null
          test_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "quality_tests_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quality_tests_lab_id_fkey"
            columns: ["lab_id"]
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
      [_ in never]: never
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
