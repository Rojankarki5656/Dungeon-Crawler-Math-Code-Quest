import { Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { PixelButton } from "../components/ui/PixelButton";

const features = [
  { icon: "⚔", title: "Solve to Survive", body: "Monsters fall only to sharp minds. Answer math to strike." },
  { icon: "⚔", title: "Adventure Together", body: "Party up to 4 heroes. Share a dungeon. Split the glory." },
  { icon: "⚔", title: "Climb the Ranks", body: "Earn XP, unlock new dungeons, climb the leaderboard." },
];

export default function Landing() {
  const user = useAuthStore((s) => s.user);
  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between max-w-7xl w-full mx-auto">
        <Link to="/" className="font-pixel text-sm text-gold-bright tracking-widest">
          ⚔ DUNGEON<span className="text-parchment">QUEST</span>
        </Link>
        <div className="flex gap-2">
          {user ? (
            <Link to="/lobby"><PixelButton size="sm">Enter Game</PixelButton></Link>
          ) : (
            <>
              <Link to="/login"><PixelButton variant="secondary" size="sm">Login</PixelButton></Link>
              <Link to="/register"><PixelButton size="sm">Play Free</PixelButton></Link>
            </>
          )}
        </div>
      </header>

      <main className="flex-1 flex items-center">
        <div className="max-w-5xl w-full mx-auto px-6 py-12 text-center">
          <div className="mb-4 font-pixel text-[10px] uppercase tracking-[0.4em] text-gold-bright">
            A Multiplayer Math RPG
          </div>
          <h1 className="font-pixel text-4xl sm:text-5xl md:text-6xl text-parchment leading-tight mb-6">
            DUNGEON<span className="text-gold-bright">QUEST</span>
          </h1>
          <p className="font-mono text-lg text-parchment/70 max-w-2xl mx-auto mb-10">
            Monsters can't be fought with swords alone. In the world of Mathoria,
            every blow must be earned — by solving the equation shown in the rune.
          </p>

          <div className="flex flex-wrap gap-3 justify-center mb-16">
            {user ? (
              <Link to="/lobby"><PixelButton size="lg">Continue Adventure</PixelButton></Link>
            ) : (
              <>
                <Link to="/register"><PixelButton size="lg">Begin Quest</PixelButton></Link>
                <Link to="/login"><PixelButton size="lg" variant="secondary">Return Hero</PixelButton></Link>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            {features.map((f) => (
              <div key={f.title} className="bg-ink-900 border-2 border-ink-600 shadow-pixel p-5">
                <div className="text-2xl mb-3 text-gold-bright">{f.icon}</div>
                <div className="font-pixel text-[10px] uppercase tracking-widest text-gold-bright mb-2">
                  {f.title}
                </div>
                <p className="font-mono text-sm text-parchment/70">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t-2 border-ink-600 py-4 text-center font-mono text-xs text-parchment/40">
        DungeonQuest · Mathoria Awaits
      </footer>
    </div>
  );
}