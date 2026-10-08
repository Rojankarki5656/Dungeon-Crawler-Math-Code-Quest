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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryTransport = void 0;
var common_1 = require("@nestjs/common");
var crypto_1 = require("crypto");
/**
 * In-process transport — used for unit tests and local dev without infra.
 * Preserves at-least-once semantics and per-group competing consumers.
 */
var MemoryTransport = /** @class */ (function () {
    function MemoryTransport() {
        this.name = 'memory';
        this.logger = new common_1.Logger(MemoryTransport.name);
        this.subs = new Map();
        this.groups = new Map(); // round-robin cursor
        this.closed = false;
    }
    MemoryTransport.prototype.publish = function (topic_1, payload_1) {
        return __awaiter(this, arguments, void 0, function (topic, payload, opts) {
            var id, msg, deliver;
            var _this = this;
            if (opts === void 0) { opts = {}; }
            return __generator(this, function (_a) {
                id = (0, crypto_1.randomUUID)();
                msg = {
                    id: id,
                    topic: topic,
                    payload: payload,
                    attempts: 0,
                    enqueuedAt: Date.now(),
                    correlationId: opts.correlationId,
                };
                deliver = function () { return _this.dispatch(msg); };
                if (opts.delayMs && opts.delayMs > 0)
                    setTimeout(deliver, opts.delayMs);
                else
                    queueMicrotask(deliver);
                return [2 /*return*/, id];
            });
        });
    };
    MemoryTransport.prototype.dispatch = function (msg) {
        var _this = this;
        var _a, _b, _c;
        if (this.closed)
            return;
        var subs = (_a = this.subs.get(msg.topic)) !== null && _a !== void 0 ? _a : [];
        if (!subs.length)
            return;
        // Group by consumer-group, round-robin within a group (competing consumers).
        var byGroup = new Map();
        for (var _i = 0, subs_1 = subs; _i < subs_1.length; _i++) {
            var s = subs_1[_i];
            var arr = (_b = byGroup.get(s.group)) !== null && _b !== void 0 ? _b : [];
            arr.push(s);
            byGroup.set(s.group, arr);
        }
        for (var _d = 0, byGroup_1 = byGroup; _d < byGroup_1.length; _d++) {
            var _e = byGroup_1[_d], group = _e[0], members = _e[1];
            var cursorKey = "".concat(msg.topic, "::").concat(group);
            var idx = ((_c = this.groups.get(cursorKey)) !== null && _c !== void 0 ? _c : 0) % members.length;
            this.groups.set(cursorKey, idx + 1);
            var sub = members[idx];
            Promise.resolve(sub.handler(msg)).catch(function (e) {
                return _this.logger.error("handler error on ".concat(msg.topic, ": ").concat(e === null || e === void 0 ? void 0 : e.message));
            });
        }
    };
    MemoryTransport.prototype.subscribe = function (topic_1, group_1, handler_1) {
        return __awaiter(this, arguments, void 0, function (topic, group, handler, opts) {
            var arr, sub;
            var _this = this;
            var _a;
            if (opts === void 0) { opts = {}; }
            return __generator(this, function (_b) {
                arr = (_a = this.subs.get(topic)) !== null && _a !== void 0 ? _a : [];
                sub = { group: group, handler: handler, opts: opts };
                arr.push(sub);
                this.subs.set(topic, arr);
                return [2 /*return*/, function () { return __awaiter(_this, void 0, void 0, function () {
                        var list, i;
                        var _a;
                        return __generator(this, function (_b) {
                            list = (_a = this.subs.get(topic)) !== null && _a !== void 0 ? _a : [];
                            i = list.indexOf(sub);
                            if (i >= 0)
                                list.splice(i, 1);
                            return [2 /*return*/];
                        });
                    }); }];
            });
        });
    };
    MemoryTransport.prototype.health = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, !this.closed];
        }); });
    };
    MemoryTransport.prototype.close = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.closed = true;
                this.subs.clear();
                this.groups.clear();
                return [2 /*return*/];
            });
        });
    };
    return MemoryTransport;
}());
exports.MemoryTransport = MemoryTransport;
