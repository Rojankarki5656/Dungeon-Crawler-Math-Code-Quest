import { useEffect, useState } from "react";
import { apiGet } from "../lib/api";
import { PixelPanel } from "../components/ui/PixelPanel";
import { PixelButton } from "../components/ui/PixelButton";

const TABS = [
  { key: "level", label: "Level" },
  { key: "xp", label: "XP" },
  { key: "monsters", label: "Monsters" },
  { key: "accuracy", label: "Accuracy" },
];

export default function Leaderboard() {
  const [by, setBy] = useState("level");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiGet(`/players/leaderboard?by=${by}&limit=25`)
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [by]);

  return (
    <div className="space-y-4">
      <h1 className="font-pixel text-xl text-gold-bright">Hall of Heroes</h1>

      <div className="flex gap-2 flex-wrap">
        {TABS.map((t) => (
          <PixelButton
            key={t.key}
            size="sm"
            variant={by === t.key ? "primary" : "secondary"}
            onClick={() => setBy(t.key)}
          >
            {t.label}
          </PixelButton>
        ))}
      </div>

      <PixelPanel>
        {loading ? (
          <p className="font-mono text-sm text-parchment/50 py-6 text-center">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="font-mono text-sm text-parchment/50 py-6 text-center">No heroes yet.</p>
        ) : (
          <table className="w-full font-mono text-sm">
            <thead>
              <tr className="text-left font-pixel text-[9px] uppercase tracking-widest text-parchment/50 border-b-2 border-ink-700">
                <th className="py-2 w-12">#</th>
                <th className="py-2">Hero</th>
                <th className="py-2 text-right">Level</th>
                <th className="py-2 text-right">XP</th>
                <th className="py-2 text-right">Monsters</th>
                <th className="py-2 text-right">Accuracy</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u, i) => (
                <tr key={u._id} className="border-b border-ink-800">
                  <td className="py-2 text-gold-bright">{i + 1}</td>
                  <td className="py-2 text-parchment">{u.username}</td>
                  <td className="py-2 text-right">{u.level}</td>
                  <td className="py-2 text-right">{u.xp}</td>
                  <td className="py-2 text-right">{u.stats?.totalMonstersDefeated ?? 0}</td>
                  <td className="py-2 text-right">
                    {u.accuracy != null
                      ? `${Math.round(u.accuracy * 1000) / 10}%`
                      : u.stats?.totalQuestionsAnswered
                      ? `${Math.round((u.stats.correctAnswers / u.stats.totalQuestionsAnswered) * 1000) / 10}%`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </PixelPanel>
    </div>
  );
}