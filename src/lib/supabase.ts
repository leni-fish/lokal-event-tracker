import { createClient } from '@supabase/supabase-js';
import { EventItem } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qfmwimydwmokmimnuswz.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_TR8Sn4AnKy7h0n6M0hOIzQ_1MfSO14U';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Database {
  public: {
    Tables: {
      events: {
        Row: EventItem;
        Insert: Omit<EventItem, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<EventItem, 'id' | 'created_at'>>;
      };
    };
  };
}
