export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'admin' | 'contractor'
export type SessionStatus = 'draft' | 'submitted' | 'approved'
export type InvoiceStatus = 'pending' | 'sent' | 'paid'
export type PaymentMethod = 'private_pay' | 'self_directed' | 'group_home' | 'scholarship'
export type GoalStatus = 'active' | 'met' | 'not_met'
export type LocationType = 'in_home' | 'matts_music' | 'other'
export type ServiceCategory = 'music_individual' | 'music_group' | 'art_individual' | 'art_group'

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          role: UserRole
          name: string
          phone: string | null
          payment_info: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          role?: UserRole
          name: string
          phone?: string | null
          payment_info?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: UserRole
          name?: string
          phone?: string | null
          payment_info?: Json | null
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          name: string
          contact_email: string | null
          contact_phone: string | null
          payment_method: PaymentMethod
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          contact_email?: string | null
          contact_phone?: string | null
          payment_method?: PaymentMethod
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          contact_email?: string | null
          contact_phone?: string | null
          payment_method?: PaymentMethod
          notes?: string | null
          updated_at?: string
        }
      }
      service_types: {
        Row: {
          id: string
          name: string
          category: ServiceCategory
          location: LocationType
          base_rate: number
          per_person_rate: number
          mca_percentage: number
          contractor_cap: number | null
          rent_percentage: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category: ServiceCategory
          location: LocationType
          base_rate: number
          per_person_rate?: number
          mca_percentage: number
          contractor_cap?: number | null
          rent_percentage?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          category?: ServiceCategory
          location?: LocationType
          base_rate?: number
          per_person_rate?: number
          mca_percentage?: number
          contractor_cap?: number | null
          rent_percentage?: number
          updated_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          date: string
          duration_minutes: number
          service_type_id: string
          contractor_id: string
          status: SessionStatus
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          date: string
          duration_minutes: number
          service_type_id: string
          contractor_id: string
          status?: SessionStatus
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          date?: string
          duration_minutes?: number
          service_type_id?: string
          contractor_id?: string
          status?: SessionStatus
          notes?: string | null
          updated_at?: string
        }
      }
      session_attendees: {
        Row: {
          id: string
          session_id: string
          client_id: string
          individual_cost: number
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          client_id: string
          individual_cost: number
          created_at?: string
        }
        Update: {
          session_id?: string
          client_id?: string
          individual_cost?: number
        }
      }
      invoices: {
        Row: {
          id: string
          session_id: string
          client_id: string
          amount: number
          mca_cut: number
          contractor_pay: number
          rent_amount: number
          status: InvoiceStatus
          payment_method: PaymentMethod
          due_date: string | null
          paid_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_id: string
          client_id: string
          amount: number
          mca_cut: number
          contractor_pay: number
          rent_amount?: number
          status?: InvoiceStatus
          payment_method: PaymentMethod
          due_date?: string | null
          paid_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          session_id?: string
          client_id?: string
          amount?: number
          mca_cut?: number
          contractor_pay?: number
          rent_amount?: number
          status?: InvoiceStatus
          payment_method?: PaymentMethod
          due_date?: string | null
          paid_date?: string | null
          updated_at?: string
        }
      }
      client_goals: {
        Row: {
          id: string
          client_id: string
          description: string
          status: GoalStatus
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          client_id: string
          description: string
          status?: GoalStatus
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          client_id?: string
          description?: string
          status?: GoalStatus
          completed_at?: string | null
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
      user_role: UserRole
      session_status: SessionStatus
      invoice_status: InvoiceStatus
      payment_method: PaymentMethod
      goal_status: GoalStatus
      location_type: LocationType
      service_category: ServiceCategory
    }
  }
}

// Convenience types for working with the database
export type User = Database['public']['Tables']['users']['Row']
export type Client = Database['public']['Tables']['clients']['Row']
export type ServiceType = Database['public']['Tables']['service_types']['Row']
export type Session = Database['public']['Tables']['sessions']['Row']
export type SessionAttendee = Database['public']['Tables']['session_attendees']['Row']
export type Invoice = Database['public']['Tables']['invoices']['Row']
export type ClientGoal = Database['public']['Tables']['client_goals']['Row']

// Extended types with relations
export type SessionWithDetails = Session & {
  service_type: ServiceType
  contractor: User
  attendees: (SessionAttendee & { client: Client })[]
}

export type InvoiceWithDetails = Invoice & {
  session: SessionWithDetails
  client: Client
}
