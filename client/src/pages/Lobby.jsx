import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiGet, apiPost, apiError } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { PixelPanel } from "../components/ui/PixelPanel";
import { PixelInput } from "../components/ui/PixelInput";
import { PixelButton } from "../components/ui/PixelButton";

export default function Lobby() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [code, setCode] = useState("");
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try { setRooms(await apiGet("/game/rooms")); } catch { setRooms([]); }
  };
  useEffect(() => { load(); const t = setInterval(load, 5000); return () => clearInterval(t); }, []);

  const joinByCode = async (e) => {
    e.preventDefault();
    setErr(null); setBusy(true);
    try {
      const room = await apiPost(`/game/rooms/${code.trim().toUpperCase()}/join`);
      navigate(`/room/${room.code}`);
    } catch (e) {
      setErr(apiError(e));
    } finally { setBusy(false); }
  };

  const joinRoom = async (roomCode) => {
    setBusy(true);
    try {
      await apiPost(`/game/rooms/${roomCode}/join`);
      navigate(`/room/${roomCode}`);
    } catch (e) { setErr(apiError(e)); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-pixel text-xl text-gold-bright">Lobby</h1>
          <p className="font-mono text-sm text-parchment/60 mt-1">
            Welcome back, {user.username}. Choose your path.
          </p>
        </div>
        <Link to="/dungeons">
          <PixelButton>Create Room</PixelButton>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PixelPanel title="Open Rooms">
            {rooms.length === 0 ? (
              <p className="font-mono text-sm text-parchment/50 py-8 text-center">
                No open rooms right now. Start one!
              </p>
            ) : (
              <ul className="divide-y-2 divide-ink-700">
                {rooms.map((r) => (
                  <li key={r.code} className="py-3 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="font-pixel text-xs text-gold-bright">{r.code}</div>
                      <div className="font-mono text-sm text-parchment/80 truncate">
                        {r.dungeon?.name || "Unknown Dungeon"} · hosted by {r.owner?.username || "?"}
                      </div>
                    </div>
                    <div className="font-mono text-xs text-parchment/50">
                      {r.players?.length || 0}/4
                    </div>
                    <PixelButton size="sm" onClick={() => joinRoom(r.code)} disabled={busy}>
                      Join
                    </PixelButton>
                  </li>
                ))}
              </ul>
            )}
          </PixelPanel>
        </div>

        <div>
          <PixelPanel title="Join by Code">
            <form onSubmit={joinByCode} className="space-y-4">
              <PixelInput
                label="Room Code"
                placeholder="ABC123"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={8}
              />
              {err && <div className="font-mono text-sm text-blood-bright">⚠ {err}</div>}
              <PixelButton type="submit" variant="secondary" disabled={busy || !code.trim()} className="w-full">
                Join Room
              </PixelButton>
            </form>
          </PixelPanel>
        </div>
      </div>
    </div>
  );
}