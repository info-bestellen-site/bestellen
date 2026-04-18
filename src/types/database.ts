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
          manual_status_updated_at: string | null
          has_pickup: boolean
          has_delivery: boolean
          has_dine_in: boolean
          delivery_fee: number
          min_order_amount: number
          phone: string | null
          delivery_zip_codes: string[] | null
          paypal_enabled: boolean
          paypal_merchant_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          slug: string
          owner_id: string
          subscription_tier?: "starter" | "pro" | "max"
          is_open?: boolean
          manual_status_updated_at?: string | null
          has_pickup?: boolean
          has_delivery?: boolean
          has_dine_in?: boolean
          delivery_fee?: number
          min_order_amount?: number
          phone?: string | null
          delivery_zip_codes?: string[] | null
          paypal_enabled?: boolean
          paypal_merchant_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          slug?: string
          owner_id?: string
          subscription_tier?: "starter" | "pro" | "max"
          is_open?: boolean
          manual_status_updated_at?: string | null
          has_pickup?: boolean
          has_delivery?: boolean
          has_dine_in?: boolean
          delivery_fee?: number
          min_order_amount?: number
          phone?: string | null
          delivery_zip_codes?: string[] | null
          paypal_enabled?: boolean
          paypal_merchant_id?: string | null
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
        Insert: {
          id?: string
          created_at?: string
          shop_id: string
          name: string
          sort_order?: number
        }
        Update: {
          id?: string
          created_at?: string
          shop_id?: string
          name?: string
          sort_order?: number
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
        Insert: {
          id?: string
          created_at?: string
          shop_id: string
          category_id: string
          name: string
          description?: string | null
          price: number
          image_url?: string | null
          sort_order?: number
          is_available?: boolean
          is_hidden_from_menu?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          shop_id?: string
          category_id?: string
          name?: string
          description?: string | null
          price?: number
          image_url?: string | null
          sort_order?: number
          is_available?: boolean
          is_hidden_from_menu?: boolean
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
          delivery_address: string | null
          notes: string | null
          estimated_ready_at: string | null
          guest_count: number | null
          payment_method: string | null
          subtotal: number | null
          delivery_fee: number | null
          table_number: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          shop_id: string
          customer_name: string
          customer_email?: string | null
          customer_phone?: string | null
          total: number
          status?: string
          payment_status?: string
          fulfillment_type: string
          order_number?: string
          delivery_address?: string | null
          notes?: string | null
          estimated_ready_at?: string | null
          guest_count?: number | null
          payment_method?: string | null
          subtotal?: number | null
          delivery_fee?: number | null
          table_number?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          shop_id?: string
          customer_name?: string
          customer_email?: string | null
          customer_phone?: string | null
          total?: number
          status?: string
          payment_status?: string
          fulfillment_type?: string
          order_number?: string
          delivery_address?: string | null
          notes?: string | null
          estimated_ready_at?: string | null
          guest_count?: number | null
          payment_method?: string | null
          subtotal?: number | null
          delivery_fee?: number | null
          table_number?: string | null
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
        Insert: {
          id?: string
          order_id: string
          product_id: string
          product_name: string
          quantity: number
          unit_price: number
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          product_name?: string
          quantity?: number
          unit_price?: number
        }
      }
      opening_hours: {
        Row: {
          id: string
          shop_id: string
          day_of_week: number
          start_time: string
          end_time: string
        }
        Insert: {
          id?: string
          shop_id: string
          day_of_week: number
          start_time: string
          end_time: string
        }
        Update: {
          id?: string
          shop_id?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
        }
      }
      tables: {
        Row: {
          id: string
          shop_id: string
          name: string
          capacity: number
        }
        Insert: {
          id?: string
          shop_id: string
          name: string
          capacity: number
        }
        Update: {
          id?: string
          shop_id?: string
          name?: string
          capacity?: number
        }
      }
      modifier_groups: {
        Row: {
          id: string
          shop_id: string
          product_id: string
          name: string
          is_required: boolean
          min_selections: number
          max_selections: number
          sort_order: number
        }
        Insert: {
          id?: string
          shop_id: string
          product_id: string
          name: string
          is_required?: boolean
          min_selections?: number
          max_selections?: number
          sort_order?: number
        }
        Update: {
          id?: string
          shop_id?: string
          product_id?: string
          name?: string
          is_required?: boolean
          min_selections?: number
          max_selections?: number
          sort_order?: number
        }
      }
      modifier_options: {
        Row: {
          id: string
          group_id: string
          name: string
          price_delta: number
          sort_order: number
          is_default: boolean
        }
        Insert: {
          id?: string
          group_id: string
          name: string
          price_delta?: number
          sort_order?: number
          is_default?: boolean
        }
        Update: {
          id?: string
          group_id?: string
          name?: string
          price_delta?: number
          sort_order?: number
          is_default?: boolean
        }
      }
      upsell_rules: {
        Row: {
          id: string
          shop_id: string
          trigger_product_id: string | null
          upsell_product_id: string
          bundle_price: number | null
          sort_order: number
          is_active: boolean
        }
        Insert: {
          id?: string
          shop_id: string
          trigger_product_id?: string | null
          upsell_product_id: string
          bundle_price?: number | null
          sort_order?: number
          is_active?: boolean
        }
        Update: {
          id?: string
          shop_id?: string
          trigger_product_id?: string | null
          upsell_product_id?: string
          bundle_price?: number | null
          sort_order?: number
          is_active?: boolean
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

export type Shop = Database['public']['Tables']['shops']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type OrderItem = Database['public']['Tables']['order_items']['Row']
export type OpeningHour = Database['public']['Tables']['opening_hours']['Row']
export type Table = Database['public']['Tables']['tables']['Row']
export type ModifierGroup = Database['public']['Tables']['modifier_groups']['Row']
export type ModifierOption = Database['public']['Tables']['modifier_options']['Row']
export type UpsellRule = Database['public']['Tables']['upsell_rules']['Row']

export type ModifierGroupWithOptions = ModifierGroup & {
  modifier_options: ModifierOption[]
}

export type UpsellRuleWithProduct = UpsellRule & {
  upsell_product: Product
}

export type SubscriptionTier = 'starter' | 'pro' | 'max'
export type FulfillmentType = 'pickup' | 'delivery' | 'dine_in'
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled'
