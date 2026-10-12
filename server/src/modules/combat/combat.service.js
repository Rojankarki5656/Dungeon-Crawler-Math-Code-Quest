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
exports.CombatService = void 0;
var common_1 = require("@nestjs/common");
var crypto_1 = require("crypto");
var topics_1 = require("../../common/constants/topics");
var game_constants_1 = require("../../common/constants/game.constants");
var MAX_ATTEMPTS_PER_ENCOUNTER = 3;
var CombatService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var CombatService = _classThis = /** @class */ (function () {
        function CombatService_1(broker, redis, lobbies, dungeon, questions, encounters) {
            this.broker = broker;
            this.redis = redis;
            this.lobbies = lobbies;
            this.dungeon = dungeon;
            this.questions = questions;
            this.encounters = encounters;
            this.logger = new common_1.Logger(CombatService.name);
        }
        CombatService_1.prototype.onModuleInit = function () {
            var _this = this;
            // ---- Consume movement -> detect encounters --------------------------
            void this.broker.subscribe(topics_1.TOPICS.PLAYER_MOVED, topics_1.GROUPS.COMBAT_WORKERS, function (msg) { return _this.handlePlayerMoved(msg.payload); }, { idempotent: true, maxAttempts: 3 });
            // ---- Consume validation results -> apply damage ---------------------
            void this.broker.subscribe(topics_1.TOPICS.ROUND_WON, topics_1.GROUPS.COMBAT_WORKERS, function (msg) { return _this.handleRoundResult(msg.payload); }, { idempotent: true, maxAttempts: 3 });
            void this.broker.subscribe(topics_1.TOPICS.ROUND_LOST, topics_1.GROUPS.COMBAT_WORKERS, function (msg) { return _this.handleRoundResult(msg.payload); }, { idempotent: true, maxAttempts: 3 });
        };
        // =======================================================================
        // ENCOUNTER TRIGGERING
        // =======================================================================
        CombatService_1.prototype.handlePlayerMoved = function (evt) {
            return __awaiter(this, void 0, void 0, function () {
                var existing, monsters, monster, questionId, question, now, encounter, payload;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.encounters.getActiveForPlayer(evt.playerId)];
                        case 1:
                            existing = _a.sent();
                            if (existing)
                                return [2 /*return*/]; // already fighting — ignore movement
                            return [4 /*yield*/, this.dungeon.getMonsters(evt.lobbyId)];
                        case 2:
                            monsters = _a.sent();
                            monster = this.dungeon.monsterAt(monsters, evt.to.x, evt.to.y);
                            if (!monster)
                                return [2 /*return*/];
                            questionId = this.questions.nextId(monster.difficulty);
                            question = this.questions.getInternal(questionId);
                            now = Date.now();
                            encounter = {
                                id: (0, crypto_1.randomUUID)(),
                                lobbyId: evt.lobbyId,
                                playerId: evt.playerId,
                                monsterId: monster.id,
                                questionId: questionId,
                                solution: question.answer,
                                status: 'pending',
                                attempts: 0,
                                createdAt: now,
                                expiresAt: now + 120000,
                            };
                            return [4 /*yield*/, this.encounters.create(encounter)];
                        case 3:
                            _a.sent();
                            payload = {
                                encounterId: encounter.id,
                                lobbyId: evt.lobbyId,
                                playerId: evt.playerId,
                                monster: monster,
                                questionId: questionId,
                                expiresAt: encounter.expiresAt,
                            };
                            return [4 /*yield*/, this.broker.publish(topics_1.TOPICS.ENCOUNTER_TRIGGERED, payload, { safe: true })];
                        case 4:
                            _a.sent();
                            // Kick off ASYNC asset pre-fetch — the game loop never blocks on this.
                            return [4 /*yield*/, this.broker.publish(topics_1.TOPICS.QUESTION_FETCH_REQUESTED, {
                                    encounterId: encounter.id,
                                    questionId: questionId,
                                    lobbyId: evt.lobbyId,
                                }, { safe: true })];
                        case 5:
                            // Kick off ASYNC asset pre-fetch — the game loop never blocks on this.
                            _a.sent();
                            this.logger.log("Encounter ".concat(encounter.id, " vs ").concat(monster.name, " for ").concat(evt.playerId));
                            return [2 /*return*/];
                    }
                });
            });
        };
        // =======================================================================
        // ROUND RESOLUTION
        // =======================================================================
        CombatService_1.prototype.handleRoundResult = function (result) {
            return __awaiter(this, void 0, void 0, function () {
                var encounter, player, monsters, monster, question, xpGained, monsterDefeated, map, nextQuestionId;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.encounters.get(result.encounterId)];
                        case 1:
                            encounter = _a.sent();
                            if (!encounter || encounter.status !== 'pending')
                                return [2 /*return*/];
                            return [4 /*yield*/, this.lobbies.getPlayer(result.playerId)];
                        case 2:
                            player = _a.sent();
                            if (!player)
                                return [2 /*return*/];
                            return [4 /*yield*/, this.dungeon.getMonsters(encounter.lobbyId)];
                        case 3:
                            monsters = _a.sent();
                            monster = monsters.find(function (m) { return m.id === encounter.monsterId; });
                            if (!!monster) return [3 /*break*/, 5];
                            return [4 /*yield*/, this.finishEncounter(encounter, 'expired', player, 0, false)];
                        case 4:
                            _a.sent();
                            return [2 /*return*/];
                        case 5:
                            question = this.questions.getInternal(encounter.questionId);
                            xpGained = 0;
                            monsterDefeated = false;
                            if (!result.correct) return [3 /*break*/, 7];
                            monster.hp = Math.max(0, monster.hp - question.damage);
                            monsterDefeated = monster.hp <= 0;
                            xpGained = question.damage * monster.difficulty;
                            player.score += xpGained;
                            return [4 /*yield*/, this.dungeon.saveMonsters(encounter.lobbyId, monsters)];
                        case 6:
                            _a.sent();
                            return [3 /*break*/, 8];
                        case 7:
                            player.hp = Math.max(0, player.hp - Math.round(monster.damage * 0.6));
                            _a.label = 8;
                        case 8:
                            encounter.attempts += 1;
                            if (!monsterDefeated) return [3 /*break*/, 11];
                            return [4 /*yield*/, this.dungeon.killMonster(encounter.lobbyId, monster.id)];
                        case 9:
                            _a.sent();
                            return [4 /*yield*/, this.finishEncounter(encounter, 'won', player, xpGained, true)];
                        case 10:
                            _a.sent();
                            return [2 /*return*/];
                        case 11:
                            if (!(player.hp <= 0)) return [3 /*break*/, 14];
                            player.hp = game_constants_1.PLAYER.MAX_HP; // respawn at spawn point
                            return [4 /*yield*/, this.dungeon.getMap(encounter.lobbyId)];
                        case 12:
                            map = _a.sent();
                            if (map) {
                                player.x = map.spawn.x;
                                player.y = map.spawn.y;
                            }
                            return [4 /*yield*/, this.finishEncounter(encounter, 'lost', player, 0, false)];
                        case 13:
                            _a.sent();
                            return [2 /*return*/];
                        case 14:
                            if (!(encounter.attempts >= MAX_ATTEMPTS_PER_ENCOUNTER)) return [3 /*break*/, 16];
                            return [4 /*yield*/, this.finishEncounter(encounter, 'expired', player, 0, false)];
                        case 15:
                            _a.sent();
                            return [2 /*return*/];
                        case 16:
                            nextQuestionId = this.questions.nextId(monster.difficulty);
                            encounter.questionId = nextQuestionId;
                            encounter.solution = this.questions.getInternal(nextQuestionId).answer;
                            encounter.expiresAt = Date.now() + 120000;
                            return [4 /*yield*/, this.encounters.save(encounter)];
                        case 17:
                            _a.sent();
                            return [4 /*yield*/, this.lobbies.savePlayer(player)];
                        case 18:
                            _a.sent();
                            return [4 /*yield*/, this.lobbies.updatePlayerInLobby(encounter.lobbyId, player)];
                        case 19:
                            _a.sent();
                            return [4 /*yield*/, this.broker.publish(topics_1.TOPICS.ENCOUNTER_TRIGGERED, {
                                    encounterId: encounter.id,
                                    lobbyId: encounter.lobbyId,
                                    playerId: player.id,
                                    monster: monster,
                                    questionId: nextQuestionId,
                                    expiresAt: encounter.expiresAt,
                                    retry: true,
                                    attemptsLeft: MAX_ATTEMPTS_PER_ENCOUNTER - encounter.attempts,
                                }, { safe: true })];
                        case 20:
                            _a.sent();
                            return [4 /*yield*/, this.broker.publish(topics_1.TOPICS.QUESTION_FETCH_REQUESTED, {
                                    encounterId: encounter.id,
                                    questionId: nextQuestionId,
                                    lobbyId: encounter.lobbyId,
                                }, { safe: true })];
                        case 21:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        CombatService_1.prototype.finishEncounter = function (encounter, status, player, xpGained, monsterDefeated) {
            return __awaiter(this, void 0, void 0, function () {
                var resolved;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            encounter.status = status;
                            return [4 /*yield*/, this.encounters.save(encounter)];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, this.encounters.clearActive(player.id)];
                        case 2:
                            _a.sent();
                            return [4 /*yield*/, this.lobbies.savePlayer(player)];
                        case 3:
                            _a.sent();
                            return [4 /*yield*/, this.lobbies.updatePlayerInLobby(encounter.lobbyId, player)];
                        case 4:
                            _a.sent();
                            resolved = {
                                encounterId: encounter.id,
                                lobbyId: encounter.lobbyId,
                                playerId: player.id,
                                monsterId: encounter.monsterId,
                                monsterDefeated: monsterDefeated,
                                playerHp: player.hp,
                                playerScore: player.score,
                                xpGained: xpGained,
                            };
                            return [4 /*yield*/, this.broker.publish(topics_1.TOPICS.ENCOUNTER_RESOLVED, resolved, { safe: true })];
                        case 5:
                            _a.sent();
                            return [4 /*yield*/, this.broker.publish(topics_1.TOPICS.LEADERBOARD_UPDATED, { lobbyId: encounter.lobbyId }, { safe: true })];
                        case 6:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        // =======================================================================
        // PUBLIC — called by gateway on answer submit
        // =======================================================================
        CombatService_1.prototype.submitAnswer = function (params) {
            return __awaiter(this, void 0, void 0, function () {
                var encounter, payload;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.encounters.get(params.encounterId)];
                        case 1:
                            encounter = _a.sent();
                            if (!encounter)
                                return [2 /*return*/, { accepted: false, reason: 'ENCOUNTER_NOT_FOUND' }];
                            if (encounter.playerId !== params.playerId)
                                return [2 /*return*/, { accepted: false, reason: 'NOT_YOUR_ENCOUNTER' }];
                            if (encounter.status !== 'pending')
                                return [2 /*return*/, { accepted: false, reason: 'ENCOUNTER_CLOSED' }];
                            if (encounter.expiresAt < Date.now())
                                return [2 /*return*/, { accepted: false, reason: 'ENCOUNTER_EXPIRED' }];
                            payload = {
                                encounterId: params.encounterId,
                                playerId: params.playerId,
                                lobbyId: encounter.lobbyId,
                                answer: params.answer,
                                nonce: params.nonce,
                                submittedAt: Date.now(),
                            };
                            return [4 /*yield*/, this.broker.publish(topics_1.TOPICS.ANSWER_SUBMITTED, payload, { safe: true })];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, { accepted: true }];
                    }
                });
            });
        };
        return CombatService_1;
    }());
    __setFunctionName(_classThis, "CombatService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        CombatService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return CombatService = _classThis;
}();
exports.CombatService = CombatService;
