"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
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
exports.GameGateway = void 0;
var websockets_1 = require("@nestjs/websockets");
var common_1 = require("@nestjs/common");
var crypto_1 = require("crypto");
var topics_1 = require("../common/constants/topics");
var game_constants_1 = require("../common/constants/game.constants");
var MOVE_RATE_LIMIT = 20; // max moves
var MOVE_RATE_WINDOW_MS = 1000; // per second
var GameGateway = function () {
    var _a, _b;
    var _classDecorators = [(0, websockets_1.WebSocketGateway)({
            namespace: '/game',
            cors: { origin: (_b = (_a = process.env.CORS_ORIGIN) === null || _a === void 0 ? void 0 : _a.split(',')) !== null && _b !== void 0 ? _b : '*', credentials: true },
            transports: ['websocket', 'polling'],
            pingInterval: 10000,
            pingTimeout: 8000,
        }), (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true, whitelist: true }))];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _server_decorators;
    var _server_initializers = [];
    var _server_extraInitializers = [];
    var _onCreate_decorators;
    var _onJoin_decorators;
    var _onSync_decorators;
    var _onMove_decorators;
    var _onSubmit_decorators;
    var _onPing_decorators;
    var GameGateway = _classThis = /** @class */ (function () {
        function GameGateway_1(lobbies, dungeons, combat, questions, broker) {
            this.lobbies = (__runInitializers(this, _instanceExtraInitializers), lobbies);
            this.dungeons = dungeons;
            this.combat = combat;
            this.questions = questions;
            this.broker = broker;
            this.logger = new common_1.Logger(GameGateway.name);
            this.server = __runInitializers(this, _server_initializers, void 0);
            this.sessions = (__runInitializers(this, _server_extraInitializers), new Map());
        }
        // =======================================================================
        // LIFECYCLE
        // =======================================================================
        GameGateway_1.prototype.afterInit = function (server) {
            this.logger.log('WebSocket gateway initialised on namespace /game');
            // ---- Fanout consumer: broker events -> WebSocket rooms --------------
            void this.startFanoutConsumer();
        };
        GameGateway_1.prototype.handleConnection = function (client) {
            var _a, _b, _c, _d;
            var playerId = (_b = (_a = client.handshake.auth) === null || _a === void 0 ? void 0 : _a.playerId) !== null && _b !== void 0 ? _b : (0, crypto_1.randomUUID)();
            var playerName = (_d = (_c = client.handshake.auth) === null || _c === void 0 ? void 0 : _c.playerName) !== null && _d !== void 0 ? _d : "HERO-".concat(playerId.slice(0, 4));
            this.sessions.set(client.id, { playerId: playerId, playerName: playerName, lastSeq: 0, moveWindow: [] });
            client.emit('session:ready', {
                playerId: playerId,
                playerName: playerName,
                socketId: client.id,
                serverTime: Date.now(),
            });
            this.logger.log("Client connected: ".concat(client.id, " (player=").concat(playerId, ")"));
        };
        GameGateway_1.prototype.handleDisconnect = function (client) {
            return __awaiter(this, void 0, void 0, function () {
                var session;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            session = this.sessions.get(client.id);
                            this.sessions.delete(client.id);
                            if (!(session === null || session === void 0 ? void 0 : session.lobbyId)) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.lobbies.leaveLobby(session.lobbyId, session.playerId).catch(function () { return undefined; })];
                        case 1:
                            _a.sent();
                            this.server.to(session.lobbyId).emit('lobby:player:left', {
                                playerId: session.playerId, at: Date.now(),
                            });
                            return [4 /*yield*/, this.broadcastLobbyState(session.lobbyId)];
                        case 2:
                            _a.sent();
                            _a.label = 3;
                        case 3:
                            this.logger.log("Client disconnected: ".concat(client.id));
                            return [2 /*return*/];
                    }
                });
            });
        };
        // =======================================================================
        // LOBBY
        // =======================================================================
        GameGateway_1.prototype.onCreate = function (client, body) {
            return __awaiter(this, void 0, void 0, function () {
                var session, lobby;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            session = this.sessions.get(client.id);
                            if (body === null || body === void 0 ? void 0 : body.playerName)
                                session.playerName = body.playerName;
                            return [4 /*yield*/, this.lobbies.createLobby((_a = body === null || body === void 0 ? void 0 : body.name) !== null && _a !== void 0 ? _a : 'DUNGEON OF ALGORITHMS', session.playerId, session.playerName)];
                        case 1:
                            lobby = _b.sent();
                            session.lobbyId = lobby.id;
                            return [4 /*yield*/, client.join(lobby.id)];
                        case 2:
                            _b.sent();
                            client.emit('lobby:joined', this.lobbyView(lobby, session.playerId));
                            return [4 /*yield*/, this.broadcastLobbyState(lobby.id)];
                        case 3:
                            _b.sent();
                            return [2 /*return*/, { ok: true, lobbyId: lobby.id, playerId: session.playerId }];
                    }
                });
            });
        };
        GameGateway_1.prototype.onJoin = function (client, body) {
            return __awaiter(this, void 0, void 0, function () {
                var session, lobby, e_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            session = this.sessions.get(client.id);
                            if (!(body === null || body === void 0 ? void 0 : body.lobbyId))
                                return [2 /*return*/, { ok: false, error: 'MISSING_LOBBY_ID' }];
                            if (body.playerName)
                                session.playerName = body.playerName;
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 5, , 6]);
                            return [4 /*yield*/, this.lobbies.joinLobby(body.lobbyId, session.playerId, session.playerName)];
                        case 2:
                            lobby = _a.sent();
                            session.lobbyId = lobby.id;
                            return [4 /*yield*/, client.join(lobby.id)];
                        case 3:
                            _a.sent();
                            client.emit('lobby:joined', this.lobbyView(lobby, session.playerId));
                            this.server.to(lobby.id).emit('lobby:player:joined', {
                                playerId: session.playerId, name: session.playerName, at: Date.now(),
                            });
                            return [4 /*yield*/, this.broadcastLobbyState(lobby.id)];
                        case 4:
                            _a.sent();
                            return [2 /*return*/, { ok: true, lobbyId: lobby.id, playerId: session.playerId }];
                        case 5:
                            e_1 = _a.sent();
                            client.emit('error:game', { code: 'LOBBY_JOIN_FAILED', message: e_1.message });
                            return [2 /*return*/, { ok: false, error: e_1.message }];
                        case 6: return [2 /*return*/];
                    }
                });
            });
        };
        GameGateway_1.prototype.onSync = function (client) {
            return __awaiter(this, void 0, void 0, function () {
                var session, lobby;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            session = this.sessions.get(client.id);
                            if (!session.lobbyId)
                                return [2 /*return*/, { ok: false }];
                            return [4 /*yield*/, this.lobbies.getLobby(session.lobbyId)];
                        case 1:
                            lobby = _a.sent();
                            if (!lobby)
                                return [2 /*return*/, { ok: false }];
                            client.emit('lobby:joined', this.lobbyView(lobby, session.playerId));
                            return [2 /*return*/, { ok: true }];
                    }
                });
            });
        };
        // =======================================================================
        // MOVEMENT (server-authoritative)
        // =======================================================================
        GameGateway_1.prototype.onMove = function (client, body) {
            return __awaiter(this, void 0, void 0, function () {
                var session, now, seq, player, map, monsters, nx, ny, lobby, occupied, from, tile, evt;
                var _a, _b, _c, _d;
                return __generator(this, function (_e) {
                    switch (_e.label) {
                        case 0:
                            session = this.sessions.get(client.id);
                            if (!session.lobbyId)
                                return [2 /*return*/, { ok: false, error: 'NOT_IN_LOBBY' }];
                            now = Date.now();
                            session.moveWindow = session.moveWindow.filter(function (t) { return now - t < MOVE_RATE_WINDOW_MS; });
                            if (session.moveWindow.length >= MOVE_RATE_LIMIT) {
                                return [2 /*return*/, { ok: false, error: 'RATE_LIMITED' }];
                            }
                            session.moveWindow.push(now);
                            seq = Number((_a = body === null || body === void 0 ? void 0 : body.seq) !== null && _a !== void 0 ? _a : 0);
                            if (seq <= session.lastSeq)
                                return [2 /*return*/, { ok: false, error: 'STALE_SEQ' }];
                            session.lastSeq = seq;
                            return [4 /*yield*/, this.lobbies.getPlayer(session.playerId)];
                        case 1:
                            player = _e.sent();
                            if (!player)
                                return [2 /*return*/, { ok: false, error: 'PLAYER_NOT_FOUND' }];
                            return [4 /*yield*/, this.dungeons.getMap(session.lobbyId)];
                        case 2:
                            map = _e.sent();
                            if (!map)
                                return [2 /*return*/, { ok: false, error: 'MAP_NOT_FOUND' }];
                            return [4 /*yield*/, this.dungeons.getMonsters(session.lobbyId)];
                        case 3:
                            monsters = _e.sent();
                            nx = player.x + Math.sign((_b = body.dx) !== null && _b !== void 0 ? _b : 0);
                            ny = player.y + Math.sign((_c = body.dy) !== null && _c !== void 0 ? _c : 0);
                            if (!this.dungeons.isWalkable(map, nx, ny)) {
                                client.emit('player:blocked', { x: player.x, y: player.y, seq: seq });
                                return [2 /*return*/, { ok: false, error: 'BLOCKED' }];
                            }
                            return [4 /*yield*/, this.lobbies.getLobby(session.lobbyId)];
                        case 4:
                            lobby = _e.sent();
                            occupied = lobby === null || lobby === void 0 ? void 0 : lobby.players.some(function (p) { return p.id !== player.id && p.x === nx && p.y === ny && p.connected; });
                            if (occupied)
                                return [2 /*return*/, { ok: false, error: 'OCCUPIED' }];
                            from = { x: player.x, y: player.y };
                            player.x = nx;
                            player.y = ny;
                            player.lastSeq = seq;
                            return [4 /*yield*/, this.lobbies.savePlayer(player)];
                        case 5:
                            _e.sent();
                            return [4 /*yield*/, this.lobbies.updatePlayerInLobby(session.lobbyId, player)];
                        case 6:
                            _e.sent();
                            tile = (_d = this.dungeons.tileAt(map, nx, ny)) !== null && _d !== void 0 ? _d : game_constants_1.TILE.FLOOR;
                            evt = {
                                lobbyId: session.lobbyId, playerId: player.id,
                                from: from,
                                to: { x: nx, y: ny },
                                seq: seq,
                                tile: tile,
                            };
                            // Broadcast immediately for zero perceived latency (client-side interpolation).
                            this.server.to(session.lobbyId).emit('player:moved', __assign(__assign({}, evt), { name: player.name }));
                            // Async: hand off to the event backbone for encounter detection.
                            return [4 /*yield*/, this.broker.publish(topics_1.TOPICS.PLAYER_MOVED, evt, { safe: true })];
                        case 7:
                            // Async: hand off to the event backbone for encounter detection.
                            _e.sent();
                            return [2 /*return*/, { ok: true, seq: seq, x: nx, y: ny }];
                    }
                });
            });
        };
        // =======================================================================
        // ANSWER SUBMISSION
        // =======================================================================
        GameGateway_1.prototype.onSubmit = function (client, body) {
            return __awaiter(this, void 0, void 0, function () {
                var session, result;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            session = this.sessions.get(client.id);
                            if (!session.lobbyId)
                                return [2 /*return*/, { ok: false, error: 'NOT_IN_LOBBY' }];
                            if (!(body === null || body === void 0 ? void 0 : body.encounterId) || typeof body.answer !== 'string') {
                                return [2 /*return*/, { ok: false, error: 'INVALID_PAYLOAD' }];
                            }
                            return [4 /*yield*/, this.combat.submitAnswer({
                                    encounterId: body.encounterId,
                                    playerId: session.playerId,
                                    answer: body.answer.slice(0, 64),
                                    nonce: (_a = body.nonce) !== null && _a !== void 0 ? _a : (0, crypto_1.randomUUID)(),
                                })];
                        case 1:
                            result = _b.sent();
                            if (!result.accepted) {
                                client.emit('answer:rejected', { encounterId: body.encounterId, reason: result.reason });
                                return [2 /*return*/, result];
                            }
                            return [2 /*return*/, { ok: true, accepted: true }];
                    }
                });
            });
        };
        // =======================================================================
        // UTILITIES
        // =======================================================================
        GameGateway_1.prototype.onPing = function (client) {
            client.emit('pong', { serverTime: Date.now() });
        };
        GameGateway_1.prototype.lobbyView = function (lobby, selfId) {
            return {
                id: lobby.id,
                name: lobby.name,
                hostId: lobby.hostId,
                status: lobby.status,
                players: lobby.players,
                map: lobby.map,
                monsters: lobby.monsters,
                selfId: selfId,
            };
        };
        GameGateway_1.prototype.broadcastLobbyState = function (lobbyId) {
            return __awaiter(this, void 0, void 0, function () {
                var lobby, board;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.lobbies.getLobby(lobbyId)];
                        case 1:
                            lobby = _a.sent();
                            if (!lobby)
                                return [2 /*return*/];
                            this.server.to(lobbyId).emit('lobby:state', {
                                id: lobby.id, status: lobby.status,
                                players: lobby.players.map(function (p) { return ({
                                    id: p.id, name: p.name, hp: p.hp, maxHp: p.maxHp, score: p.score, connected: p.connected,
                                }); }),
                                at: Date.now(),
                            });
                            return [4 /*yield*/, this.lobbies.leaderboard(lobbyId)];
                        case 2:
                            board = _a.sent();
                            this.server.to(lobbyId).emit('leaderboard:update', board);
                            return [2 /*return*/];
                    }
                });
            });
        };
        // =======================================================================
        // BROKER -> WEBSOCKET FANOUT
        // =======================================================================
        GameGateway_1.prototype.startFanoutConsumer = function () {
            return __awaiter(this, void 0, void 0, function () {
                var group;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            group = this.broker.fanoutGroup('ws-fanout');
                            return [4 /*yield*/, this.broker.subscribe(topics_1.TOPICS.ENCOUNTER_TRIGGERED, group, function (msg) { return __awaiter(_this, void 0, void 0, function () {
                                    var p, question;
                                    var _a;
                                    return __generator(this, function (_b) {
                                        p = msg.payload;
                                        question = this.questions.getPublic(p.questionId);
                                        this.server.to(p.lobbyId).emit('encounter:triggered', {
                                            encounterId: p.encounterId,
                                            playerId: p.playerId,
                                            monster: p.monster,
                                            question: question,
                                            expiresAt: p.expiresAt,
                                            retry: !!p.retry,
                                            attemptsLeft: (_a = p.attemptsLeft) !== null && _a !== void 0 ? _a : 3,
                                        });
                                        return [2 /*return*/];
                                    });
                                }); }, { maxAttempts: 2 })];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, this.broker.subscribe(topics_1.TOPICS.QUESTION_FETCH_COMPLETED, group, function (msg) { return __awaiter(_this, void 0, void 0, function () {
                                    var p;
                                    return __generator(this, function (_a) {
                                        p = msg.payload;
                                        // Targeted emit: only the fighting player needs the asset URL immediately.
                                        this.server.emit('question:asset:ready', {
                                            encounterId: p.encounterId,
                                            questionId: p.questionId,
                                            imageUrl: p.imageUrl,
                                        });
                                        return [2 /*return*/];
                                    });
                                }); }, { maxAttempts: 2 })];
                        case 2:
                            _a.sent();
                            return [4 /*yield*/, this.broker.subscribe(topics_1.TOPICS.ROUND_WON, group, function (msg) { return __awaiter(_this, void 0, void 0, function () {
                                    var p;
                                    return __generator(this, function (_a) {
                                        p = msg.payload;
                                        this.server.to(p.lobbyId).emit('round:result', {
                                            encounterId: p.encounterId, correct: true, at: Date.now(),
                                        });
                                        return [2 /*return*/];
                                    });
                                }); }, { maxAttempts: 2 })];
                        case 3:
                            _a.sent();
                            return [4 /*yield*/, this.broker.subscribe(topics_1.TOPICS.ROUND_LOST, group, function (msg) { return __awaiter(_this, void 0, void 0, function () {
                                    var p;
                                    return __generator(this, function (_a) {
                                        p = msg.payload;
                                        this.server.to(p.lobbyId).emit('round:result', {
                                            encounterId: p.encounterId, correct: false, at: Date.now(),
                                        });
                                        return [2 /*return*/];
                                    });
                                }); }, { maxAttempts: 2 })];
                        case 4:
                            _a.sent();
                            return [4 /*yield*/, this.broker.subscribe(topics_1.TOPICS.ENCOUNTER_RESOLVED, group, function (msg) { return __awaiter(_this, void 0, void 0, function () {
                                    var p, lobby, monsters;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                p = msg.payload;
                                                this.server.to(p.lobbyId).emit('encounter:resolved', p);
                                                return [4 /*yield*/, this.lobbies.getLobby(p.lobbyId)];
                                            case 1:
                                                lobby = _a.sent();
                                                if (!(lobby === null || lobby === void 0 ? void 0 : lobby.map)) return [3 /*break*/, 3];
                                                return [4 /*yield*/, this.dungeons.getMonsters(p.lobbyId)];
                                            case 2:
                                                monsters = _a.sent();
                                                this.server.to(p.lobbyId).emit('dungeon:monsters', monsters);
                                                _a.label = 3;
                                            case 3: return [4 /*yield*/, this.broadcastLobbyState(p.lobbyId)];
                                            case 4:
                                                _a.sent();
                                                return [2 /*return*/];
                                        }
                                    });
                                }); }, { maxAttempts: 2 })];
                        case 5:
                            _a.sent();
                            return [4 /*yield*/, this.broker.subscribe(topics_1.TOPICS.LOBBY_STATE_CHANGED, group, function (msg) { return __awaiter(_this, void 0, void 0, function () {
                                    var p;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                p = msg.payload;
                                                if (!(p.reason !== 'lobby.state.sync')) return [3 /*break*/, 2];
                                                return [4 /*yield*/, this.broadcastLobbyState(p.lobbyId)];
                                            case 1:
                                                _a.sent();
                                                _a.label = 2;
                                            case 2: return [2 /*return*/];
                                        }
                                    });
                                }); }, { maxAttempts: 2 })];
                        case 6:
                            _a.sent();
                            this.logger.log('Broker -> WebSocket fanout consumer online');
                            return [2 /*return*/];
                    }
                });
            });
        };
        return GameGateway_1;
    }());
    __setFunctionName(_classThis, "GameGateway");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _server_decorators = [(0, websockets_1.WebSocketServer)()];
        _onCreate_decorators = [(0, websockets_1.SubscribeMessage)('lobby:create')];
        _onJoin_decorators = [(0, websockets_1.SubscribeMessage)('lobby:join')];
        _onSync_decorators = [(0, websockets_1.SubscribeMessage)('lobby:sync')];
        _onMove_decorators = [(0, websockets_1.SubscribeMessage)('player:move')];
        _onSubmit_decorators = [(0, websockets_1.SubscribeMessage)('answer:submit')];
        _onPing_decorators = [(0, websockets_1.SubscribeMessage)('ping')];
        __esDecorate(_classThis, null, _onCreate_decorators, { kind: "method", name: "onCreate", static: false, private: false, access: { has: function (obj) { return "onCreate" in obj; }, get: function (obj) { return obj.onCreate; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _onJoin_decorators, { kind: "method", name: "onJoin", static: false, private: false, access: { has: function (obj) { return "onJoin" in obj; }, get: function (obj) { return obj.onJoin; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _onSync_decorators, { kind: "method", name: "onSync", static: false, private: false, access: { has: function (obj) { return "onSync" in obj; }, get: function (obj) { return obj.onSync; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _onMove_decorators, { kind: "method", name: "onMove", static: false, private: false, access: { has: function (obj) { return "onMove" in obj; }, get: function (obj) { return obj.onMove; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _onSubmit_decorators, { kind: "method", name: "onSubmit", static: false, private: false, access: { has: function (obj) { return "onSubmit" in obj; }, get: function (obj) { return obj.onSubmit; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _onPing_decorators, { kind: "method", name: "onPing", static: false, private: false, access: { has: function (obj) { return "onPing" in obj; }, get: function (obj) { return obj.onPing; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, null, _server_decorators, { kind: "field", name: "server", static: false, private: false, access: { has: function (obj) { return "server" in obj; }, get: function (obj) { return obj.server; }, set: function (obj, value) { obj.server = value; } }, metadata: _metadata }, _server_initializers, _server_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        GameGateway = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return GameGateway = _classThis;
}();
exports.GameGateway = GameGateway;
