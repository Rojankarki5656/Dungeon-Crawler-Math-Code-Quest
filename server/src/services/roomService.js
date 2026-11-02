import { customAlphabet } from "nanoid";
import { GameRoom } from "../models/GameRoom.js";
import { GameSession } from "../models/GameSession.js";
import { User } from "../models/User.js";
import { assertCanEnter, pickMonsterPool } from "./dungeonService.js";
import { NotFoundError, GameStateError, AuthorizationError } from "../errors/index.js";
import { eventBus } from "../events/eventBus.js";
import { EVENTS } from "../events/eventTypes.js";

const codeGen = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);
const MAX_PLAYERS = 4;

async function _uniqueCode() {
  for (let i = 0; i < 8; i++) {
    const code = codeGen();
    if (!(await GameRoom.exists({ code }))) return code;
  }
  throw new GameStateError("Could not allocate room code, try again");
}

async function _spawnMonsters(dungeonId) {
  const pool = await pickMonsterPool(dungeonId);
  if (!pool.length) return [];
  const count = 3 + Math.floor(Math.random() * 3);
  return Array.from({ length: count }, (_, i) => {
    const m = pool[Math.floor(Math.random() * pool.length)];
    return {
      instanceId: codeGen() + codeGen(),
      monsterId: m._id,
      name: m.name,
      maxHp: m.maxHp,
      currentHp: m.maxHp,
      damage: m.damage,
      xpReward: m.xpReward,
      coinReward: m.coinReward,
      difficulty: m.difficulty,
      spriteKey: m.spriteKey,
      x: (i % 3) * 220 - 220,
      y: Math.floor(i / 3) * 220 - 110,
    };
  });
}

export async function createRoom(ownerId, { dungeonId, isPrivate = false, soloMode = false }) {
  const dungeon = await assertCanEnter(ownerId, dungeonId);
  const owner = await User.findById(ownerId);
  if (!owner) throw new NotFoundError("User not found");

  if (soloMode) {
    // Auto-resume the user's existing solo room in this dungeon (paused or live)
    const existing = await GameRoom.findOne({
      owner: ownerId,
      dungeon: dungeon._id,
      soloMode: true,
      status: { $in: ["WAITING", "ACTIVE"] },
    });
    if (existing) {
      if (existing.pausedAt) {
        existing.pausedAt = null;
        await existing.save();
      }
      return existing;
    }
  } else {
    // Multiplayer: reject if user is already in another multiplayer room
    const existingMP = await GameRoom.findOne({
      "players.user": ownerId,
      soloMode: false,
      status: { $in: ["WAITING", "ACTIVE"] },
    });
    if (existingMP) {
      throw new GameStateError(`Already in room ${existingMP.code}`);
    }
  }

  const code = await _uniqueCode();
  const monsters = await _spawnMonsters(dungeon._id);
  const room = await GameRoom.create({
    code,
    owner: ownerId,
    dungeon: dungeon._id,
    isPrivate: soloMode || isPrivate, // solo rooms never show in lobby
    soloMode,
    status: "WAITING",
    monsters,
    players: [{ user: owner._id, health: owner.health, level: owner.level, x: 0, y: 0 }],
  });

  await GameSession.create({
    players: [owner._id],
    dungeon: dungeon._id,
    room: room._id,
  });

  return room;
}

export async function joinRoom(userId, code) {
  const room = await GameRoom.findOne({ code: code.toUpperCase() });
  if (!room) throw new NotFoundError("Room not found");

  // Solo rooms are owner-only
  if (room.soloMode && String(room.owner) !== String(userId)) {
    throw new AuthorizationError("This room is private to its owner");
  }

  if (room.status !== "WAITING") throw new GameStateError("Room not accepting players");
  if (room.players.some((p) => String(p.user) === String(userId))) {
    return room; // idempotent re-join (also handles solo resume)
  }
  if (room.players.length >= MAX_PLAYERS) throw new GameStateError("Room is full");

  const user = await User.findById(userId);
  if (!user) throw new NotFoundError("User not found");

  await assertCanEnter(userId, room.dungeon);

  room.players.push({
    user: user._id, health: user.health, level: user.level, x: 0, y: 0,
  });
  await room.save();

  await GameSession.updateOne(
    { room: room._id, status: "ACTIVE" },
    { $addToSet: { players: user._id } }
  );

  await eventBus.emitAsync(EVENTS.PLAYER_JOINED_DUNGEON, {
    userId, roomId: room._id, code: room.code,
  });
  return room;
}

export async function leaveRoom(userId, code) {
  const room = await GameRoom.findOne({ code: code.toUpperCase() });
  if (!room) throw new NotFoundError("Room not found");

  // Solo mode: pause the room, keep everything intact for a later resume.
  // Player stays in `players` so the socket `room:join` guard still lets them back in.
  if (room.soloMode) {
    if (String(room.owner) !== String(userId)) {
      throw new AuthorizationError("Not your room");
    }
    room.pausedAt = new Date();
    await room.save();
    await eventBus.emitAsync(EVENTS.PLAYER_LEFT_DUNGEON, { userId, roomId: room._id });
    return { code: room.code, closed: false, paused: true };
  }

  // Multiplayer: existing behaviour
  const idx = room.players.findIndex((p) => String(p.user) === String(userId));
  if (idx === -1) return room;

  room.players.splice(idx, 1);

  if (room.players.length === 0) {
    room.status = "FINISHED";
    await room.save();
    await GameSession.updateOne(
      { room: room._id, status: "ACTIVE" },
      { status: "ABANDONED", endTime: new Date() }
    );
    await eventBus.emitAsync(EVENTS.PLAYER_LEFT_DUNGEON, { userId, roomId: room._id });
    return { code: room.code, closed: true };
  }

  if (String(room.owner) === String(userId)) {
    room.owner = room.players[0].user;
  }
  await room.save();
  await GameSession.updateOne(
    { room: room._id, status: "ACTIVE" },
    { $pull: { players: userId } }
  );
  await eventBus.emitAsync(EVENTS.PLAYER_LEFT_DUNGEON, {
    userId, roomId: room._id, code: room.code,
  });
  return { code: room.code, closed: false };
}

export async function getRoomByCode(code) {
  const room = await GameRoom.findOne({ code: code.toUpperCase() })
    .populate("players.user", "username avatar level health maxHealth")
    .populate("dungeon")
    .populate("owner", "username avatar")
    .lean();
  if (!room) throw new NotFoundError("Room not found");
  return room;
}

export async function listOpenRooms() {
  return GameRoom.find({ status: "WAITING", isPrivate: false, soloMode: false })
    .populate("dungeon", "name slug difficulty")
    .populate("owner", "username avatar")
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
}