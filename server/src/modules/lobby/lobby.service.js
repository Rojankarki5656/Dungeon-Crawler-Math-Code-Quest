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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LobbyService = void 0;
var common_1 = require("@nestjs/common");
var crypto_1 = require("crypto");
var game_constants_1 = require("../../common/constants/game.constants");
var topics_1 = require("../../common/constants/topics");
var LobbyService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var LobbyService = _classThis = /** @class */ (function () {
        function LobbyService_1(redis, broker, dungeon) {
            this.redis = redis;
            this.broker = broker;
            this.dungeon = dungeon;
            this.logger = new common_1.Logger(LobbyService.name);
        }
        LobbyService_1.prototype.createLobby = function (name, hostId, hostName) {
            return __awaiter(this, void 0, void 0, function () {
                var id, seed, _a, map, monsters, host, lobby;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            id = (0, crypto_1.randomUUID)().slice(0, 8);
                            seed = Math.floor(Math.random() * Math.pow(2, 31));
                            return [4 /*yield*/, this.dungeon.createForLobby(id, seed)];
                        case 1:
                            _a = _b.sent(), map = _a.map, monsters = _a.monsters;
                            host = {
                                id: hostId,
                                name: hostName,
                                x: map.spawn.x,
                                y: map.spawn.y,
                                hp: game_constants_1.PLAYER.MAX_HP,
                                maxHp: game_constants_1.PLAYER.MAX_HP,
                                score: game_constants_1.PLAYER.START_SCORE,
                                lobbyId: id,
                                connected: true,
                                lastSeq: 0,
                            };
                            lobby = {
                                id: id,
                                name: name,
                                hostId: hostId,
                                players: [host],
                                map: map,
                                monsters: monsters,
                                status: 'waiting',
                                createdAt: Date.now(),
                            };
                            return [4 /*yield*/, this.persist(lobby)];
                        case 2:
                            _b.sent();
                            return [4 /*yield*/, this.redis.hsetJson(this.redis.key('player', hostId), 'state', host, 7200)];
                        case 3:
                            _b.sent();
                            return [4 /*yield*/, this.publishChange(lobby, 'lobby.created')];
                        case 4:
                            _b.sent();
                            this.logger.log("Lobby ".concat(id, " created by ").concat(hostName));
                            return [2 /*return*/, lobby];
                    }
                });
            });
        };
        LobbyService_1.prototype.joinLobby = function (lobbyId, playerId, playerName) {
            return __awaiter(this, void 0, void 0, function () {
                var lobby, player, spawn;
                var _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, this.getLobby(lobbyId)];
                        case 1:
                            lobby = _c.sent();
                            if (!lobby)
                                throw new common_1.NotFoundException('Lobby not found');
                            player = lobby.players.find(function (p) { return p.id === playerId; });
                            if (player) {
                                player.connected = true;
                                player.name = playerName;
                            }
                            else {
                                spawn = (_b = (_a = lobby.map) === null || _a === void 0 ? void 0 : _a.spawn) !== null && _b !== void 0 ? _b : { x: 1, y: 1 };
                                player = {
                                    id: playerId, name: playerName,
                                    x: spawn.x, y: spawn.y,
                                    hp: game_constants_1.PLAYER.MAX_HP, maxHp: game_constants_1.PLAYER.MAX_HP,
                                    score: game_constants_1.PLAYER.START_SCORE,
                                    lobbyId: lobbyId,
                                    connected: true, lastSeq: 0,
                                };
                                lobby.players.push(player);
                            }
                            if (lobby.status === 'waiting' && lobby.players.length >= 1)
                                lobby.status = 'running';
                            return [4 /*yield*/, this.persist(lobby)];
                        case 2:
                            _c.sent();
                            return [4 /*yield*/, this.redis.hsetJson(this.redis.key('player', playerId), 'state', player, 7200)];
                        case 3:
                            _c.sent();
                            return [4 /*yield*/, this.publishChange(lobby, 'lobby.joined')];
                        case 4:
                            _c.sent();
                            return [2 /*return*/, lobby];
                    }
                });
            });
        };
        LobbyService_1.prototype.leaveLobby = function (lobbyId, playerId) {
            return __awaiter(this, void 0, void 0, function () {
                var lobby, player;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getLobby(lobbyId)];
                        case 1:
                            lobby = _a.sent();
                            if (!lobby)
                                return [2 /*return*/];
                            player = lobby.players.find(function (p) { return p.id === playerId; });
                            if (player)
                                player.connected = false;
                            return [4 /*yield*/, this.persist(lobby)];
                        case 2:
                            _a.sent();
                            return [4 /*yield*/, this.publishChange(lobby, 'lobby.left')];
                        case 3:
                            _a.sent();
                            return [4 /*yield*/, this.broker.publish(topics_1.TOPICS.PLAYER_LEFT, { lobbyId: lobbyId, playerId: playerId }, { safe: true })];
                        case 4:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        LobbyService_1.prototype.getLobby = function (lobbyId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.redis.getJson(this.redis.key('lobby', lobbyId))];
                });
            });
        };
        LobbyService_1.prototype.getPlayer = function (playerId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.redis.hgetJson(this.redis.key('player', playerId), 'state')];
                });
            });
        };
        LobbyService_1.prototype.savePlayer = function (player) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.redis.hsetJson(this.redis.key('player', player.id), 'state', player, 7200)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        LobbyService_1.prototype.updatePlayerInLobby = function (lobbyId, player) {
            return __awaiter(this, void 0, void 0, function () {
                var lobby, i;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getLobby(lobbyId)];
                        case 1:
                            lobby = _a.sent();
                            if (!lobby)
                                return [2 /*return*/];
                            i = lobby.players.findIndex(function (p) { return p.id === player.id; });
                            if (i >= 0)
                                lobby.players[i] = player;
                            else
                                lobby.players.push(player);
                            return [4 /*yield*/, this.persist(lobby)];
                        case 2:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        LobbyService_1.prototype.leaderboard = function (lobbyId) {
            return __awaiter(this, void 0, void 0, function () {
                var lobby;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getLobby(lobbyId)];
                        case 1:
                            lobby = _a.sent();
                            if (!lobby)
                                return [2 /*return*/, []];
                            return [2 /*return*/, __spreadArray([], lobby.players, true).sort(function (a, b) { return b.score - a.score || b.hp - a.hp; })
                                    .slice(0, 10)
                                    .map(function (p, i) { return ({ rank: i + 1, id: p.id, name: p.name, score: p.score, hp: p.hp }); })];
                    }
                });
            });
        };
        LobbyService_1.prototype.persist = function (lobby) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.redis.setJson(this.redis.key('lobby', lobby.id), lobby, 7200)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        LobbyService_1.prototype.publishChange = function (lobby, reason) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.broker.publish(topics_1.TOPICS.LOBBY_STATE_CHANGED, {
                                lobbyId: lobby.id,
                                reason: reason,
                                players: lobby.players,
                                status: lobby.status,
                                at: Date.now(),
                            }, { safe: true })];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        return LobbyService_1;
    }());
    __setFunctionName(_classThis, "LobbyService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        LobbyService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return LobbyService = _classThis;
}();
exports.LobbyService = LobbyService;
