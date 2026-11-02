import { useEffect, useState } from "react";
import { apiGet, apiError } from "../lib/api";
import { PixelPanel } from "../components/ui/PixelPanel";
import { HealthBar, XpBar } from "../components/ui/Bars";
import { CoinBadge } from "../components/ui/CoinBadge";

export default function Profile() {
  const [data, setData] = useState(null);
  const [stats, setStats] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [p, s] = await Promise.all([
          apiGet("/players/profile"),
          apiGet("/players/stats"),
        ]);
        setData(p); setStats(s);
      } catch (e) { setErr(apiError(e)); }
    })();
  }, []);

  if (err) return <div className="font-mono text-blood-bright">⚠ {err}</div>;
  if (!data || !stats) return <div className="font-mono text-parchment/50">Loading…</div>;

  const { user, progression } = data;

  return (
    <div className="space-y-4">
      <h1 className="font-pixel text-xl text-gold-bright">Hero Sheet</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PixelPanel title="Identity" className="md:col-span-1">
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="w-20 h-20 bg-ink-800 border-2 border-ink-600 grid place-items-center font-pixel text-2xl text-gold-bright">
              {user.username[0]?.toUpperCase()}
            </div>
            <div className="font-pixel text-sm text-parchment text-center">{user.username}</div>
            <div className="font-mono text-xs text-parchment/60">{user.email}</div>
            <div className="font-pixel text-[10px] text-gold-bright uppercase tracking-widest">
              Level {user.level}
            </div>
          </div>
        </PixelPanel>

        <PixelPanel title="Vitals" className="md:col-span-2">
          <div className="space-y-4">
            <HealthBar current={stats.health} max={stats.maxHealth} label="Health" />
            <XpBar current={progression.intoLevel} needed={progression.span} />
            <div className="flex items-center justify-between">
              <CoinBadge coins={stats.coins} />
              <div className="font-mono text-xs text-parchment/60">
                {progression.neededForNext} XP to next level
              </div>
            </div>
          </div>
        </PixelPanel>
      </div>

      <PixelPanel title="Statistics">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Questions" value={stats.totalQuestionsAnswered} />
          <Stat label="Correct" value={stats.correctAnswers} tone="emerald" />
          <Stat label="Wrong" value={stats.incorrectAnswers} tone="blood" />
          <Stat label="Accuracy" value={`${stats.accuracy}%`} />
          <Stat label="Monsters Slain" value={stats.totalMonstersDefeated} />
          <Stat label="Level" value={user.level} />
          <Stat label="Total XP" value={user.xp} />
          <Stat label="Coins" value={stats.coins} />
        </div>
      </PixelPanel>
    </div>
  );
}

function Stat({ label, value, tone = "parchment" }) {
  const toneClass = { emerald: "text-emerald", blood: "text-blood-bright", parchment: "text-parchment" }[tone];
  return (
    <div className="bg-ink-950 border-2 border-ink-700 p-3">
      <div className="font-pixel text-[9px] uppercase tracking-widest text-parchment/50 mb-2">
        {label}
      </div>
      <div className={`font-mono text-xl ${toneClass}`}>{value}</div>
    </div>
  );
}