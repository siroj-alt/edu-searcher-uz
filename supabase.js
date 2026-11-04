import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xmdxmfvrzbfjursksfhv.supabase.co';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_BVrfkdIa6RfE2vCD761KUg_YG4Rn51u';

export const supabase = createClient(url, key);
