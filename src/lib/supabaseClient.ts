import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // No tiramos error duro para no romper el build (por ejemplo si todavía
  // no se cargaron las variables de entorno en Vercel), pero avisamos en
  // consola. Sin estas variables la app no va a poder leer/guardar nada.
  console.warn(
    "Faltan las variables de entorno NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
      "Configuralas en .env.local (desarrollo) o en Vercel > Settings > Environment Variables (producción)."
  );
}

// Fallback inofensivo solo para que createClient no explote si faltan las
// variables (ej. durante el build). En runtime, sin las variables reales
// configuradas, las consultas van a fallar igual, pero de forma prolija.
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key"
);
