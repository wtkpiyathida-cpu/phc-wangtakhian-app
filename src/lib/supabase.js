import { createClient } from '@supabase/supabase-js';

// แทนที่ข้อความด้านล่างด้วย Project URL และ anon public key จาก Supabase ของคุณ
const SUPABASE_URL = 'https://abarnsiyfnijvcpdpwqj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_mrpr4DNRKvuTSkfFx5v14g_oVa29pcl';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);