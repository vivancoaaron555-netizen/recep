import { createClient } from '@supabase/supabase-js';
import path from 'path';
import dotenv from 'dotenv';

// __dirname = backend/src/utils/ (dev) or backend/dist/utils/ (prod)
// ../../.env resolves to backend/.env in both cases
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables');
}

// Use service role key for backend — bypasses RLS
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
