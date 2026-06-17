import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Logo } from "../components/Logo";
import { useAuthStore } from "../store/authStore";

export function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState("demo@streampilot.local");
  const [password, setPassword] = useState("Demo123456!");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao entrar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-2xl backdrop-blur">
        <Logo />
        <h1 className="mt-8 text-3xl font-black text-white">Entrar</h1>
        <p className="mt-2 text-sm text-slate-400">Acesse suas playlists M3U/XMLTV autorizadas.</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-semibold text-slate-200">
            Email
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500"
              required
            />
          </label>
          <label className="block text-sm font-semibold text-slate-200">
            Senha
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500"
              required
            />
          </label>
          {error ? <p className="rounded-2xl bg-red-500/10 p-3 text-sm text-red-100">{error}</p> : null}
          <button disabled={loading} className="w-full rounded-2xl bg-blue-500 px-4 py-3 font-bold text-white hover:bg-blue-400 disabled:opacity-60">
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-400">
          Não tem conta? <Link className="font-bold text-blue-300" to="/register">Criar cadastro</Link>
        </p>
      </div>
    </div>
  );
}
