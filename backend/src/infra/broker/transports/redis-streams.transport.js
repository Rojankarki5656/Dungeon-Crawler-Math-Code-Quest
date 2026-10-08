"use strict";
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
exports.RedisStreamsTransport = void 0;
var common_1 = require("@nestjs/common");
var crypto_1 = require("crypto");
var STREAM_PREFIX = 'stream';
var MAXLEN = 50000;
var BLOCK_MS = 3000;
var CLAIM_IDLE_MS = 30000;
/**
 * Redis Streams transport.
 *  - XADD for durable, ordered append.
 *  - Consumer groups => competing consumers (workers) OR fanout (unique group per instance).
 *  - XAUTOCLAIM reclaims messages abandoned by crashed consumers (fault tolerance).
 *  - MAXLEN ~ caps memory growth.
 */
var RedisStreamsTransport = /** @class */ (function () {
    function RedisStreamsTransport(redis) {
        this.redis = redis;
        this.name = 'redis-streams';
        this.logger = new common_1.Logger(RedisStreamsTransport.name);
        this.stoppers = [];
        this.closed = false;
    }
    RedisStreamsTransport.prototype.streamKey = function (topic) {
        return this.redis.key(STREAM_PREFIX, topic);
    };
    RedisStreamsTransport.prototype.publish = function (topic_1, payload_1) {
        return __awaiter(this, arguments, void 0, function (topic, payload, opts) {
            var id, fields;
            var _a;
            var _b;
            if (opts === void 0) { opts = {}; }
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        id = (0, crypto_1.randomUUID)();
                        fields = [
                            'id', id,
                            'topic', topic,
                            'payload', JSON.stringify(payload),
                            'attempts', '0',
                            'enqueuedAt', String(Date.now()),
                            'correlationId',
                            (_b = opts.correlationId) !== null && _b !== void 0 ? _b : '',
                        ];
                        return [4 /*yield*/, (_a = this.redis.client).xadd.apply(_a, __spreadArray([this.streamKey(topic), 'MAXLEN', '~', String(MAXLEN), '*'], fields, false))];
                    case 1:
                        _c.sent();
                        return [2 /*return*/, id];
                }
            });
        });
    };
    RedisStreamsTransport.prototype.subscribe = function (topic_1, group_1, handler_1) {
        return __awaiter(this, arguments, void 0, function (topic, group, handler, opts) {
            var key, consumer, e_1, running, stop;
            var _this = this;
            if (opts === void 0) { opts = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        key = this.streamKey(topic);
                        consumer = "c-".concat((0, crypto_1.randomUUID)().slice(0, 8));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.redis.client.xgroup('CREATE', key, group, '$', 'MKSTREAM')];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        e_1 = _a.sent();
                        if (!String(e_1.message).includes('BUSYGROUP'))
                            throw e_1;
                        return [3 /*break*/, 4];
                    case 4:
                        running = true;
                        stop = function () { running = false; };
                        this.stoppers.push(stop);
                        // Main read loop
                        void (function () { return __awaiter(_this, void 0, void 0, function () {
                            var res, _i, res_1, _a, entries, _b, entries_1, _c, entryId, flat, msg, err_1;
                            var _d;
                            return __generator(this, function (_e) {
                                switch (_e.label) {
                                    case 0:
                                        if (!(running && !this.closed)) return [3 /*break*/, 13];
                                        _e.label = 1;
                                    case 1:
                                        _e.trys.push([1, 10, , 12]);
                                        return [4 /*yield*/, this.redis.client.xreadgroup('GROUP', group, consumer, 'COUNT', String((_d = opts.prefetch) !== null && _d !== void 0 ? _d : 10), 'BLOCK', String(BLOCK_MS), 'STREAMS', key, '>')];
                                    case 2:
                                        res = (_e.sent());
                                        if (!res)
                                            return [3 /*break*/, 0];
                                        _i = 0, res_1 = res;
                                        _e.label = 3;
                                    case 3:
                                        if (!(_i < res_1.length)) return [3 /*break*/, 9];
                                        _a = res_1[_i], entries = _a[1];
                                        _b = 0, entries_1 = entries;
                                        _e.label = 4;
                                    case 4:
                                        if (!(_b < entries_1.length)) return [3 /*break*/, 8];
                                        _c = entries_1[_b], entryId = _c[0], flat = _c[1];
                                        msg = this.toMessage(topic, entryId, flat);
                                        return [4 /*yield*/, handler(msg)];
                                    case 5:
                                        _e.sent();
                                        return [4 /*yield*/, this.redis.client.xack(key, group, entryId)];
                                    case 6:
                                        _e.sent();
                                        _e.label = 7;
                                    case 7:
                                        _b++;
                                        return [3 /*break*/, 4];
                                    case 8:
                                        _i++;
                                        return [3 /*break*/, 3];
                                    case 9: return [3 /*break*/, 12];
                                    case 10:
                                        err_1 = _e.sent();
                                        if (!this.closed)
                                            this.logger.error("xreadgroup ".concat(topic, ": ").concat(err_1.message));
                                        return [4 /*yield*/, new Promise(function (r) { return setTimeout(r, 500); })];
                                    case 11:
                                        _e.sent();
                                        return [3 /*break*/, 12];
                                    case 12: return [3 /*break*/, 0];
                                    case 13: return [2 /*return*/];
                                }
                            });
                        }); })();
                        // Reclaim loop — recover messages from dead consumers
                        void (function () { return __awaiter(_this, void 0, void 0, function () {
                            var res, entries, _i, entries_2, _a, entryId, flat, msg, _b;
                            var _c;
                            return __generator(this, function (_d) {
                                switch (_d.label) {
                                    case 0:
                                        if (!(running && !this.closed)) return [3 /*break*/, 11];
                                        _d.label = 1;
                                    case 1:
                                        _d.trys.push([1, 9, , 10]);
                                        return [4 /*yield*/, new Promise(function (r) { return setTimeout(r, CLAIM_IDLE_MS); })];
                                    case 2:
                                        _d.sent();
                                        return [4 /*yield*/, this.redis.client.xautoclaim(key, group, consumer, CLAIM_IDLE_MS, '0-0', 'COUNT', 20)];
                                    case 3:
                                        res = (_d.sent());
                                        entries = (_c = res === null || res === void 0 ? void 0 : res[1]) !== null && _c !== void 0 ? _c : [];
                                        _i = 0, entries_2 = entries;
                                        _d.label = 4;
                                    case 4:
                                        if (!(_i < entries_2.length)) return [3 /*break*/, 8];
                                        _a = entries_2[_i], entryId = _a[0], flat = _a[1];
                                        if (!flat || !flat.length)
                                            return [3 /*break*/, 7];
                                        msg = this.toMessage(topic, entryId, flat);
                                        return [4 /*yield*/, handler(msg)];
                                    case 5:
                                        _d.sent();
                                        return [4 /*yield*/, this.redis.client.xack(key, group, entryId)];
                                    case 6:
                                        _d.sent();
                                        _d.label = 7;
                                    case 7:
                                        _i++;
                                        return [3 /*break*/, 4];
                                    case 8: return [3 /*break*/, 10];
                                    case 9:
                                        _b = _d.sent();
                                        return [3 /*break*/, 10];
                                    case 10: return [3 /*break*/, 0];
                                    case 11: return [2 /*return*/];
                                }
                            });
                        }); })();
                        return [2 /*return*/, function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                                return [2 /*return*/, stop()];
                            }); }); }];
                }
            });
        });
    };
    RedisStreamsTransport.prototype.toMessage = function (topic, entryId, flat) {
        var _a, _b, _c, _d, _e;
        var obj = {};
        for (var i = 0; i < flat.length; i += 2)
            obj[flat[i]] = flat[i + 1];
        var payload = null;
        try {
            payload = JSON.parse((_a = obj.payload) !== null && _a !== void 0 ? _a : 'null');
        }
        catch ( /* keep null */_f) { /* keep null */ }
        return {
            id: (_b = obj.id) !== null && _b !== void 0 ? _b : entryId,
            topic: (_c = obj.topic) !== null && _c !== void 0 ? _c : topic,
            payload: payload,
            attempts: Number((_d = obj.attempts) !== null && _d !== void 0 ? _d : 0),
            enqueuedAt: Number((_e = obj.enqueuedAt) !== null && _e !== void 0 ? _e : Date.now()),
            correlationId: obj.correlationId || undefined,
        };
    };
    RedisStreamsTransport.prototype.health = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.redis.health()];
        }); });
    };
    RedisStreamsTransport.prototype.close = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.closed = true;
                this.stoppers.forEach(function (s) { return s(); });
                return [2 /*return*/];
            });
        });
    };
    return RedisStreamsTransport;
}());
exports.RedisStreamsTransport = RedisStreamsTransport;
