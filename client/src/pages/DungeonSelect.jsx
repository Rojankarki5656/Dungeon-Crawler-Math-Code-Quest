import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPost, apiError } from "../lib/api";
import { PixelPanel } from "../components/ui/PixelPanel";
import { PixelButton } from "../components/ui/PixelButton";

export default function DungeonSelect() {
  const navigate = useNavigate();
  const [dungeons, setDungeons] = useState([]);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(null); // `${dungeonId}:${mode}` while creating

  useEffect(() => {
    (async () => {
      try { setDungeons(await apiGet("/dungeons")); }
      catch (e) { setErr(apiError(e)); }
    })();
  }, []);

  const enter = async (d, mode) => {
    setErr(null);
    setBusy(`${d._id}:${mode}`);
    try {
      const room = await apiPost("/game/rooms", {
        dungeonId: d._id,
        soloMode: mode === "solo",
      });
      navigate(`/room/${room.code}`);
    } catch (e) {
      setErr(apiError(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-pixel text-xl text-gold-bright">Choose a Dungeon</h1>
        <p className="font-mono text-sm text-parchment/60 mt-1">
          Solo for a private run (progress saves when you leave). Play Online to host a party.
        </p>
      </div>
      {err && <div className="font-mono text-sm text-blood-bright">⚠ {err}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dungeons.map((d) => {
          const locked = !d.unlocked;
          return (
            <PixelPanel key={d._id} className="flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-pixel text-xs text-gold-bright">{d.name}</div>
                  <div className="font-mono text-xs text-parchment/60 mt-1">
                    Difficulty {d.difficulty} · Lv {d.levelRequirement}+
                  </div>
                </div>
                <div className="text-xl">{locked ? "🔒" : "⚔"}</div>
              </div>
              <p className="font-mono text-sm text-parchment/70 mb-4 flex-1">{d.description}</p>

              {locked ? (
                <PixelButton variant="ghost" disabled className="w-full">
                  Requires Lv {d.levelRequirement}
                </PixelButton>
              ) : (
                <div className="space-y-2">
                  <PixelButton
                    className="w-full"
                    disabled={busy !== null}
                    onClick={() => enter(d, "solo")}
                  >
                    {busy === `${d._id}:solo` ? "Entering…" : "Play Solo"}
                  </PixelButton>
                  <PixelButton
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    disabled={busy !== null}
                    onClick={() => enter(d, "multiplayer")}
                  >
                    {busy === `${d._id}:multiplayer` ? "Creating…" : "Play Online"}
                  </PixelButton>
                </div>
              )}
            </PixelPanel>
          );
        })}
      </div>
    </div>
  );
}