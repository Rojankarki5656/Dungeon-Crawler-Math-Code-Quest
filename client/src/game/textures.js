/**
 * Procedural pixel-art textures. Uses Phaser's Graphics + generateTexture so
 * nothing is loaded from disk. All keys are stable and referenced by scenes.
 */
export function generateTextures(scene) {
  if (scene.textures.exists("hero")) return; // already generated (scene restart)

  // ---- Floor (big tiled texture, 4×4 tiles of 32px = 128×128) ----
  {
    const T = 32, S = 128;
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x1a1523, 1).fillRect(0, 0, S, S);
    // subtle noise per 32×32 cell
    for (let ty = 0; ty < 4; ty++) {
      for (let tx = 0; tx < 4; tx++) {
        const bx = tx * T, by = ty * T;
        g.fillStyle(0x221d32, 1).fillRect(bx + 2, by + 2, T - 4, T - 4);
        g.fillStyle(0x1f1a2c, 1).fillRect(bx + 2, by + 2, T - 4, 1);
        g.fillStyle(0x1f1a2c, 1).fillRect(bx + 2, by + T - 3, T - 4, 1);
        // 3 random specks
        for (let i = 0; i < 3; i++) {
          const sx = bx + 4 + Math.floor(Math.random() * (T - 10));
          const sy = by + 4 + Math.floor(Math.random() * (T - 10));
          g.fillStyle(0x2a2440, 1).fillRect(sx, sy, 2, 2);
        }
      }
    }
    g.generateTexture("tile_floor", S, S);
    g.destroy();
  }

  // ---- Wall ----
  {
    const T = 32;
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x0a0810, 1).fillRect(0, 0, T, T);
    g.fillStyle(0x2e2743, 1).fillRect(2, 2, T - 4, T - 4);
    g.fillStyle(0x3a3350, 1).fillRect(4, 4, T - 8, T - 8);
    g.fillStyle(0x1a1523, 1).fillRect(4, 12, 8, 2);
    g.fillStyle(0x1a1523, 1).fillRect(16, 22, 10, 2);
    g.fillStyle(0x4a4261, 1).fillRect(4, 4, T - 8, 1);
    g.generateTexture("tile_wall", T, T);
    g.destroy();
  }

  // ---- Torch (small, animated via alpha tween in scene) ----
  {
    const S = 16;
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x000000, 1).fillRect(0, 0, S, S);
    g.fillStyle(0x8a5a1a, 1).fillRect(6, 8, 4, 8);      // wood handle
    g.fillStyle(0xc9a227, 1).fillRect(5, 4, 6, 4);      // flame base
    g.fillStyle(0xe8c547, 1).fillRect(6, 2, 4, 3);      // flame tip
    g.fillStyle(0xfff5c0, 1).fillRect(7, 3, 2, 1);      // hot core
    g.generateTexture("torch", S, S);
    g.destroy();
  }

  // ---- Hero (48×48, knight palette) ----
  drawHero(scene, "hero", 0xc9a227);
  // Additional tinted variants for remote players (server sends avatar id; we map to a hue)
  drawHero(scene, "hero_b", 0x7a8aff);
  drawHero(scene, "hero_c", 0x40916c);
  drawHero(scene, "hero_d", 0xd94444);

  // ---- Monsters (48×48) ----
  drawSlime(scene);
  drawGoblin(scene);
  drawSkeleton(scene);
  drawDarkMage(scene);
  drawBoss(scene);
  drawCorpse(scene, "corpse_slime", 0x2d6a4f);
  drawCorpse(scene, "corpse_goblin", 0x2d6a4f);
  drawCorpse(scene, "corpse_skeleton", 0x6a6a6a);
  drawCorpse(scene, "corpse_dark_mage", 0x4a2f6a);
  drawCorpse(scene, "corpse_boss", 0x6a1a1a);
}

