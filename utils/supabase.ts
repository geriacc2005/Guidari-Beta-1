
import { createClient } from '@supabase/supabase-js';

// NOTA: Estas claves son para desarrollo Guidari Beta. 
// En producción real deberían ser variables de entorno de Vercel.
const supabaseUrl = 'https://zugbripyvaidkpesrvaa.supabase.co';
const supabaseKey = 'sb_publishable_dG-K9akAvooI8qFDK7q6lg_nuRIqGri';

export const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
