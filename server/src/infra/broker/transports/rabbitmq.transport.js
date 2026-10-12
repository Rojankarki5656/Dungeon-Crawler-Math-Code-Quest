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
exports.RabbitMqTransport = void 0;
var common_1 = require("@nestjs/common");
var crypto_1 = require("crypto");
var amqp = require("amqplib");
/**
 * RabbitMQ transport — topic exchange + per-topic work queue + DLX.
 * Swap in via BROKER_TRANSPORT=rabbitmq, zero application code changes.
 */
var RabbitMqTransport = /** @class */ (function () {
    function RabbitMqTransport(url) {
        this.url = url;
        this.name = 'rabbitmq';
        this.logger = new common_1.Logger(RabbitMqTransport.name);
        this.consumers = [];
        this.closing = false;
    }
    RabbitMqTransport.prototype.ensureConnection = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (this.conn)
                            return [2 /*return*/];
                        _a = this;
                        return [4 /*yield*/, amqp.connect(this.url)];
                    case 1:
                        _a.conn = _b.sent();
                        this.conn.on('error', function (e) { return _this.logger.error("conn: ".concat(e.message)); });
                        this.conn.on('close', function () {
                            _this.conn = undefined;
                            _this.pubChannel = undefined;
                            if (!_this.closing)
                                setTimeout(function () { return void _this.ensureConnection().catch(function () { }); }, 1500);
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    RabbitMqTransport.prototype.ensurePublisher = function () {
        return __awaiter(this, void 0, void 0, function () {
            var ch;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.ensureConnection()];
                    case 1:
                        _a.sent();
                        if (this.pubChannel)
                            return [2 /*return*/, this.pubChannel];
                        return [4 /*yield*/, this.conn.createChannel()];
                    case 2:
                        ch = _a.sent();
                        return [4 /*yield*/, ch.assertExchange('dcq.events', 'topic', { durable: true })];
                    case 3:
                        _a.sent();
                        this.pubChannel = ch;
                        return [2 /*return*/, ch];
                }
            });
        });
    };
    RabbitMqTransport.prototype.publish = function (topic_1, payload_1) {
        return __awaiter(this, arguments, void 0, function (topic, payload, opts) {
            var ch, id;
            if (opts === void 0) { opts = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.ensurePublisher()];
                    case 1:
                        ch = _a.sent();
                        id = (0, crypto_1.randomUUID)();
                        ch.publish('dcq.events', topic, Buffer.from(JSON.stringify(payload)), {
                            persistent: true,
                            messageId: id,
                            correlationId: opts.correlationId,
                            headers: __assign({ attempts: 0 }, opts.headers),
                            expiration: opts.delayMs ? String(opts.delayMs) : undefined,
                        });
                        return [2 /*return*/, id];
                }
            });
        });
    };
    RabbitMqTransport.prototype.subscribe = function (topic_1, group_1, handler_1) {
        return __awaiter(this, arguments, void 0, function (topic, group, handler, opts) {
            var ch, exchange, dlx, queue, dlq, consumerTag;
            var _this = this;
            var _a;
            if (opts === void 0) { opts = {}; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.ensureConnection()];
                    case 1:
                        _b.sent();
                        return [4 /*yield*/, this.conn.createChannel()];
                    case 2:
                        ch = _b.sent();
                        return [4 /*yield*/, ch.prefetch((_a = opts.prefetch) !== null && _a !== void 0 ? _a : 10)];
                    case 3:
                        _b.sent();
                        exchange = 'dcq.events';
                        dlx = 'dcq.dlx';
                        queue = "q.".concat(topic, ".").concat(group);
                        dlq = "q.dlq.".concat(topic, ".").concat(group);
                        return [4 /*yield*/, ch.assertExchange(exchange, 'topic', { durable: true })];
                    case 4:
                        _b.sent();
                        return [4 /*yield*/, ch.assertExchange(dlx, 'topic', { durable: true })];
                    case 5:
                        _b.sent();
                        return [4 /*yield*/, ch.assertQueue(dlq, { durable: true })];
                    case 6:
                        _b.sent();
                        return [4 /*yield*/, ch.bindQueue(dlq, dlx, topic)];
                    case 7:
                        _b.sent();
                        return [4 /*yield*/, ch.assertQueue(queue, {
                                durable: true,
                                deadLetterExchange: dlx,
                                deadLetterRoutingKey: topic,
                            })];
                    case 8:
                        _b.sent();
                        return [4 /*yield*/, ch.bindQueue(queue, exchange, topic)];
                    case 9:
                        _b.sent();
                        return [4 /*yield*/, ch.consume(queue, function (raw) { return __awaiter(_this, void 0, void 0, function () {
                                var attempts, payload, msg, err_1, max;
                                var _a, _b, _c, _d;
                                return __generator(this, function (_e) {
                                    switch (_e.label) {
                                        case 0:
                                            if (!raw)
                                                return [2 /*return*/];
                                            attempts = Number((_b = (_a = raw.properties.headers) === null || _a === void 0 ? void 0 : _a.attempts) !== null && _b !== void 0 ? _b : 0);
                                            _e.label = 1;
                                        case 1:
                                            _e.trys.push([1, 3, , 4]);
                                            payload = JSON.parse(raw.content.toString());
                                            msg = {
                                                id: (_c = raw.properties.messageId) !== null && _c !== void 0 ? _c : (0, crypto_1.randomUUID)(),
                                                topic: topic,
                                                payload: payload,
                                                attempts: attempts,
                                                enqueuedAt: Date.now(),
                                                correlationId: raw.properties.correlationId,
                                            };
                                            return [4 /*yield*/, handler(msg)];
                                        case 2:
                                            _e.sent();
                                            ch.ack(raw);
                                            return [3 /*break*/, 4];
                                        case 3:
                                            err_1 = _e.sent();
                                            max = (_d = opts.maxAttempts) !== null && _d !== void 0 ? _d : 3;
                                            if (attempts + 1 >= max) {
                                                this.logger.warn("DLQ ".concat(topic, " after ").concat(attempts + 1, " attempts: ").concat(err_1.message));
                                                ch.nack(raw, false, false); // routes to DLX
                                            }
                                            else {
                                                // requeue with incremented attempt counter
                                                ch.publish(exchange, topic, raw.content, __assign(__assign({}, raw.properties), { headers: __assign(__assign({}, raw.properties.headers), { attempts: attempts + 1 }) }));
                                                ch.ack(raw);
                                            }
                                            return [3 /*break*/, 4];
                                        case 4: return [2 /*return*/];
                                    }
                                });
                            }); })];
                    case 10:
                        consumerTag = (_b.sent()).consumerTag;
                        this.consumers.push({ channel: ch, tag: consumerTag });
                        return [2 /*return*/, function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, ch.cancel(consumerTag).catch(function () { })];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            }); }); }];
                }
            });
        });
    };
    RabbitMqTransport.prototype.health = function () {
        return __awaiter(this, void 0, void 0, function () { var _a; return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, this.ensureConnection()];
                case 1:
                    _b.sent();
                    return [2 /*return*/, !!this.conn];
                case 2:
                    _a = _b.sent();
                    return [2 /*return*/, false];
                case 3: return [2 /*return*/];
            }
        }); });
    };
    RabbitMqTransport.prototype.close = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        this.closing = true;
                        return [4 /*yield*/, Promise.allSettled(this.consumers.map(function (c) { return c.channel.close(); }))];
                    case 1:
                        _c.sent();
                        return [4 /*yield*/, ((_a = this.pubChannel) === null || _a === void 0 ? void 0 : _a.close().catch(function () { }))];
                    case 2:
                        _c.sent();
                        return [4 /*yield*/, ((_b = this.conn) === null || _b === void 0 ? void 0 : _b.close().catch(function () { }))];
                    case 3:
                        _c.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return RabbitMqTransport;
}());
exports.RabbitMqTransport = RabbitMqTransport;