/* ---------------- Hero ---------------- */
function drawHero(scene, key, armorColor) {
  const S = 48;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  // shadow
  g.fillStyle(0x000000, 0.35).fillEllipse(S / 2, S - 5, 28, 8);
  // body armor
  g.fillStyle(armorColor, 1).fillRect(16, 22, 16, 16);
  g.fillStyle(lighten(armorColor, 0.3), 1).fillRect(18, 24, 12, 10);
  // belt
  g.fillStyle(0x5a3d1a, 1).fillRect(16, 34, 16, 3);
  // legs
  g.fillStyle(0x3a2e1e, 1).fillRect(16, 38, 6, 6);
  g.fillStyle(0x3a2e1e, 1).fillRect(26, 38, 6, 6);
  // head skin
  g.fillStyle(0xf5e7b8, 1).fillRect(18, 14, 12, 10);
  // eyes
  g.fillStyle(0x0a0810, 1).fillRect(20, 18, 2, 2);
  g.fillStyle(0x0a0810, 1).fillRect(26, 18, 2, 2);
  // helmet
  g.fillStyle(0x8a8a8a, 1).fillRect(16, 10, 16, 6);
  g.fillStyle(0xc0c0c0, 1).fillRect(16, 10, 16, 2);
  g.fillStyle(0x5a5a5a, 1).fillRect(22, 16, 4, 1);
  // sword
  g.fillStyle(0xc0c0c0, 1).fillRect(34, 20, 3, 18);
  g.fillStyle(0xe8e8e8, 1).fillRect(34, 20, 1, 18);
  g.fillStyle(0x5a3d1a, 1).fillRect(32, 38, 7, 3);
  g.generateTexture(key, S, S);
  g.destroy();
}

/* ---------------- Slime ---------------- */
function drawSlime(scene) {
  const S = 48;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0x000000, 0.35).fillEllipse(S / 2, S - 5, 28, 8);
  g.fillStyle(0x2d6a4f, 1).fillEllipse(S / 2, 32, 34, 22);   // dark outline
  g.fillStyle(0x40916c, 1).fillEllipse(S / 2, 30, 30, 20);
  g.fillStyle(0x52b788, 1).fillEllipse(S / 2 - 4, 26, 12, 8); // highlight
  g.fillStyle(0x0a0810, 1).fillRect(18, 30, 4, 4);
  g.fillStyle(0x0a0810, 1).fillRect(28, 30, 4, 4);
  g.fillStyle(0x0a0810, 1).fillRect(22, 36, 4, 1);
  g.generateTexture("slime", S, S);
  g.destroy();
}

/* ---------------- Goblin ---------------- */
function drawGoblin(scene) {
  const S = 48;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0x000000, 0.35).fillEllipse(S / 2, S - 4, 24, 6);
  // tunic
  g.fillStyle(0x6a3a1a, 1).fillRect(16, 24, 16, 16);
  g.fillStyle(0x8a5a2a, 1).fillRect(18, 26, 12, 8);
  // legs
  g.fillStyle(0x3a2e1e, 1).fillRect(17, 40, 5, 4);
  g.fillStyle(0x3a2e1e, 1).fillRect(26, 40, 5, 4);
  // head (green)
  g.fillStyle(0x4a7a3a, 1).fillRect(18, 12, 12, 12);
  g.fillStyle(0x5a8a4a, 1).fillRect(20, 14, 8, 6);
  // ears
  g.fillStyle(0x4a7a3a, 1).fillRect(15, 16, 3, 4);
  g.fillStyle(0x4a7a3a, 1).fillRect(30, 16, 3, 4);
  // eyes (red)
  g.fillStyle(0xd94444, 1).fillRect(20, 17, 2, 2);
  g.fillStyle(0xd94444, 1).fillRect(26, 17, 2, 2);
  // dagger
  g.fillStyle(0x8a8a8a, 1).fillRect(34, 26, 2, 10);
  g.fillStyle(0x5a3d1a, 1).fillRect(33, 36, 4, 2);
  g.generateTexture("goblin", S, S);
  g.destroy();
}

/* ---------------- Skeleton ---------------- */
function drawSkeleton(scene) {
  const S = 48;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0x000000, 0.35).fillEllipse(S / 2, S - 4, 24, 6);
  // ribcage
  g.fillStyle(0xe8e8e8, 1).fillRect(16, 24, 16, 12);
  g.fillStyle(0xb0b0b0, 1).fillRect(16, 28, 16, 1);
  g.fillStyle(0xb0b0b0, 1).fillRect(16, 32, 16, 1);
  g.fillStyle(0x0a0810, 1).fillRect(22, 26, 4, 8); // spine
  // legs
  g.fillStyle(0xe8e8e8, 1).fillRect(17, 36, 5, 8);
  g.fillStyle(0xe8e8e8, 1).fillRect(26, 36, 5, 8);
  // skull
  g.fillStyle(0xe8e8e8, 1).fillRect(18, 10, 12, 12);
  g.fillStyle(0xb0b0b0, 1).fillRect(18, 10, 12, 1);
  // eye sockets
  g.fillStyle(0x0a0810, 1).fillRect(20, 14, 3, 4);
  g.fillStyle(0x0a0810, 1).fillRect(25, 14, 3, 4);
  // jaw line
  g.fillStyle(0x0a0810, 1).fillRect(21, 19, 6, 1);
  // sword
  g.fillStyle(0xa0a0a0, 1).fillRect(34, 24, 2, 16);
  g.fillStyle(0x5a3d1a, 1).fillRect(32, 38, 6, 2);
  g.generateTexture("skeleton", S, S);
  g.destroy();
}

