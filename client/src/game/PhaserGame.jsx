import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { DungeonScene } from "./scenes/DungeonScene";
import { socket } from "../lib/socket";
import { bridge } from "./bridge";

export function PhaserGame({ room, user }) {
  const containerRef = useRef(null);
  const gameRef = useRef(null);
  const [nearMonster, setNearMonster] = React.useState(null);
  const [cleared, setCleared] = React.useState(false);
  const [combatOpen, setCombatOpen] = React.useState(false);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: containerRef.current,
      backgroundColor: "#0a0810",
      pixelArt: true,
      physics: { default: "arcade", arcade: { debug: false } },
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: containerRef.current.clientWidth || 800,
        height: containerRef.current.clientHeight || 600,
      },
      scene: [BootScene, DungeonScene],
      callbacks: {
        preBoot: (g) => {
          g.registry.set("room", room);
          g.registry.set("user", user);
          g.registry.set("socket", socket);
        },
      },
    });
    gameRef.current = game;

    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Bridge → React for the interaction prompt and overlays
  useEffect(() => {
    const offNear = bridge.on("near-monster", setNearMonster);
    const offLeave = bridge.on("leave-monster", () => setNearMonster(null));
    const offCleared = bridge.on("dungeon-cleared", () => setCleared(true));
    const offCombatOpen = bridge.on("combat-open", () => setCombatOpen(true));
    const offCombatClose = bridge.on("combat-close", () => setCombatOpen(false));
    return () => { offNear(); offLeave(); offCleared(); offCombatOpen(); offCombatClose(); };
  }, []);

  return (
    <div className="relative w-full h-[calc(100vh-180px)] min-h-[420px] bg-ink-950 border-2 border-ink-600 overflow-hidden">
      <div ref={containerRef} className="absolute inset-0" />

      {/* Interaction prompt */}
      {nearMonster && !combatOpen && !cleared && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-ink-900/95 border-2 border-gold px-4 py-2 shadow-pixel pointer-events-none animate-pulse">
          <span className="font-pixel text-[10px] uppercase tracking-widest text-gold-bright">
            [SPACE] Fight {nearMonster.name}
          </span>
        </div>
      )}

      {/* Controls hint */}
      <div className="absolute top-3 left-3 bg-ink-900/80 border border-ink-700 px-3 py-1.5 pointer-events-none">
        <span className="font-mono text-[10px] text-parchment/60">
          WASD / Arrows · SPACE to fight
        </span>
      </div>

      {/* Dungeon cleared */}
      {cleared && (
        <div className="absolute inset-0 bg-ink-950/70 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="font-pixel text-3xl text-gold-bright mb-2">★ CLEARED ★</div>
            <p className="font-mono text-sm text-parchment/70">
              All monsters in this dungeon have fallen.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

import React from "react";