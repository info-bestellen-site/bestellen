export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      shops: {
        Row: {
          id: string
          created_at: string
          name: string
          slug: string
          owner_id: string
          subscription_tier: "starter" | "pro" | "max"
          is_open: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          slug: string
          owner_id: string
          subscription_tier?: "starter" | "pro" | "max"
          is_open?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          slug?: string
          owner_id?: string
          subscription_tier?: "starter" | "pro" | "max"
          is_open?: boolean
        }
      }
      categories: {
        Row: {
          id: string
          created_at: string
          shop_id: string
          name: string
          sort_order: number
        }
      }
      products: {
        Row: {
          id: string
          created_at: string
          shop_id: string
          category_id: string
          name: string
          description: string | null
          price: number
          image_url: string | null
          sort_order: number
          is_available: boolean
          is_hidden_from_menu: boolean
        }
      }
      orders: {
        Row: {
          id: string
          created_at: string
          shop_id: string
          customer_name: string
          customer_email: string | null
          customer_phone: string | null
          total: number
          status: string
          payment_status: string
          fulfillment_type: string
          order_number: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          product_name: string
          quantity: number
          unit_price: number
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      subscription_tier: "starter" | "pro" | "max"
    }
  }
}

export type Category = Database['public']['Tables']['categories']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type OrderItem = Database['public']['Tables']['order_items']['Row']
export type ModifierGroup = {
  id: string
  name: string
  is_required: boolean
  min_selections: number
  max_selections: number
}
export type ModifierOption = {
  id: string
  name: string
  price: number
}
export type ModifierGroupWithOptions = ModifierGroup & {
  modifier_options: ModifierOption[]
}
