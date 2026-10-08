"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DungeonService = void 0;
var common_1 = require("@nestjs/common");
var map_generator_1 = require("./map.generator");
var game_constants_1 = require("../../common/constants/game.constants");
var prng_1 = require("../../common/utils/prng");
var DungeonService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var DungeonService = _classThis = /** @class */ (function () {
        function DungeonService_1(redis) {
            this.redis = redis;
        }
        DungeonService_1.prototype.createForLobby = function (lobbyId, seed) {
            return __awaiter(this, void 0, void 0, function () {
                var map, monsters;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            map = (0, map_generator_1.generateDungeon)(seed);
                            monsters = this.spawnMonsters(map, seed);
                            return [4 /*yield*/, this.redis.setJson(this.redis.key('map', lobbyId), map)];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, this.redis.setJson(this.redis.key('monsters', lobbyId), monsters)];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, { map: map, monsters: monsters }];
                    }
                });
            });
        };
        DungeonService_1.prototype.getMap = function (lobbyId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.redis.getJson(this.redis.key('map', lobbyId))];
                });
            });
        };
        DungeonService_1.prototype.getMonsters = function (lobbyId) {
            return __awaiter(this, void 0, void 0, function () {
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.redis.getJson(this.redis.key('monsters', lobbyId))];
                        case 1: return [2 /*return*/, (_a = (_b.sent())) !== null && _a !== void 0 ? _a : []];
                    }
                });
            });
        };
        DungeonService_1.prototype.saveMonsters = function (lobbyId, monsters) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.redis.setJson(this.redis.key('monsters', lobbyId), monsters)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        /** Returns the tile at (x,y), or null when out of bounds. */
        DungeonService_1.prototype.tileAt = function (map, x, y) {
            if (x < 0 || y < 0 || x >= map.width || y >= map.height)
                return null;
            return map.tiles[y * map.width + x];
        };
        DungeonService_1.prototype.isWalkable = function (map, x, y) {
            var t = this.tileAt(map, x, y);
            return t !== null && t !== game_constants_1.TILE.WALL;
        };
        DungeonService_1.prototype.monsterAt = function (monsters, x, y) {
            return monsters.find(function (m) { return m.x === x && m.y === y && m.hp > 0; });
        };
        DungeonService_1.prototype.killMonster = function (lobbyId, monsterId) {
            return __awaiter(this, void 0, void 0, function () {
                var monsters, target, map, i;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getMonsters(lobbyId)];
                        case 1:
                            monsters = _a.sent();
                            target = monsters.find(function (m) { return m.id === monsterId; });
                            if (!target)
                                return [2 /*return*/, null];
                            target.hp = 0;
                            return [4 /*yield*/, this.saveMonsters(lobbyId, monsters)];
                        case 2:
                            _a.sent();
                            return [4 /*yield*/, this.getMap(lobbyId)];
                        case 3:
                            map = _a.sent();
                            if (!map) return [3 /*break*/, 5];
                            i = target.y * map.width + target.x;
                            if (map.tiles[i] === game_constants_1.TILE.MONSTER)
                                map.tiles[i] = game_constants_1.TILE.FLOOR;
                            return [4 /*yield*/, this.redis.setJson(this.redis.key('map', lobbyId), map)];
                        case 4:
                            _a.sent();
                            _a.label = 5;
                        case 5: return [2 /*return*/, target];
                    }
                });
            });
        };
        DungeonService_1.prototype.spawnMonsters = function (map, seed) {
            var rng = new prng_1.Rng(seed ^ 0x9e3779b9);
            var monsters = [];
            for (var y = 0; y < map.height; y++) {
                var _loop_1 = function (x) {
                    if (map.tiles[y * map.width + x] !== game_constants_1.TILE.MONSTER)
                        return "continue";
                    // Difficulty scales with distance from spawn.
                    var dist = Math.abs(x - map.spawn.x) + Math.abs(y - map.spawn.y);
                    var tier = dist > 30 ? 3 : dist > 18 ? 2 : 1;
                    var pool = game_constants_1.MONSTER_ARCHETYPES.filter(function (a) { return a.difficulty <= tier; });
                    var archetype = rng.pick(pool.length ? pool : game_constants_1.MONSTER_ARCHETYPES);
                    var variance = rng.float(0.9, 1.15);
                    var hp = Math.round(archetype.hp * variance);
                    monsters.push({
                        id: "m-".concat(x, "-").concat(y),
                        archetype: archetype.id,
                        name: archetype.name,
                        x: x,
                        y: y,
                        hp: hp,
                        maxHp: hp,
                        damage: archetype.damage,
                        difficulty: archetype.difficulty,
                        color: archetype.color,
                    });
                };
                for (var x = 0; x < map.width; x++) {
                    _loop_1(x);
                }
            }
            return monsters;
        };
        return DungeonService_1;
    }());
    __setFunctionName(_classThis, "DungeonService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        DungeonService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return DungeonService = _classThis;
}();
exports.DungeonService = DungeonService;
