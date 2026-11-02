import { NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { HealthBar } from "./ui/Bars";
import { CoinBadge } from "./ui/CoinBadge";
import { PixelButton } from "./ui/PixelButton";

const links = [
  { to: "/lobby", label: "Lobby" },
  { to: "/dungeons", label: "Dungeons" },
  { to: "/leaderboard", label: "Ranks" },
  { to: "/inventory", label: "Bag" },
  { to: "/profile", label: "Hero" },
];

export function NavBar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  if (!user) return null;

  const onLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="border-b-2 border-ink-600 bg-ink-900 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4 flex-wrap">
        <NavLink to="/lobby" className="font-pixel text-sm text-gold-bright tracking-widest">
          ⚔ DUNGEON<span className="text-parchment">QUEST</span>
        </NavLink>

        <nav className="flex gap-1 flex-wrap">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                [
                  "font-pixel text-[10px] uppercase tracking-widest px-3 py-2 border-2",
                  isActive
                    ? "bg-gold text-ink-950 border-gold-bright"
                    : "bg-ink-800 text-parchment border-ink-600 hover:bg-ink-700",
                ].join(" ")
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-4">
          <div className="w-40">
            <HealthBar current={user.health} max={user.maxHealth} label="HP" />
          </div>
          <CoinBadge coins={user.coins} />
          <div className="hidden sm:block text-right">
            <div className="font-pixel text-[9px] text-parchment/60 uppercase">
              Lv {user.level}
            </div>
            <div className="font-mono text-sm text-gold-bright">{user.username}</div>
          </div>
          <PixelButton variant="secondary" size="sm" onClick={onLogout}>
            Logout
          </PixelButton>
        </div>
      </div>
    </header>
  );
}