import { createClient } from '@supabase/supabase-js';

// جلب البيانات من ملف .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// التأكد من أن المفاتيح موجودة (للراحة أثناء التطوير)
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("خطأ: مفاتيح Supabase غير موجودة في ملف .env!");
}

// إنشاء العميل وتصديره لاستخدامه في كل صفحات الموقع
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // لمنع التعارض مع Clerk
  }
});