/* ---------------- Dark Mage ---------------- */
function drawDarkMage(scene) {
  const S = 48;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0x000000, 0.4).fillEllipse(S / 2, S - 4, 28, 6);
  // robe
  g.fillStyle(0x2a1a4a, 1).fillRect(14, 20, 20, 24);
  g.fillStyle(0x3a2a5a, 1).fillRect(16, 22, 16, 20);
  g.fillStyle(0x4a3a6a, 1).fillRect(18, 24, 12, 14);
  // hood
  g.fillStyle(0x2a1a4a, 1).fillRect(16, 8, 16, 14);
  g.fillStyle(0x3a2a5a, 1).fillRect(18, 10, 12, 10);
  // face void
  g.fillStyle(0x0a0810, 1).fillRect(19, 13, 10, 7);
  // glowing eyes
  g.fillStyle(0xe8c547, 1).fillRect(21, 15, 2, 2);
  g.fillStyle(0xe8c547, 1).fillRect(25, 15, 2, 2);
  // staff
  g.fillStyle(0x5a3d1a, 1).fillRect(35, 16, 2, 26);
  g.fillStyle(0x7a8aff, 1).fillRect(33, 12, 6, 6);   // orb
  g.fillStyle(0xaabbff, 1).fillRect(34, 13, 4, 4);
  g.generateTexture("dark_mage", S, S);
  g.destroy();
}

/* ---------------- Boss (dragon) ---------------- */
function drawBoss(scene) {
  const S = 48;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0x000000, 0.4).fillEllipse(S / 2, S - 3, 36, 8);
  // wings
  g.fillStyle(0x6a1a1a, 1).fillRect(4, 16, 10, 18);
  g.fillStyle(0x6a1a1a, 1).fillRect(34, 16, 10, 18);
  g.fillStyle(0x8a2a2a, 1).fillRect(6, 18, 6, 12);
  g.fillStyle(0x8a2a2a, 1).fillRect(36, 18, 6, 12);
  // body
  g.fillStyle(0xa83232, 1).fillRect(14, 16, 20, 26);
  g.fillStyle(0xc94444, 1).fillRect(16, 20, 16, 18);
  g.fillStyle(0xd94444, 1).fillRect(18, 24, 12, 10);
  // horns
  g.fillStyle(0x0a0810, 1).fillRect(16, 8, 3, 8);
  g.fillStyle(0x0a0810, 1).fillRect(29, 8, 3, 8);
  // head
  g.fillStyle(0xa83232, 1).fillRect(18, 10, 12, 10);
  // eyes
  g.fillStyle(0xe8c547, 1).fillRect(20, 13, 3, 3);
  g.fillStyle(0xe8c547, 1).fillRect(25, 13, 3, 3);
  // teeth
  g.fillStyle(0xf5e7b8, 1).fillRect(20, 18, 2, 2);
  g.fillStyle(0xf5e7b8, 1).fillRect(23, 18, 2, 2);
  g.fillStyle(0xf5e7b8, 1).fillRect(26, 18, 2, 2);
  g.generateTexture("boss", S, S);
  g.destroy();
}

/* ---------------- Corpse (defeated marker) ---------------- */
function drawCorpse(scene, key, baseColor) {
  const S = 48;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0x000000, 0.5).fillEllipse(S / 2, S - 6, 30, 8);
  g.fillStyle(baseColor, 0.5).fillRect(10, S - 16, 28, 6);
  g.fillStyle(0x0a0810, 0.6).fillRect(14, S - 15, 4, 4);
  g.fillStyle(0x0a0810, 0.6).fillRect(20, S - 15, 4, 4);
  g.generateTexture(key, S, S);
  g.destroy();
}

function lighten(hex, amt) {
  const r = Math.min(255, ((hex >> 16) & 0xff) + Math.floor(255 * amt));
  const g = Math.min(255, ((hex >> 8) & 0xff) + Math.floor(255 * amt));
  const b = Math.min(255, (hex & 0xff) + Math.floor(255 * amt));
  return (r << 16) | (g << 8) | b;
}