
import { createClient } from '@supabase/supabase-js';

// Valores por defecto proporcionados
const DEFAULT_URL = 'https://zugbripyvaidkpesrvaa.supabase.co';
const DEFAULT_KEY = 'sb_publishable_dG-K9akAvooI8qFDK7q6lg_nuRIqGri';

/**
 * Obtiene la configuración actual de Supabase desde el almacenamiento local o usa los valores por defecto.
 */
export const getSupabaseConfig = () => {
  const storedUrl = localStorage.getItem('GUIDARI_SB_URL');
  const storedKey = localStorage.getItem('GUIDARI_SB_KEY');
  return {
    url: storedUrl || DEFAULT_URL,
    key: storedKey || DEFAULT_KEY
  };
};

const config = getSupabaseConfig();

// Instancia singleton de Supabase
export const supabase = createClient(config.url, config.key);

/**
 * Actualiza las credenciales de Supabase, las persiste y reinicia la aplicación para aplicar los cambios.
 */
export const updateSupabaseCredentials = (url: string, key: string) => {
  if (!url || !key) return;
  localStorage.setItem('GUIDARI_SB_URL', url.trim());
  localStorage.setItem('GUIDARI_SB_KEY', key.trim());
  window.location.reload();
};

export default supabase;
