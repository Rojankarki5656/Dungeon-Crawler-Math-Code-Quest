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
exports.BrokerService = void 0;
var common_1 = require("@nestjs/common");
var crypto_1 = require("crypto");
var backoff_1 = require("../../common/utils/backoff");
var topics_1 = require("../../common/constants/topics");
var BrokerService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var BrokerService = _classThis = /** @class */ (function () {
        function BrokerService_1(transport, redis, config) {
            this.transport = transport;
            this.redis = redis;
            this.config = config;
            this.logger = new common_1.Logger(BrokerService.name);
            this.unsubscribers = [];
            this.maxAttempts = this.config.get('broker.maxAttempts', 3);
            this.instanceId = this.config.get('broker.consumerName', "i-".concat(process.pid));
        }
        BrokerService_1.prototype.onModuleInit = function () {
            this.logger.log("Broker transport: ".concat(this.transport.name, " (instance=").concat(this.instanceId, ")"));
        };
        BrokerService_1.prototype.publish = function (topic_1, payload_1) {
            return __awaiter(this, arguments, void 0, function (topic, payload, opts) {
                var meta, err_1;
                var _a;
                if (opts === void 0) { opts = {}; }
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            meta = {
                                correlationId: (_a = opts.correlationId) !== null && _a !== void 0 ? _a : (0, crypto_1.randomUUID)(),
                                delayMs: opts.delayMs,
                                headers: opts.headers,
                            };
                            _b.label = 1;
                        case 1:
                            _b.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, this.transport.publish(topic, payload, meta)];
                        case 2: return [2 /*return*/, _b.sent()];
                        case 3:
                            err_1 = _b.sent();
                            this.logger.error("publish ".concat(topic, " failed: ").concat(err_1.message));
                            if (opts.safe)
                                return [2 /*return*/, null];
                            throw err_1;
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Subscribe with retry + exponential backoff + DLQ + optional idempotency.
         * The wrapped handler is the ONLY place fault-tolerance policy lives.
         */
        BrokerService_1.prototype.subscribe = function (topic_1, group_1, handler_1) {
            return __awaiter(this, arguments, void 0, function (topic, group, handler, opts) {
                var maxAttempts, wrapped, stop;
                var _this = this;
                var _a;
                if (opts === void 0) { opts = {}; }
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            maxAttempts = (_a = opts.maxAttempts) !== null && _a !== void 0 ? _a : this.maxAttempts;
                            wrapped = function (msg) { return __awaiter(_this, void 0, void 0, function () {
                                var dedupeKey, first, lastErr, attempt, err_2, isLast;
                                var _a;
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0:
                                            if (!opts.idempotent) return [3 /*break*/, 2];
                                            dedupeKey = this.redis.key('idem', group, msg.id);
                                            return [4 /*yield*/, this.redis.client.set(dedupeKey, '1', 'EX', 3600, 'NX')];
                                        case 1:
                                            first = _b.sent();
                                            if (first === null) {
                                                this.logger.debug("duplicate ".concat(msg.id, " skipped (").concat(group, ")"));
                                                return [2 /*return*/];
                                            }
                                            _b.label = 2;
                                        case 2:
                                            attempt = 0;
                                            _b.label = 3;
                                        case 3:
                                            if (!(attempt < maxAttempts)) return [3 /*break*/, 10];
                                            _b.label = 4;
                                        case 4:
                                            _b.trys.push([4, 6, , 9]);
                                            return [4 /*yield*/, handler(msg)];
                                        case 5:
                                            _b.sent();
                                            return [2 /*return*/];
                                        case 6:
                                            err_2 = _b.sent();
                                            lastErr = err_2;
                                            isLast = attempt === maxAttempts - 1;
                                            this.logger.warn("".concat(topic, " handler attempt ").concat(attempt + 1, "/").concat(maxAttempts, " failed: ").concat(err_2.message));
                                            if (!!isLast) return [3 /*break*/, 8];
                                            return [4 /*yield*/, (0, backoff_1.sleep)((0, backoff_1.computeBackoff)(attempt))];
                                        case 7:
                                            _b.sent();
                                            _b.label = 8;
                                        case 8: return [3 /*break*/, 9];
                                        case 9:
                                            attempt++;
                                            return [3 /*break*/, 3];
                                        case 10:
                                            // --- Dead-letter -----------------------------------------------------
                                            this.logger.error("".concat(topic, " exhausted retries -> DLQ (msg=").concat(msg.id, ")"));
                                            return [4 /*yield*/, this.publish(topics_1.TOPICS.DEAD_LETTER, {
                                                    originalTopic: topic,
                                                    originalMessage: msg,
                                                    consumerGroup: group,
                                                    error: (_a = lastErr === null || lastErr === void 0 ? void 0 : lastErr.message) !== null && _a !== void 0 ? _a : 'unknown',
                                                    failedAt: Date.now(),
                                                    instanceId: this.instanceId,
                                                }, { safe: true }).catch(function () { return undefined; })];
                                        case 11:
                                            _b.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }); };
                            return [4 /*yield*/, this.transport.subscribe(topic, group, wrapped, opts)];
                        case 1:
                            stop = _b.sent();
                            this.unsubscribers.push(stop);
                            return [2 /*return*/];
                    }
                });
            });
        };
        /** Unique consumer group per instance => true broadcast fanout. */
        BrokerService_1.prototype.fanoutGroup = function (base) {
            return "".concat(base, ":").concat(this.instanceId);
        };
        BrokerService_1.prototype.health = function () {
            return __awaiter(this, void 0, void 0, function () {
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, this.transport.health()];
                        case 1: return [2 /*return*/, _b.sent()];
                        case 2:
                            _a = _b.sent();
                            return [2 /*return*/, false];
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        BrokerService_1.prototype.onModuleDestroy = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, Promise.allSettled(this.unsubscribers.map(function (u) { return u(); }))];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, this.transport.close().catch(function () { return undefined; })];
                        case 2:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        return BrokerService_1;
    }());
    __setFunctionName(_classThis, "BrokerService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        BrokerService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return BrokerService = _classThis;
}();
exports.BrokerService = BrokerService;
