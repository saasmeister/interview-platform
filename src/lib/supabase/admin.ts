import { createClient } from "@supabase/supabase-js";

// Admin client met service role key - alleen gebruiken in server-side code!
// Dit omzeilt Row Level Security en heeft volledige toegang.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
