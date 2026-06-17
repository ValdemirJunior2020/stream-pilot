import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Logo } from "../components/Logo";
import { useAuthStore } from "../store/authStore";

export function Register() {
  const navigate = useNavigate();
  const register = useAuthStore((state) => state.register);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register({ name, email, password });
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao cadastrar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-2xl backdrop-blur">
        <Logo />
        <h1 className="mt-8 text-3xl font-black text-white">Criar conta</h1>
        <p className="mt-2 text-sm text-slate-400">Use somente fontes M3U e XMLTV próprias/autorizadas.</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-semibold text-slate-200">
            Nome
            <input value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white" />
          </label>
          <label className="block text-sm font-semibold text-slate-200">
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white" required />
          </label>
          <label className="block text-sm font-semibold text-slate-200">
            Senha
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" minLength={8} className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white" required />
          </label>
          {error ? <p className="rounded-2xl bg-red-500/10 p-3 text-sm text-red-100">{error}</p> : null}
          <button disabled={loading} className="w-full rounded-2xl bg-blue-500 px-4 py-3 font-bold text-white hover:bg-blue-400 disabled:opacity-60">
            {loading ? "Criando..." : "Criar conta"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-400">
          Já tem conta? <Link className="font-bold text-blue-300" to="/login">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
