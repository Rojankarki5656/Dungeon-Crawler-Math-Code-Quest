import { useEffect, useState } from "react";
import { apiGet, apiPost, apiError } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { PixelPanel } from "../components/ui/PixelPanel";
import { PixelButton } from "../components/ui/PixelButton";

const rarityTone = {
  COMMON: "border-ink-600",
  RARE: "border-mana",
  EPIC: "border-gold",
  LEGENDARY: "border-blood-bright",
};

const itemEmoji = {
  health_potion: "🧪",
  greater_potion: "⚗",
  xp_scroll: "📜",
  coin_pouch: "💰",
  heart_crystal: "❤",
  trophy_slime: "🏆",
};

export default function Inventory() {
  const updateUser = useAuthStore((s) => s.updateUser);
  const [items, setItems] = useState([]);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(null);

  const load = async () => {
    try { setItems(await apiGet("/inventory")); }
    catch (e) { setErr(apiError(e)); }
  };
  useEffect(() => { load(); }, []);

  const use = async (itemKey) => {
    setErr(null); setBusy(itemKey);
    try {
      const res = await apiPost("/inventory/use", { itemKey });
      if (res?.user) updateUser(res.user);
      await load();
    } catch (e) { setErr(apiError(e)); }
    finally { setBusy(null); }
  };

  return (
    <div className="space-y-4">
      <h1 className="font-pixel text-xl text-gold-bright">Bag</h1>
      {err && <div className="font-mono text-sm text-blood-bright">⚠ {err}</div>}

      {items.length === 0 ? (
        <PixelPanel>
          <p className="font-mono text-sm text-parchment/50 py-6 text-center">
            Your bag is empty. Slay monsters to find loot.
          </p>
        </PixelPanel>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {items.map((it) => {
            const { item, quantity } = it;
            const tone = rarityTone[item.rarity] || "border-ink-600";
            const consumable = item.type === "CONSUMABLE";
            return (
              <div key={item.key} className={`bg-ink-900 border-2 ${tone} p-3 flex flex-col`}>
                <div className="flex items-start justify-between">
                  <div className="text-3xl">{itemEmoji[item.key] || "◆"}</div>
                  <div className="font-pixel text-xs text-gold-bright">×{quantity}</div>
                </div>
                <div className="mt-2 font-pixel text-[10px] text-parchment uppercase tracking-widest">
                  {item.name}
                </div>
                <div className="mt-1 font-mono text-xs text-parchment/60 flex-1">
                  {item.description}
                </div>
                <div className="mt-2 font-pixel text-[9px] uppercase tracking-widest text-parchment/40">
                  {item.rarity}
                </div>
                {consumable && (
                  <PixelButton
                    size="sm" className="mt-2"
                    disabled={busy === item.key || quantity < 1}
                    onClick={() => use(item.key)}
                  >
                    {busy === item.key ? "…" : "Use"}
                  </PixelButton>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}