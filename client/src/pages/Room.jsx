import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiGet, apiPost, apiError } from "../lib/api";
import { socket, connectSocket } from "../lib/socket";
import { useAuthStore } from "../store/authStore";
import { PixelPanel } from "../components/ui/PixelPanel";
import { PixelButton } from "../components/ui/PixelButton";
import { PixelInput } from "../components/ui/PixelInput";
import { HealthBar } from "../components/ui/Bars";
import { PhaserGame } from "../game/PhaserGame";
import { bridge } from "../game/bridge";

export default function Room() {
  const { code } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  const [room, setRoom] = useState(null);
  const [chat, setChat] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [activeMonsterId, setActiveMonsterId] = useState(null);
  const [error, setError] = useState(null);
  const chatEndRef = useRef(null);

  const intentionallyLeftRef = useRef(false);
  const leaveTimerRef = useRef(null);   // ← new

  // ----------------------------------------------------------------------
  // Mount effect: join (REST, then socket), attach listeners, delayed leave
  // ----------------------------------------------------------------------
  useEffect(() => {
    // Cancel any pending leave from a prior cleanup (StrictMode rescue)
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }

    connectSocket();
    intentionallyLeftRef.current = false;

    const onJoin = (res) => {
      if (!res?.ok) { setError(res?.error || "Could not join room"); return; }
      setRoom(res.data.room);
      setChat(res.data.chat || []);
    };

    let cancelled = false;
    (async () => {
      try {
        await apiPost(`/game/rooms/${code}/join`);
      } catch (e) {
        if (!cancelled) setError(apiError(e));
        return;
      }
      if (cancelled) return;
      socket.emit("room:join", { code }, onJoin);
    })();

    const onPlayerJoined = async (payload) => {
      bridge.emit("remote-joined", payload);
      try { setRoom(await apiGet(`/game/rooms/${code}`)); } catch { /* ignore */ }
    };
    const onPlayerLeft = ({ userId }) => {
      bridge.emit("remote-left", { userId });
      setRoom((r) =>
        r ? { ...r, players: r.players.filter((p) => String(p.user?._id || p.user) !== userId) } : r
      );
    };
    const onPlayerMoved = (payload) => bridge.emit("remote-moved", payload);
    const onChat = (msg) => setChat((c) => [...c, msg]);
    const onMonsterUpdated = (payload) => {
      bridge.emit("monster-updated", payload);
      setRoom((r) =>
        r ? {
          ...r,
          monsters: r.monsters.map((m) =>
            m.instanceId === payload.instanceId
              ? { ...m, currentHp: payload.currentHp, maxHp: payload.maxHp, defeated: payload.defeated }
              : m
          ),
        } : r
      );
    };
    const onMonsterDefeated = (payload) => {
      bridge.emit("monster-defeated", payload);
      setRoom((r) =>
        r ? {
          ...r,
          monsters: r.monsters.map((m) =>
            m.instanceId === payload.instanceId ? { ...m, defeated: true, currentHp: 0 } : m
          ),
        } : r
      );
    };
    const onSystem = ({ message }) =>
      setChat((c) => [...c, { system: true, message, timestamp: new Date().toISOString() }]);
    const onPlayerDamaged = ({ userId, health }) => {
      if (userId === user?._id) updateUser({ health });
    };

    socket.on("player:joined", onPlayerJoined);
    socket.on("player:left", onPlayerLeft);
    socket.on("player:moved", onPlayerMoved);
    socket.on("chat:message", onChat);
    socket.on("monster:updated", onMonsterUpdated);
    socket.on("monster:defeated", onMonsterDefeated);
    socket.on("system:message", onSystem);
    socket.on("player:damaged", onPlayerDamaged);

    return () => {
      cancelled = true;
      socket.emit("room:leave");
      socket.off("player:joined", onPlayerJoined);
      socket.off("player:left", onPlayerLeft);
      socket.off("player:moved", onPlayerMoved);
      socket.off("chat:message", onChat);
      socket.off("monster:updated", onMonsterUpdated);
      socket.off("monster:defeated", onMonsterDefeated);
      socket.off("system:message", onSystem);
      socket.off("player:damaged", onPlayerDamaged);

      // Delayed REST leave. If StrictMode immediately re-mounts,
      // the next effect's setup clears this timer before it fires.
      leaveTimerRef.current = setTimeout(() => {
        leaveTimerRef.current = null;
        if (!intentionallyLeftRef.current) {
          apiPost(`/game/rooms/${code}/leave`).catch(() => {});
        }
      }, 250);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, user?._id]);

  // ----------------------------------------------------------------------
  // Tab-close / browser-close safety: best-effort leave via sendBeacon
  // (sendBeacon survives the page unload, unlike fetch/axios)
  // ----------------------------------------------------------------------
  useEffect(() => {
    const handler = () => {
      if (!intentionallyLeftRef.current) {
        try {
          navigator.sendBeacon(
            `/api/game/rooms/${code}/leave`,
            new Blob([JSON.stringify({})], { type: "application/json" })
          );
        } catch { /* ignore */ }
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [code]);

  // bridge → combat modal
  useEffect(() => {
    const off = bridge.on("request-fight", ({ instanceId }) => setActiveMonsterId(instanceId));
    return () => off();
  }, []);
  useEffect(() => { bridge.emit(activeMonsterId ? "combat-open" : "combat-close"); }, [activeMonsterId]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chat.length]);

  const sendChat = (e) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text) return;
    setChatInput("");
    socket.emit("chat:message", { message: text }, (res) => {
      if (!res?.ok) setError(res?.error || "Chat failed");
    });
  };

  const leave = useCallback(async () => {
    intentionallyLeftRef.current = true;
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    try { await apiPost(`/game/rooms/${code}/leave`); } catch { /* ignore */ }
    socket.emit("room:leave");
    navigate("/lobby");
  }, [code, navigate]);

  if (!room) {
    return (
      <div className="text-center py-20">
        <div className="font-pixel text-xs text-gold-bright uppercase mb-3">Connecting…</div>
        {error && (
          <>
            <div className="font-mono text-sm text-blood-bright">⚠ {error}</div>
            <PixelButton className="mt-4" onClick={() => navigate("/lobby")}>
              Back to Lobby
            </PixelButton>
          </>
        )}
      </div>
    );
  }

  const activeMonster = activeMonsterId
    ? room.monsters.find((m) => m.instanceId === activeMonsterId)
    : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-pixel text-[10px] text-parchment/60 uppercase tracking-widest">Room</span>
            {room.soloMode && (
              <span className="font-pixel text-[9px] uppercase tracking-widest bg-mana/30 border border-mana text-mana-bright px-2 py-0.5">Solo</span>
            )}
            {room.pausedAt && (
              <span className="font-pixel text-[9px] uppercase tracking-widest bg-gold/20 border border-gold text-gold-bright px-2 py-0.5">Paused</span>
            )}
          </div>
          <div className="font-pixel text-xl text-gold-bright">{room.code}</div>
          <div className="font-mono text-sm text-parchment/60">
            {room.dungeon?.name || "Dungeon"} · {room.status}
          </div>
        </div>
        <PixelButton variant="secondary" onClick={leave}>
          {room.soloMode ? "Pause & Exit" : "Leave"}
        </PixelButton>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3">
          <PhaserGame room={room} user={user} />
        </div>
        <div className="lg:col-span-1 space-y-4">
          <PixelPanel title="Party">
            <ul className="divide-y-2 divide-ink-700">
              {room.players?.map((p) => (
                <li key={p.user._id || p.user} className="py-3 flex items-center gap-3">
                  <div className="w-8 h-8 bg-ink-800 border-2 border-ink-600 grid place-items-center font-pixel text-[10px] text-gold-bright">
                    {p.user.username?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-sm text-parchment truncate">
                      {p.user.username}{" "}
                      {String(p.user._id || p.user) === user._id && (
                        <span className="text-gold-bright text-xs">(you)</span>
                      )}
                    </div>
                    <div className="font-mono text-xs text-parchment/50">Lv {p.level}</div>
                  </div>
                </li>
              ))}
            </ul>
          </PixelPanel>

          <PixelPanel title="Chat" className="flex flex-col h-[280px]">
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {chat.length === 0 && (
                <p className="font-mono text-xs text-parchment/40 text-center py-4">No messages yet.</p>
              )}
              {chat.map((m, i) => (
                <div key={i} className="font-mono text-sm leading-snug">
                  {m.system ? (
                    <span className="text-gold-bright text-xs">◆ {m.message}</span>
                  ) : (
                    <>
                      <span className="text-gold-bright">{m.username}:</span>{" "}
                      <span className="text-parchment/90">{m.message}</span>
                    </>
                  )}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={sendChat} className="mt-3 flex gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Say something…"
                maxLength={300}
                className="flex-1 bg-ink-950 border-2 border-ink-600 focus:border-gold px-2 py-1.5 font-mono text-sm text-parchment outline-none"
              />
              <PixelButton type="submit" size="sm">→</PixelButton>
            </form>
          </PixelPanel>
        </div>
      </div>

      {activeMonster && (
        <CombatModal monster={activeMonster} onClose={() => setActiveMonsterId(null)} />
      )}
    </div>
  );
}

function CombatModal({ monster, onClose }) {
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [monsterHp, setMonsterHp] = useState(monster.currentHp);
  const [defeated, setDefeated] = useState(monster.defeated);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (monster.defeated) { setLoading(false); return; }
    socket.emit("combat:start", { monsterInstanceId: monster.instanceId }, (res) => {
      setLoading(false);
      if (res?.ok) setQuestion(res.data.question);
      else setFeedback({ type: "error", message: res?.error || "Could not start combat" });
    });

    const onUpdated = ({ instanceId, currentHp, defeated: d }) => {
      if (instanceId !== monster.instanceId) return;
      setMonsterHp(currentHp);
      if (d) setDefeated(true);
    };
    socket.on("monster:updated", onUpdated);
    return () => socket.off("monster:updated", onUpdated);
  }, [monster.instanceId, monster.defeated]);

  const submit = (e) => {
    e.preventDefault();
    if (!question || !answer.trim() || submitting || defeated) return;
    setSubmitting(true);
    setFeedback(null);
    socket.emit("combat:answer", { questionId: question.questionId, answer }, (res) => {
      setSubmitting(false);
      if (!res?.ok) { setFeedback({ type: "error", message: res?.error || "Failed" }); return; }
      const d = res.data;
      if (d.correct) {
        setMonsterHp(d.monster.currentHp);
        if (d.defeated) setDefeated(true);
        setFeedback({ type: "success", message: `Hit for ${d.damage} damage!` });
        setAnswer("");
        if (!d.defeated) {
          socket.emit("combat:start", { monsterInstanceId: monster.instanceId }, (r) => {
            if (r?.ok) setQuestion(r.data.question);
          });
        }
      } else {
        setFeedback({ type: "error", message: `Wrong! You take ${d.playerDamage} damage.` });
        setAnswer("");
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-ink-950/90 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-ink-900 border-2 border-gold shadow-pixel">
        <div className="flex items-center justify-between border-b-2 border-ink-600 p-3">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{monsterEmoji(monster.spriteKey)}</div>
            <div>
              <div className="font-pixel text-xs text-gold-bright">{monster.name}</div>
              <HealthBar current={monsterHp} max={monster.maxHp} label="Enemy HP" className="w-56 mt-1" />
            </div>
          </div>
          <PixelButton variant="secondary" size="sm" onClick={onClose}>✕</PixelButton>
        </div>

        <div className="p-4">
          {defeated ? (
            <div className="py-8 text-center">
              <div className="font-pixel text-2xl text-gold-bright mb-2">★ VICTORY ★</div>
              <p className="font-mono text-sm text-parchment/70">
                {monster.name} has fallen. Rewards distributed.
              </p>
              <PixelButton className="mt-4" onClick={onClose}>Continue</PixelButton>
            </div>
          ) : loading ? (
            <p className="font-mono text-sm text-parchment/50 py-8 text-center">
              Summoning a rune…
            </p>
          ) : question ? (
            <form onSubmit={submit} className="space-y-4">
              <div className="bg-ink-950 border-2 border-ink-600 p-2">
                <img src={question.image} alt="Math question" className="w-full block" draggable={false} />
              </div>
              <PixelInput
                label="Your Answer"
                inputMode="numeric"
                autoFocus
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type a number"
                disabled={submitting}
              />
              {feedback && (
                <div className={[
                  "font-mono text-sm p-2 border-2",
                  feedback.type === "success"
                    ? "text-emerald border-emerald/50 bg-emerald/10"
                    : "text-blood-bright border-blood/50 bg-blood/10",
                ].join(" ")}>
                  {feedback.type === "success" ? "✓ " : "✗ "}{feedback.message}
                </div>
              )}
              <div className="flex justify-end gap-2">
                <PixelButton type="button" variant="secondary" onClick={onClose}>Flee</PixelButton>
                <PixelButton type="submit" disabled={submitting || !answer.trim()}>
                  {submitting ? "Attacking…" : "Attack"}
                </PixelButton>
              </div>
            </form>
          ) : (
            <div className="py-8 text-center">
              <div className="font-mono text-sm text-blood-bright">
                {feedback?.message || "Something went wrong."}
              </div>
              <PixelButton className="mt-4" onClick={onClose}>Close</PixelButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function monsterEmoji(key) {
  return { slime: "🟢", goblin: "👺", skeleton: "💀", dark_mage: "🧙", boss: "🐲", dungeon_boss: "🐲" }[key] || "👾";
}