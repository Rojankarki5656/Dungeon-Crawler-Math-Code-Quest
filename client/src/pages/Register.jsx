import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { PixelPanel } from "../components/ui/PixelPanel";
import { PixelInput } from "../components/ui/PixelInput";
import { PixelButton } from "../components/ui/PixelButton";

export default function Register() {
  const register = useAuthStore((s) => s.register);
  const error = useAuthStore((s) => s.error);
  const loading = useAuthStore((s) => s.loading);
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "" });

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    const ok = await register(form.username, form.email, form.password);
    if (ok) navigate("/lobby", { replace: true });
  };

  return (
    <PixelPanel title="Forge a Hero">
      <form onSubmit={onSubmit} className="space-y-4">
        <PixelInput label="Username" required minLength={3} maxLength={24} value={form.username} onChange={set("username")} />
        <PixelInput label="Email" type="email" required value={form.email} onChange={set("email")} />
        <PixelInput label="Password" type="password" required minLength={8} value={form.password} onChange={set("password")} />
        {error && <div className="font-mono text-sm text-blood-bright">⚠ {error}</div>}
        <PixelButton type="submit" disabled={loading} className="w-full">
          {loading ? "Forging…" : "Begin Quest"}
        </PixelButton>
        <p className="font-mono text-xs text-parchment/60 text-center">
          Already a hero? <Link to="/login" className="text-gold-bright underline">Sign in</Link>
        </p>
      </form>
    </PixelPanel>
  );
}