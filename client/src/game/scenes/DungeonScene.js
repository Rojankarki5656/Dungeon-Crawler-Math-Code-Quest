import Phaser from "phaser";
import { bridge } from "../bridge";
import {
  TILE, MAP_W, MAP_H, PLAYER_START, generateMap, assignMonsterPositions,
} from "../mapGenerator";

const MOVE_SPEED = 180;
const EMIT_INTERVAL_MS = 66;   // ~15 Hz
const INTERACT_RANGE = 72;     // ~2 tiles

export class DungeonScene extends Phaser.Scene {
  constructor() { super("Dungeon"); }

  init(data) {
    this.roomData = data.room;
    this.user = data.user;
    this.socket = data.socket;
    this.grid = generateMap();
    this.monsters = new Map(); // instanceId → { sprite, hpBar, data }
    this.remotes = new Map();  // userId → { sprite, nameTag }
    this.nearInstanceId = null;
    this.lastEmit = 0;
    this.inputLocked = false;
  }

  create() {
    const worldW = MAP_W * TILE;
    const worldH = MAP_H * TILE;

    // Floor — single tiled background sprite
    this.add.tileSprite(0, 0, worldW, worldH, "tile_floor").setOrigin(0).setDepth(-10);

    // Walls — static group
    const walls = this.physics.add.staticGroup();
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        if (this.grid[y][x] === 1) {
          walls.create(x * TILE + TILE / 2, y * TILE + TILE / 2, "tile_wall");
        }
      }
    }

    // Decorative torches on border walls
    this.addTorch(TILE / 2 + 0,             TILE / 2 + 16);
    this.addTorch(worldW - TILE / 2,        TILE / 2 + 16);
    this.addTorch(TILE / 2,                 worldH - TILE / 2 - 16);
    this.addTorch(worldW - TILE / 2,        worldH - TILE / 2 - 16);
    this.addTorch(worldW / 2,               TILE / 2 + 16);

    // Player
    const startX = PLAYER_START.x * TILE + TILE / 2;
    const startY = PLAYER_START.y * TILE + TILE / 2;
    this.player = this.physics.add.sprite(startX, startY, "hero");
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(22, 16);
    this.player.body.setOffset(13, 28);
    this.physics.add.collider(this.player, walls);

    // Player name label
    this.playerName = this.add.text(startX, startY - 34, this.user.username, {
      fontFamily: "monospace", fontSize: "10px", color: "#c9a227",
      backgroundColor: "#0a0810cc", padding: { x: 4, y: 2 },
    }).setOrigin(0.5).setDepth(100);

    // Camera
    this.physics.world.setBounds(0, 0, worldW, worldH);
    this.cameras.main.setBounds(0, 0, worldW, worldH);
    this.cameras.main.startFollow(this.player, true, 0.15, 0.15);
    this.cameras.main.setZoom(1.25);

    // Input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys("W,A,S,D");
    this.space = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.space.on("down", () => {
      if (!this.inputLocked && this.nearInstanceId) {
        bridge.emit("request-fight", { instanceId: this.nearInstanceId });
      }
    });

    // Monsters — deterministic placement
    const positioned = assignMonsterPositions(this.grid, this.roomData.code, this.roomData.monsters || []);
    for (const m of positioned) this.spawnMonster(m);

    // Remote players (from room state on first join)
    for (const p of this.roomData.players || []) {
      const pUser = p.user;
      if (!pUser) continue;
      const id = String(pUser._id || pUser);
      if (id === String(this.user._id)) continue;
      this.addRemote(id, pUser, { x: startX, y: startY });
    }

    // Bridge listeners
    this._unsubs = [
      bridge.on("combat-open", () => { this.inputLocked = true; this.player.body.setVelocity(0); }),
      bridge.on("combat-close", () => { this.inputLocked = false; }),
      bridge.on("monster-updated", (p) => this.onMonsterUpdated(p)),
      bridge.on("monster-defeated", (p) => this.onMonsterDefeated(p)),
      bridge.on("remote-moved", (p) => this.onRemoteMoved(p)),
      bridge.on("remote-joined", (p) => this.onRemoteJoined(p)),
      bridge.on("remote-left", (p) => this.onRemoteLeft(p)),
    ];

    // Socket listeners (live in scene so movement is self-contained)
    const sock = this.socket;
    this._onSockMoved = (p) => this.onRemoteMoved(p);
    this._onSockJoined = (p) => this.onRemoteJoined(p);
    this._onSockLeft = (p) => this.onRemoteLeft(p);
    sock.on("player:moved", this._onSockMoved);
    sock.on("player:joined", this._onSockJoined);
    sock.on("player:left", this._onSockLeft);

    this.events.once("shutdown", () => this.cleanup());
  }

  addTorch(x, y) {
    const t = this.add.image(x, y, "torch").setDepth(50);
    this.tweens.add({
      targets: t,
      alpha: { from: 1, to: 0.55 },
      duration: 250 + Math.random() * 200,
      yoyo: true,
      repeat: -1,
    });
    // Warm glow
    const glow = this.add.circle(x, y, 26, 0xffcc66, 0.12).setDepth(49);
    this.tweens.add({
      targets: glow,
      scale: { from: 1, to: 1.15 },
      alpha: { from: 0.12, to: 0.06 },
      duration: 800 + Math.random() * 400,
      yoyo: true, repeat: -1,
    });
  }

  spawnMonster(m) {
    const spriteKey = m.spriteKey || "slime";
    const x = (m.tileX ?? 5) * TILE + TILE / 2;
    const y = (m.tileY ?? 5) * TILE + TILE / 2;
    const sprite = this.add.sprite(x, y, spriteKey).setDepth(10);
    sprite.setData("instanceId", m.instanceId);

    const name = this.add.text(x, y - 30, m.name, {
      fontFamily: "monospace", fontSize: "9px", color: "#e8c547",
      backgroundColor: "#0a081099", padding: { x: 3, y: 1 },
    }).setOrigin(0.5).setDepth(99);

    const hpBar = this.add.graphics().setDepth(98);
    this.drawHpBar(hpBar, x, y + 26, m.currentHp, m.maxHp);

    if (m.defeated) {
      sprite.setTexture(`corpse_${spriteKey}`);
      name.setAlpha(0.4);
      hpBar.setAlpha(0);
    } else {
      // idle bob
      this.tweens.add({
        targets: sprite,
        y: y - 4,
        duration: 900 + Math.random() * 400,
        yoyo: true, repeat: -1, ease: "Sine.easeInOut",
      });
    }

    this.monsters.set(m.instanceId, {
      sprite, nameTag: name, hpBar, data: { ...m, x, y },
    });
  }

  drawHpBar(g, cx, y, current, max) {
    g.clear();
    if (current <= 0 || max <= 0) return;
    const w = 34, h = 4, x = cx - w / 2;
    g.fillStyle(0x0a0810, 1).fillRect(x - 1, y - 1, w + 2, h + 2);
    g.fillStyle(0x2e2743, 1).fillRect(x, y, w, h);
    const pct = Math.max(0, Math.min(1, current / max));
    const color = pct > 0.5 ? 0x40916c : pct > 0.25 ? 0xc9a227 : 0xa83232;
    g.fillStyle(color, 1).fillRect(x, y, Math.max(0, Math.round(w * pct)), h);
  }

  addRemote(userId, user, position) {
    const key = this.pickHeroTexture(userId);
    const sprite = this.add.sprite(position.x, position.y, key).setDepth(9).setAlpha(0.9);
    const tag = this.add.text(position.x, position.y - 34, user.username, {
      fontFamily: "monospace", fontSize: "9px", color: "#7a8aff",
      backgroundColor: "#0a081099", padding: { x: 3, y: 1 },
    }).setOrigin(0.5).setDepth(99);
    this.remotes.set(String(userId), { sprite, tag, username: user.username });
    this.tweens.add({
      targets: sprite, y: position.y - 3,
      duration: 900, yoyo: true, repeat: -1, ease: "Sine.easeInOut",
    });
  }

  pickHeroTexture(userId) {
    const keys = ["hero_b", "hero_c", "hero_d"];
    let h = 0;
    for (let i = 0; i < userId.length; i++) h = (h * 31 + userId.charCodeAt(i)) >>> 0;
    return keys[h % keys.length];
  }

  onMonsterUpdated({ instanceId, currentHp, maxHp, defeated }) {
    const mon = this.monsters.get(instanceId);
    if (!mon) return;
    mon.data.currentHp = currentHp;
    mon.data.maxHp = maxHp;
    this.drawHpBar(mon.hpBar, mon.data.x, mon.data.y + 26, currentHp, maxHp);
    if (defeated) this.onMonsterDefeated({ instanceId });
    else {
      // brief hit flash
      mon.sprite.setTint(0xff6666);
      this.time.delayedCall(120, () => mon.sprite.clearTint());
    }
  }

  onMonsterDefeated({ instanceId }) {
    const mon = this.monsters.get(instanceId);
    if (!mon || mon.data.defeated) return;
    mon.data.defeated = true;
    mon.sprite.setTexture(`corpse_${mon.data.spriteKey || "slime"}`);
    mon.sprite.setAlpha(0.6);
    mon.nameTag.setAlpha(0.4);
    mon.hpBar.setAlpha(0);
    mon.sprite.clearTint();

    // detect room clear
    const anyAlive = [...this.monsters.values()].some((m) => !m.data.defeated);
    if (!anyAlive) bridge.emit("dungeon-cleared", {});
  }

  onRemoteMoved({ userId, x, y }) {
    const r = this.remotes.get(String(userId));
    if (!r) return;
    // smooth to target so remote movement doesn't teleport
    this.tweens.add({ targets: r.sprite, x, y, duration: 100, ease: "Linear" });
    r.tag.setPosition(x, y - 34);
  }

  onRemoteJoined(payload) {
    const u = payload.user || {};
    const id = u.id || u._id;
    if (!id || String(id) === String(this.user._id)) return;
    if (this.remotes.has(String(id))) return;
    const position = payload.position || { x: 0, y: 0 };
    this.addRemote(String(id), { username: u.username || "Hero" }, position);
  }

  onRemoteLeft({ userId }) {
    const r = this.remotes.get(String(userId));
    if (!r) return;
    r.sprite.destroy();
    r.tag.destroy();
    this.remotes.delete(String(userId));
  }

  update() {
    if (!this.player) return;

    // Movement
    const vx = (this.cursors.left.isDown || this.wasd.A.isDown) ? -1
              : (this.cursors.right.isDown || this.wasd.D.isDown) ? 1 : 0;
    const vy = (this.cursors.up.isDown || this.wasd.W.isDown) ? -1
              : (this.cursors.down.isDown || this.wasd.S.isDown) ? 1 : 0;

    if (this.inputLocked) {
      this.player.body.setVelocity(0);
    } else if (vx !== 0 || vy !== 0) {
      const len = Math.hypot(vx, vy) || 1;
      this.player.body.setVelocity((vx / len) * MOVE_SPEED, (vy / len) * MOVE_SPEED);
      // Face left/right by flipping
      if (vx !== 0) this.player.setFlipX(vx < 0);
    } else {
      this.player.body.setVelocity(0);
    }

    this.playerName.setPosition(this.player.x, this.player.y - 34);

    // Throttled position emit
    const now = this.time.now;
    if (now - this.lastEmit > EMIT_INTERVAL_MS) {
      this.lastEmit = now;
      this.socket.emit("player:move", { x: this.player.x, y: this.player.y });
    }

    // Monster proximity
    let nearest = null, bestDist = Infinity;
    for (const [id, mon] of this.monsters) {
      if (mon.data.defeated) continue;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, mon.data.x, mon.data.y);
      if (d < INTERACT_RANGE && d < bestDist) { bestDist = d; nearest = { id, name: mon.data.name }; }
    }
    if (nearest && this.nearInstanceId !== nearest.id) {
      this.nearInstanceId = nearest.id;
      bridge.emit("near-monster", { instanceId: nearest.id, name: nearest.name });
    } else if (!nearest && this.nearInstanceId) {
      this.nearInstanceId = null;
      bridge.emit("leave-monster", {});
    }
  }

  cleanup() {
    const sock = this.socket;
    if (sock) {
      sock.off("player:moved", this._onSockMoved);
      sock.off("player:joined", this._onSockJoined);
      sock.off("player:left", this._onSockLeft);
    }
    this._unsubs?.forEach((off) => off());
    this._unsubs = [];
  }
}