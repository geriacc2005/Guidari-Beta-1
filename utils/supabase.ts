
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zugbripyvaidkpesrvaa.supabase.co';
const supabaseKey = 'sb_publishable_dG-K9akAvooI8qFDK7q6lg_nuRIqGri';

// Validar que las variables existen antes de crear el cliente
if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase: Faltan credenciales de conexión.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
