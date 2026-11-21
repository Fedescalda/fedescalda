import { LoginForm } from "@/components/admin/LoginForm";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function AdminLoginPage() {
  return (
    <section className="card mx-auto max-w-lg space-y-5 p-6">
      <h1 className="text-2xl font-bold">Ingresá al panel</h1>
      {isSupabaseConfigured ? <LoginForm /> : (
        <div className="space-y-3">
          <h2 className="font-bold">Configurá Supabase para usar el panel</h2>
          <ol className="list-decimal space-y-2 pl-5 text-mute">
            <li>Creá un proyecto en <a href="https://supabase.com" className="underline">supabase.com</a>.</li>
            <li>En el editor SQL, corré <code>supabase/schema.sql</code> y después <code>supabase/seed.sql</code>.</li>
            <li>Completá <code>.env.local</code> según <code>.env.example</code> y reiniciá el servidor.</li>
            <li>Creá un usuario en Authentication → Users.</li>
            <li>Hacelo admin con el <code>insert</code> comentado al final de <code>supabase/schema.sql</code>.</li>
          </ol>
        </div>
      )}
    </section>
  );
}
