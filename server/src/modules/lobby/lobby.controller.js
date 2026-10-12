"use strict";
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
exports.LobbyController = void 0;
var common_1 = require("@nestjs/common");
var crypto_1 = require("crypto");
var CreateLobbyDto = /** @class */ (function () {
    function CreateLobbyDto() {
    }
    return CreateLobbyDto;
}());
var JoinLobbyDto = /** @class */ (function () {
    function JoinLobbyDto() {
    }
    return JoinLobbyDto;
}());
var LobbyController = function () {
    var _classDecorators = [(0, common_1.Controller)('api/lobbies')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _create_decorators;
    var _join_decorators;
    var _get_decorators;
    var _leaderboard_decorators;
    var LobbyController = _classThis = /** @class */ (function () {
        function LobbyController_1(lobbies) {
            this.lobbies = (__runInitializers(this, _instanceExtraInitializers), lobbies);
        }
        LobbyController_1.prototype.create = function (dto) {
            return __awaiter(this, void 0, void 0, function () {
                var hostId, lobby;
                var _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            hostId = (0, crypto_1.randomUUID)();
                            return [4 /*yield*/, this.lobbies.createLobby((_a = dto.name) !== null && _a !== void 0 ? _a : 'DUNGEON', hostId, (_b = dto.playerName) !== null && _b !== void 0 ? _b : 'HERO')];
                        case 1:
                            lobby = _c.sent();
                            return [2 /*return*/, { ok: true, lobbyId: lobby.id, playerId: hostId, lobby: this.publicView(lobby) }];
                    }
                });
            });
        };
        LobbyController_1.prototype.join = function (id, dto) {
            return __awaiter(this, void 0, void 0, function () {
                var playerId, lobby;
                var _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            playerId = (_a = dto.playerId) !== null && _a !== void 0 ? _a : (0, crypto_1.randomUUID)();
                            return [4 /*yield*/, this.lobbies.joinLobby(id, playerId, (_b = dto.playerName) !== null && _b !== void 0 ? _b : 'HERO')];
                        case 1:
                            lobby = _c.sent();
                            return [2 /*return*/, { ok: true, lobbyId: lobby.id, playerId: playerId, lobby: this.publicView(lobby) }];
                    }
                });
            });
        };
        LobbyController_1.prototype.get = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                var lobby;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.lobbies.getLobby(id)];
                        case 1:
                            lobby = _a.sent();
                            return [2 /*return*/, lobby ? this.publicView(lobby) : null];
                    }
                });
            });
        };
        LobbyController_1.prototype.leaderboard = function (id) {
            return this.lobbies.leaderboard(id);
        };
        LobbyController_1.prototype.publicView = function (lobby) {
            return {
                id: lobby.id,
                name: lobby.name,
                hostId: lobby.hostId,
                status: lobby.status,
                players: lobby.players,
                map: lobby.map,
                monsters: lobby.monsters,
            };
        };
        return LobbyController_1;
    }());
    __setFunctionName(_classThis, "LobbyController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _create_decorators = [(0, common_1.Post)()];
        _join_decorators = [(0, common_1.Post)(':id/join')];
        _get_decorators = [(0, common_1.Get)(':id')];
        _leaderboard_decorators = [(0, common_1.Get)(':id/leaderboard')];
        __esDecorate(_classThis, null, _create_decorators, { kind: "method", name: "create", static: false, private: false, access: { has: function (obj) { return "create" in obj; }, get: function (obj) { return obj.create; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _join_decorators, { kind: "method", name: "join", static: false, private: false, access: { has: function (obj) { return "join" in obj; }, get: function (obj) { return obj.join; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _get_decorators, { kind: "method", name: "get", static: false, private: false, access: { has: function (obj) { return "get" in obj; }, get: function (obj) { return obj.get; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _leaderboard_decorators, { kind: "method", name: "leaderboard", static: false, private: false, access: { has: function (obj) { return "leaderboard" in obj; }, get: function (obj) { return obj.leaderboard; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        LobbyController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return LobbyController = _classThis;
}();
exports.LobbyController = LobbyController;
