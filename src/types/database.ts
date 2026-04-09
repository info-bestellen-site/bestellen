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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          shop_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          shop_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          shop_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "categories_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      opening_hours: {
        Row: {
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          shop_id: string
          start_time: string
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          shop_id: string
          start_time: string
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          shop_id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "opening_hours_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          quantity?: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_name: string
          customer_phone: string
          delivery_address: string | null
          delivery_fee: number
          estimated_ready_at: string | null
          fulfillment_type: string
          guest_count: number | null
          id: string
          is_internal: boolean | null
          notes: string | null
          order_number: number
          shop_id: string
          status: string
          subtotal: number
          table_id: string | null
          table_number: string | null
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_name: string
          customer_phone: string
          delivery_address?: string | null
          delivery_fee?: number
          estimated_ready_at?: string | null
          fulfillment_type?: string
          guest_count?: number | null
          id?: string
          is_internal?: boolean | null
          notes?: string | null
          order_number?: number
          shop_id: string
          status?: string
          subtotal: number
          table_id?: string | null
          table_number?: string | null
          total: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_name?: string
          customer_phone?: string
          delivery_address?: string | null
          delivery_fee?: number
          estimated_ready_at?: string | null
          fulfillment_type?: string
          guest_count?: number | null
          id?: string
          is_internal?: boolean | null
          notes?: string | null
          order_number?: number
          shop_id?: string
          status?: string
          subtotal?: number
          table_id?: string | null
          table_number?: string | null
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          allergens: string[] | null
          category_id: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_available: boolean
          name: string
          preparation_time_minutes: number | null
          price: number
          shop_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          allergens?: string[] | null
          category_id: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          name: string
          preparation_time_minutes?: number | null
          price: number
          shop_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          allergens?: string[] | null
          category_id?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          name?: string
          preparation_time_minutes?: number | null
          price?: number
          shop_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shops: {
        Row: {
          address: string | null
          auto_print_enabled: boolean | null
          base_language: string | null
          created_at: string
          delivery_fee: number
          has_delivery: boolean
          has_dine_in: boolean
          has_pickup: boolean
          has_reservation: boolean | null
          icon_name: string | null
          id: string
          is_open: boolean
          logo_url: string | null
          manual_status_updated_at: string | null
          min_order_amount: number
          name: string
          owner_id: string
          phone: string | null
          prep_lead_time_minutes: number
          print_mode: string | null
          slug: string
          stress_factor: number
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string
          subscription_tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          auto_print_enabled?: boolean | null
          base_language?: string | null
          created_at?: string
          delivery_fee?: number
          has_delivery?: boolean
          has_dine_in?: boolean
          has_pickup?: boolean
          has_reservation?: boolean | null
          icon_name?: string | null
          id?: string
          is_open?: boolean
          logo_url?: string | null
          manual_status_updated_at?: string | null
          min_order_amount?: number
          name: string
          owner_id: string
          phone?: string | null
          prep_lead_time_minutes?: number
          print_mode?: string | null
          slug: string
          stress_factor?: number
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          auto_print_enabled?: boolean | null
          base_language?: string | null
          created_at?: string
          delivery_fee?: number
          has_delivery?: boolean
          has_dine_in?: boolean
          has_pickup?: boolean
          has_reservation?: boolean | null
          icon_name?: string | null
          id?: string
          is_open?: boolean
          logo_url?: string | null
          manual_status_updated_at?: string | null
          min_order_amount?: number
          name?: string
          owner_id?: string
          phone?: string | null
          prep_lead_time_minutes?: number
          print_mode?: string | null
          slug?: string
          stress_factor?: number
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
        }
        Relationships: []
      }
      tables: {
        Row: {
          capacity: number
          created_at: string | null
          id: string
          name: string
          shop_id: string
        }
        Insert: {
          capacity?: number
          created_at?: string | null
          id?: string
          name: string
          shop_id: string
        }
        Update: {
          capacity?: number
          created_at?: string | null
          id?: string
          name?: string
          shop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tables_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_test_data: { Args: { p_shop_slug: string }; Returns: undefined }
    }
    Enums: {
      subscription_tier: "starter" | "pro" | "max"
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
      subscription_tier: ["starter", "pro", "max"],
    },
  },
} as const

export type Shop = Tables<'shops'>
export type Category = Tables<'categories'>
export type Product = Tables<'products'>
export type Order = Tables<'orders'>
export type OrderItem = Tables<'order_items'>
export type OpeningHour = Tables<'opening_hours'>
export type Table = Tables<'tables'>

export type OrderStatus = Order['status']
export type FulfillmentType = Order['fulfillment_type']
