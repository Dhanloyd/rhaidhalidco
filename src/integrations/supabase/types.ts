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
      addresses: {
        Row: {
          address_line: string
          city: string
          created_at: string
          full_name: string
          id: string
          is_default: boolean
          label: string
          phone: string
          province: string | null
          updated_at: string
          user_id: string
          zip_code: string | null
        }
        Insert: {
          address_line: string
          city: string
          created_at?: string
          full_name: string
          id?: string
          is_default?: boolean
          label?: string
          phone: string
          province?: string | null
          updated_at?: string
          user_id: string
          zip_code?: string | null
        }
        Update: {
          address_line?: string
          city?: string
          created_at?: string
          full_name?: string
          id?: string
          is_default?: boolean
          label?: string
          phone?: string
          province?: string | null
          updated_at?: string
          user_id?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          updated_at: string
          user_id: string
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          updated_at?: string
          user_id: string
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          updated_at?: string
          user_id?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          active: boolean
          created_at: string
          display_order: number
          icon: string | null
          id: string
          image_url: string | null
          name: string
          parent_id: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          display_order?: number
          icon?: string | null
          id?: string
          image_url?: string | null
          name: string
          parent_id?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          display_order?: number
          icon?: string | null
          id?: string
          image_url?: string | null
          name?: string
          parent_id?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      flash_sales: {
        Row: {
          active: boolean
          created_at: string
          end_date: string
          id: string
          original_price: number
          product_id: string
          sale_price: number
          sold_count: number
          start_date: string
          stock_limit: number | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          end_date: string
          id?: string
          original_price: number
          product_id: string
          sale_price: number
          sold_count?: number
          start_date: string
          stock_limit?: number | null
        }
        Update: {
          active?: boolean
          created_at?: string
          end_date?: string
          id?: string
          original_price?: number
          product_id?: string
          sale_price?: number
          sold_count?: number
          start_date?: string
          stock_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "flash_sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      highlights: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          display_order: number
          id: string
          image_url: string | null
          link_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          link_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          link_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventory_logs: {
        Row: {
          change_type: string
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          product_id: string
          quantity_after: number
          quantity_before: number
          quantity_change: number
          variant_id: string | null
        }
        Insert: {
          change_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          product_id: string
          quantity_after?: number
          quantity_before?: number
          quantity_change?: number
          variant_id?: string | null
        }
        Update: {
          change_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          product_id?: string
          quantity_after?: number
          quantity_before?: number
          quantity_change?: number
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_logs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_logs_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      news: {
        Row: {
          content: string | null
          created_at: string
          excerpt: string | null
          id: string
          image_url: string | null
          published: boolean
          title: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          published?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          published?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          discount: number
          id: string
          order_id: string
          product_id: string
          product_name: string
          quantity: number
          total: number
          unit_price: number
          variant_id: string | null
          variant_info: string | null
        }
        Insert: {
          created_at?: string
          discount?: number
          id?: string
          order_id: string
          product_id: string
          product_name: string
          quantity?: number
          total?: number
          unit_price?: number
          variant_id?: string | null
          variant_info?: string | null
        }
        Update: {
          created_at?: string
          discount?: number
          id?: string
          order_id?: string
          product_id?: string
          product_name?: string
          quantity?: number
          total?: number
          unit_price?: number
          variant_id?: string | null
          variant_info?: string | null
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
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_email: string | null
          customer_name: string
          discount: number
          id: string
          items: Json
          notes: string | null
          order_type: string
          payment_method: string
          shipping_address: string | null
          shipping_fee: number
          shipping_name: string | null
          shipping_phone: string | null
          status: string
          subtotal: number
          tax: number
          total: number
          tracking_number: string | null
          updated_at: string
          user_id: string | null
          voucher_id: string | null
        }
        Insert: {
          created_at?: string
          customer_email?: string | null
          customer_name: string
          discount?: number
          id?: string
          items?: Json
          notes?: string | null
          order_type?: string
          payment_method?: string
          shipping_address?: string | null
          shipping_fee?: number
          shipping_name?: string | null
          shipping_phone?: string | null
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          tracking_number?: string | null
          updated_at?: string
          user_id?: string | null
          voucher_id?: string | null
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          discount?: number
          id?: string
          items?: Json
          notes?: string | null
          order_type?: string
          payment_method?: string
          shipping_address?: string | null
          shipping_fee?: number
          shipping_name?: string | null
          shipping_phone?: string | null
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          tracking_number?: string | null
          updated_at?: string
          user_id?: string | null
          voucher_id?: string | null
        }
        Relationships: []
      }
      pos_transactions: {
        Row: {
          cash_received: number
          cashier_id: string
          change_amount: number
          created_at: string
          customer_name: string | null
          discount: number
          id: string
          items: Json
          notes: string | null
          payment_method: string
          receipt_number: string
          subtotal: number
          tax: number
          total: number
        }
        Insert: {
          cash_received?: number
          cashier_id: string
          change_amount?: number
          created_at?: string
          customer_name?: string | null
          discount?: number
          id?: string
          items?: Json
          notes?: string | null
          payment_method?: string
          receipt_number: string
          subtotal?: number
          tax?: number
          total?: number
        }
        Update: {
          cash_received?: number
          cashier_id?: string
          change_amount?: number
          created_at?: string
          customer_name?: string | null
          discount?: number
          id?: string
          items?: Json
          notes?: string | null
          payment_method?: string
          receipt_number?: string
          subtotal?: number
          tax?: number
          total?: number
        }
        Relationships: []
      }
      product_variants: {
        Row: {
          active: boolean
          barcode: string | null
          created_at: string
          id: string
          image_url: string | null
          price: number | null
          product_id: string
          sku: string | null
          stock: number
          updated_at: string
          variant_name: string
          variant_value: string
        }
        Insert: {
          active?: boolean
          barcode?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          price?: number | null
          product_id: string
          sku?: string | null
          stock?: number
          updated_at?: string
          variant_name: string
          variant_value: string
        }
        Update: {
          active?: boolean
          barcode?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          price?: number | null
          product_id?: string
          sku?: string | null
          stock?: number
          updated_at?: string
          variant_name?: string
          variant_value?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          badge: string | null
          barcode: string | null
          brand: string | null
          category: string
          category_id: string | null
          cost_price: number
          created_at: string
          description: string | null
          discount_price: number | null
          id: string
          image_url: string | null
          in_stock: boolean
          low_stock_threshold: number
          name: string
          price: number
          sku: string | null
          sold_count: number
          status: string
          stock_quantity: number
          supplier_id: string | null
          updated_at: string
        }
        Insert: {
          badge?: string | null
          barcode?: string | null
          brand?: string | null
          category?: string
          category_id?: string | null
          cost_price?: number
          created_at?: string
          description?: string | null
          discount_price?: number | null
          id?: string
          image_url?: string | null
          in_stock?: boolean
          low_stock_threshold?: number
          name: string
          price?: number
          sku?: string | null
          sold_count?: number
          status?: string
          stock_quantity?: number
          supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          badge?: string | null
          barcode?: string | null
          brand?: string | null
          category?: string
          category_id?: string | null
          cost_price?: number
          created_at?: string
          description?: string | null
          discount_price?: number | null
          id?: string
          image_url?: string | null
          in_stock?: boolean
          low_stock_threshold?: number
          name?: string
          price?: number
          sku?: string | null
          sold_count?: number
          status?: string
          stock_quantity?: number
          supplier_id?: string | null
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
            foreignKeyName: "products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          images: Json | null
          order_id: string | null
          product_id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          images?: Json | null
          order_id?: string | null
          product_id: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          images?: Json | null
          order_id?: string | null
          product_id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          active: boolean
          address: string | null
          contact_name: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          address?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          address?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vouchers: {
        Row: {
          active: boolean
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          expiry_date: string | null
          id: string
          max_uses: number | null
          min_spend: number
          updated_at: string
          used_count: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          expiry_date?: string | null
          id?: string
          max_uses?: number | null
          min_spend?: number
          updated_at?: string
          used_count?: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          expiry_date?: string | null
          id?: string
          max_uses?: number | null
          min_spend?: number
          updated_at?: string
          used_count?: number
        }
        Relationships: []
      }
      wishlist: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
