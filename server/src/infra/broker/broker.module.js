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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrokerModule = void 0;
var common_1 = require("@nestjs/common");
var config_1 = require("@nestjs/config");
var redis_service_1 = require("../redis/redis.service");
var broker_service_1 = require("./broker.service");
var broker_types_1 = require("./broker.types");
var memory_transport_1 = require("./transports/memory.transport");
var redis_streams_transport_1 = require("./transports/redis-streams.transport");
var rabbitmq_transport_1 = require("./transports/rabbitmq.transport");
var transportProvider = {
    provide: broker_types_1.BROKER_TRANSPORT,
    inject: [config_1.ConfigService, redis_service_1.RedisService],
    useFactory: function (config, redis) {
        var kind = config.get('broker.transport', 'redis-streams');
        var logger = new common_1.Logger('BrokerTransportFactory');
        switch (kind) {
            case 'memory':
                logger.warn('Using in-memory broker (dev/test only)');
                return new memory_transport_1.MemoryTransport();
            case 'rabbitmq':
                return new rabbitmq_transport_1.RabbitMqTransport(config.get('broker.rabbitUrl'));
            case 'redis-streams':
            default:
                return new redis_streams_transport_1.RedisStreamsTransport(redis);
        }
    },
};
var BrokerModule = function () {
    var _classDecorators = [(0, common_1.Global)(), (0, common_1.Module)({
            providers: [transportProvider, broker_service_1.BrokerService],
            exports: [broker_service_1.BrokerService, broker_types_1.BROKER_TRANSPORT],
        })];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var BrokerModule = _classThis = /** @class */ (function () {
        function BrokerModule_1() {
        }
        return BrokerModule_1;
    }());
    __setFunctionName(_classThis, "BrokerModule");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        BrokerModule = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return BrokerModule = _classThis;
}();
exports.BrokerModule = BrokerModule;
