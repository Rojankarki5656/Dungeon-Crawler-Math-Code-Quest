import { Outlet, Link } from "react-router-dom";

export function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <Link to="/" className="font-pixel text-xl text-gold-bright tracking-widest mb-8">
        ⚔ DUNGEON<span className="text-parchment">QUEST</span>
      </Link>
      <div className="w-full max-w-md">
        <Outlet />
      </div>
      <p className="mt-6 font-mono text-xs text-parchment/40">
        Solve to survive. Mathoria awaits.
      </p>
    </div>
  );
}