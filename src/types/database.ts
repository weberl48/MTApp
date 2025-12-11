export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'developer' | 'owner' | 'admin' | 'contractor'
export type PlanType = 'free' | 'starter' | 'professional'
export type SessionStatus = 'draft' | 'submitted' | 'approved' | 'no_show' | 'cancelled'
export type InvoiceStatus = 'pending' | 'sent' | 'paid'
export type PaymentMethod = 'private_pay' | 'self_directed' | 'group_home' | 'scholarship'
export type GoalStatus = 'active' | 'met' | 'not_met'
export type LocationType = 'in_home' | 'matts_music' | 'other'
export type ServiceCategory = 'music_individual' | 'music_group' | 'art_individual' | 'art_group'

// Organization settings structure
export interface OrganizationSettings {
  invoice: {
    footer_text: string
    payment_instructions: string
    due_days: number
    send_reminders: boolean
    reminder_days: number[]
  }
  session: {
    default_duration: number
    duration_options: number[]
    require_notes: boolean
    auto_submit: boolean
    reminder_hours: number
    send_reminders: boolean
  }
  notification: {
    email_on_session_submit: boolean
    email_on_invoice_paid: boolean
    admin_email: string
  }
  security: {
    session_timeout_minutes: number
    require_mfa: boolean
    max_login_attempts: number
    lockout_duration_minutes: number
  }
}

// Social links structure
export interface SocialLinks {
  facebook?: string
  instagram?: string
  twitter?: string
  linkedin?: string
  youtube?: string
  tiktok?: string
}

// Business hours structure
export interface DayHours {
  open: string
  close: string
  closed: boolean
}

export interface BusinessHours {
  monday: DayHours
  tuesday: DayHours
  wednesday: DayHours
  thursday: DayHours
  friday: DayHours
  saturday: DayHours
  sunday: DayHours
}

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          email: string | null
          phone: string | null
          address: string | null
          website: string | null
          logo_url: string | null
          primary_color: string
          secondary_color: string
          tagline: string | null
          description: string | null
          tax_id: string | null
          social_links: SocialLinks
          business_hours: BusinessHours
          timezone: string
          currency: string
          plan: PlanType
          trial_ends_at: string | null
          settings: OrganizationSettings
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          email?: string | null
          phone?: string | null
          address?: string | null
          website?: string | null
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string
          tagline?: string | null
          description?: string | null
          tax_id?: string | null
          social_links?: SocialLinks
          business_hours?: BusinessHours
          timezone?: string
          currency?: string
          plan?: PlanType
          trial_ends_at?: string | null
          settings?: OrganizationSettings
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          slug?: string
          email?: string | null
          phone?: string | null
          address?: string | null
          website?: string | null
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string
          tagline?: string | null
          description?: string | null
          tax_id?: string | null
          social_links?: SocialLinks
          business_hours?: BusinessHours
          timezone?: string
          currency?: string
          plan?: PlanType
          trial_ends_at?: string | null
          settings?: OrganizationSettings
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          role: UserRole
          name: string
          phone: string | null
          payment_info: Json | null
          organization_id: string
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
          organization_id: string
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
          organization_id?: string
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
          organization_id: string
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
          organization_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          contact_email?: string | null
          contact_phone?: string | null
          payment_method?: PaymentMethod
          notes?: string | null
          organization_id?: string
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
          is_active: boolean
          display_order: number
          organization_id: string
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
          is_active?: boolean
          display_order?: number
          organization_id: string
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
          is_active?: boolean
          display_order?: number
          organization_id?: string
          updated_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          date: string
          time: string | null
          duration_minutes: number
          service_type_id: string
          contractor_id: string
          status: SessionStatus
          notes: string | null
          contractor_paid_date: string | null
          contractor_paid_amount: number | null
          organization_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          date: string
          time?: string | null
          duration_minutes: number
          service_type_id: string
          contractor_id: string
          status?: SessionStatus
          notes?: string | null
          contractor_paid_date?: string | null
          contractor_paid_amount?: number | null
          organization_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          date?: string
          time?: string | null
          duration_minutes?: number
          service_type_id?: string
          contractor_id?: string
          status?: SessionStatus
          notes?: string | null
          contractor_paid_date?: string | null
          contractor_paid_amount?: number | null
          organization_id?: string
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
          organization_id: string
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
          organization_id: string
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
          organization_id?: string
          updated_at?: string
        }
      }
      client_goals: {
        Row: {
          id: string
          client_id: string
          description: string
          status: GoalStatus
          organization_id: string
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          client_id: string
          description: string
          status?: GoalStatus
          organization_id: string
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          client_id?: string
          description?: string
          status?: GoalStatus
          organization_id?: string
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
      plan_type: PlanType
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
export type Organization = Database['public']['Tables']['organizations']['Row']
export type User = Database['public']['Tables']['users']['Row']
export type Client = Database['public']['Tables']['clients']['Row']
export type ServiceType = Database['public']['Tables']['service_types']['Row']
export type Session = Database['public']['Tables']['sessions']['Row']
export type SessionAttendee = Database['public']['Tables']['session_attendees']['Row']
export type Invoice = Database['public']['Tables']['invoices']['Row']
export type ClientGoal = Database['public']['Tables']['client_goals']['Row']

// App Settings types
export interface BusinessInfo {
  name: string
  email: string
  phone: string
  address: string
  website: string
}

export interface InvoiceSettings {
  footer_text: string
  payment_instructions: string
  due_days: number
  send_reminders: boolean
  reminder_days: number[]
}

export interface SessionSettings {
  default_duration: number
  duration_options: number[]
  require_notes: boolean
  auto_submit: boolean
}

export interface NotificationSettings {
  email_on_session_submit: boolean
  email_on_invoice_paid: boolean
  admin_email: string
}

export interface AppSettings {
  business_info: BusinessInfo
  invoice_settings: InvoiceSettings
  session_settings: SessionSettings
  notification_settings: NotificationSettings
}

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
