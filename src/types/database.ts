export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
          notes: string | null
          order_number: number
          shop_id: string
          status: string
          subtotal: number
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
          notes?: string | null
          order_number?: number
          shop_id: string
          status?: string
          subtotal: number
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
          notes?: string | null
          order_number?: number
          shop_id?: string
          status?: string
          subtotal?: number
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
        ]
      }
      opening_hours: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          shop_id: string
          start_time: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          shop_id: string
          start_time: string
        }
        Update: {
          created_at?: string
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
          }
        ]
      }
      tables: {
        Row: {
          capacity: number
          created_at: string
          id: string
          shop_id: string
          table_number: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          id?: string
          shop_id: string
          table_number: string
        }
        Update: {
          capacity?: number
          created_at?: string
          id?: string
          shop_id?: string
          table_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "tables_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          }
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
          created_at: string
          delivery_fee: number
          has_delivery: boolean
          has_dine_in: boolean
          has_pickup: boolean
          has_reservation: boolean
          icon_name: string | null
          id: string
          is_open: boolean
          logo_url: string | null
          min_order_amount: number
          name: string
          owner_id: string
          phone: string | null
          prep_lead_time_minutes: number
          slug: string
          stress_factor: number
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          delivery_fee?: number
          has_delivery?: boolean
          has_dine_in?: boolean
          has_pickup?: boolean
          has_reservation?: boolean
          icon_name?: string | null
          id?: string
          is_open?: boolean
          logo_url?: string | null
          min_order_amount?: number
          name: string
          owner_id: string
          phone?: string | null
          prep_lead_time_minutes?: number
          slug: string
          stress_factor?: number
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          delivery_fee?: number
          has_delivery?: boolean
          has_dine_in?: boolean
          has_pickup?: boolean
          has_reservation?: boolean
          icon_name?: string | null
          id?: string
          is_open?: boolean
          logo_url?: string | null
          min_order_amount?: number
          name?: string
          owner_id?: string
          phone?: string | null
          prep_lead_time_minutes?: number
          slug?: string
          stress_factor?: number
          updated_at?: string
        }
        Relationships: []
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

// Convenience types
export type Shop = Database['public']['Tables']['shops']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type OrderItem = Database['public']['Tables']['order_items']['Row']
export type OpeningHour = Database['public']['Tables']['opening_hours']['Row']
export type Table = Database['public']['Tables']['tables']['Row']

export type OrderInsert = Database['public']['Tables']['orders']['Insert']
export type OrderItemInsert = Database['public']['Tables']['order_items']['Insert']
export type ShopInsert = Database['public']['Tables']['shops']['Insert']
export type ProductInsert = Database['public']['Tables']['products']['Insert']
export type CategoryInsert = Database['public']['Tables']['categories']['Insert']

export type FulfillmentType = 'pickup' | 'delivery' | 'dine_in'
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled'
