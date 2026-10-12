"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDungeon = generateDungeon;
var game_constants_1 = require("../../common/constants/game.constants");
var prng_1 = require("../../common/utils/prng");
/**
 * Deterministic rooms-and-corridors generator.
 * Same seed => identical map on every client & every server restart.
 */
function generateDungeon(seed) {
    var rng = new prng_1.Rng(seed);
    var width = game_constants_1.MAP.WIDTH;
    var height = game_constants_1.MAP.HEIGHT;
    var tiles = new Array(width * height).fill(game_constants_1.TILE.WALL);
    var idx = function (x, y) { return y * width + x; };
    var rooms = [];
    var overlaps = function (a, b) {
        return a.x - 1 < b.x + b.w + 1 && a.x + a.w + 1 > b.x - 1 &&
            a.y - 1 < b.y + b.h + 1 && a.y + a.h + 1 > b.y - 1;
    };
    var carveRoom = function (r) {
        for (var y = r.y; y < r.y + r.h; y++)
            for (var x = r.x; x < r.x + r.w; x++)
                tiles[idx(x, y)] = game_constants_1.TILE.FLOOR;
    };
    var carveCorridor = function (a, b) {
        var x = a.x, y = a.y;
        var horizFirst = rng.chance(0.5);
        var stepX = function () { while (x !== b.x) {
            x += Math.sign(b.x - x);
            tiles[idx(x, y)] = game_constants_1.TILE.FLOOR;
        } };
        var stepY = function () { while (y !== b.y) {
            y += Math.sign(b.y - y);
            tiles[idx(x, y)] = game_constants_1.TILE.FLOOR;
        } };
        if (horizFirst) {
            stepX();
            stepY();
        }
        else {
            stepY();
            stepX();
        }
    };
    var _loop_1 = function (attempt) {
        var w = rng.int(game_constants_1.MAP.MIN_ROOM, game_constants_1.MAP.MAX_ROOM);
        var h = rng.int(game_constants_1.MAP.MIN_ROOM, game_constants_1.MAP.MAX_ROOM);
        var x = rng.int(1, width - w - 2);
        var y = rng.int(1, height - h - 2);
        var candidate = { x: x, y: y, w: w, h: h };
        if (rooms.some(function (r) { return overlaps(r, candidate); }))
            return "continue";
        rooms.push(candidate);
        carveRoom(candidate);
    };
    // --- Place rooms ------------------------------------------------------
    for (var attempt = 0; attempt < 220 && rooms.length < game_constants_1.MAP.MAX_ROOMS; attempt++) {
        _loop_1(attempt);
    }
    // --- Connect rooms ----------------------------------------------------
    for (var i = 1; i < rooms.length; i++) {
        var a = rooms[i - 1], b = rooms[i];
        carveCorridor({ x: Math.floor(a.x + a.w / 2), y: Math.floor(a.y + a.h / 2) }, { x: Math.floor(b.x + b.w / 2), y: Math.floor(b.y + b.h / 2) });
    }
    // Extra loops so the map isn't a pure tree (better exploration feel).
    for (var i = 0; i < 3 && rooms.length > 3; i++) {
        var a = rng.pick(rooms), b = rng.pick(rooms);
        carveCorridor({ x: Math.floor(a.x + a.w / 2), y: Math.floor(a.y + a.h / 2) }, { x: Math.floor(b.x + b.w / 2), y: Math.floor(b.y + b.h / 2) });
    }
    var spawn = {
        x: Math.floor(rooms[0].x + rooms[0].w / 2),
        y: Math.floor(rooms[0].y + rooms[0].h / 2),
    };
    var last = rooms[rooms.length - 1];
    var exit = {
        x: Math.floor(last.x + last.w / 2),
        y: Math.floor(last.y + last.h / 2),
    };
    tiles[idx(exit.x, exit.y)] = game_constants_1.TILE.EXIT;
    // --- Populate ---------------------------------------------------------
    var floorTiles = [];
    for (var y = 1; y < height - 1; y++)
        for (var x = 1; x < width - 1; x++)
            if (tiles[idx(x, y)] === game_constants_1.TILE.FLOOR)
                floorTiles.push({ x: x, y: y });
    var takeFloor = function (minDistFromSpawn) {
        if (minDistFromSpawn === void 0) { minDistFromSpawn = 6; }
        for (var i = 0; i < 400; i++) {
            var t = rng.pick(floorTiles);
            if (Math.abs(t.x - spawn.x) + Math.abs(t.y - spawn.y) < minDistFromSpawn)
                continue;
            if (tiles[idx(t.x, t.y)] !== game_constants_1.TILE.FLOOR)
                continue;
            return t;
        }
        return null;
    };
    for (var i = 0; i < game_constants_1.MAP.MONSTER_COUNT; i++) {
        var t = takeFloor(7);
        if (t)
            tiles[idx(t.x, t.y)] = game_constants_1.TILE.MONSTER;
    }
    for (var i = 0; i < game_constants_1.MAP.DOOR_COUNT; i++) {
        var t = takeFloor(9);
        if (t)
            tiles[idx(t.x, t.y)] = game_constants_1.TILE.DOOR;
    }
    for (var i = 0; i < game_constants_1.MAP.CHEST_COUNT; i++) {
        var t = takeFloor(5);
        if (t)
            tiles[idx(t.x, t.y)] = game_constants_1.TILE.CHEST;
    }
    return { seed: seed, width: width, height: height, tiles: tiles, spawn: spawn, exit: exit };
}
