import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { PixelPanel } from "../components/ui/PixelPanel";
import { PixelInput } from "../components/ui/PixelInput";
import { PixelButton } from "../components/ui/PixelButton";

export default function Login() {
  const login = useAuthStore((s) => s.login);
  const error = useAuthStore((s) => s.error);
  const loading = useAuthStore((s) => s.loading);
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const from = location.state?.from?.pathname || "/lobby";

  const onSubmit = async (e) => {
    e.preventDefault();
    const ok = await login(email, password);
    if (ok) navigate(from, { replace: true });
  };

  return (
    <PixelPanel title="Return, Hero">
      <form onSubmit={onSubmit} className="space-y-4">
        <PixelInput label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <PixelInput label="Password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <div className="font-mono text-sm text-blood-bright">⚠ {error}</div>}
        <PixelButton type="submit" disabled={loading} className="w-full">
          {loading ? "Signing in…" : "Enter Dungeon"}
        </PixelButton>
        <p className="font-mono text-xs text-parchment/60 text-center">
          New adventurer? <Link to="/register" className="text-gold-bright underline">Create a hero</Link>
        </p>
      </form>
    </PixelPanel>
  );
}