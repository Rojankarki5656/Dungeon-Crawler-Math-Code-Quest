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
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEnv = validateEnv;
var class_transformer_1 = require("class-transformer");
var class_validator_1 = require("class-validator");
var EnvSchema = function () {
    var _a;
    var _NODE_ENV_decorators;
    var _NODE_ENV_initializers = [];
    var _NODE_ENV_extraInitializers = [];
    var _PORT_decorators;
    var _PORT_initializers = [];
    var _PORT_extraInitializers = [];
    var _CORS_ORIGIN_decorators;
    var _CORS_ORIGIN_initializers = [];
    var _CORS_ORIGIN_extraInitializers = [];
    var _REDIS_URL_decorators;
    var _REDIS_URL_initializers = [];
    var _REDIS_URL_extraInitializers = [];
    var _REDIS_KEY_PREFIX_decorators;
    var _REDIS_KEY_PREFIX_initializers = [];
    var _REDIS_KEY_PREFIX_extraInitializers = [];
    var _BROKER_TRANSPORT_decorators;
    var _BROKER_TRANSPORT_initializers = [];
    var _BROKER_TRANSPORT_extraInitializers = [];
    var _RABBITMQ_URL_decorators;
    var _RABBITMQ_URL_initializers = [];
    var _RABBITMQ_URL_extraInitializers = [];
    var _BROKER_MAX_ATTEMPTS_decorators;
    var _BROKER_MAX_ATTEMPTS_initializers = [];
    var _BROKER_MAX_ATTEMPTS_extraInitializers = [];
    var _BROKER_CONSUMER_NAME_decorators;
    var _BROKER_CONSUMER_NAME_initializers = [];
    var _BROKER_CONSUMER_NAME_extraInitializers = [];
    var _QUESTION_ASSET_CACHE_TTL_decorators;
    var _QUESTION_ASSET_CACHE_TTL_initializers = [];
    var _QUESTION_ASSET_CACHE_TTL_extraInitializers = [];
    var _ENCOUNTER_TTL_SECONDS_decorators;
    var _ENCOUNTER_TTL_SECONDS_initializers = [];
    var _ENCOUNTER_TTL_SECONDS_extraInitializers = [];
    return _a = /** @class */ (function () {
            function EnvSchema() {
                this.NODE_ENV = __runInitializers(this, _NODE_ENV_initializers, 'development');
                this.PORT = (__runInitializers(this, _NODE_ENV_extraInitializers), __runInitializers(this, _PORT_initializers, 4000));
                this.CORS_ORIGIN = (__runInitializers(this, _PORT_extraInitializers), __runInitializers(this, _CORS_ORIGIN_initializers, 'http://localhost:5173'));
                this.REDIS_URL = (__runInitializers(this, _CORS_ORIGIN_extraInitializers), __runInitializers(this, _REDIS_URL_initializers, 'redis://localhost:6379'));
                this.REDIS_KEY_PREFIX = (__runInitializers(this, _REDIS_URL_extraInitializers), __runInitializers(this, _REDIS_KEY_PREFIX_initializers, 'dcq'));
                this.BROKER_TRANSPORT = (__runInitializers(this, _REDIS_KEY_PREFIX_extraInitializers), __runInitializers(this, _BROKER_TRANSPORT_initializers, 'redis-streams'));
                this.RABBITMQ_URL = (__runInitializers(this, _BROKER_TRANSPORT_extraInitializers), __runInitializers(this, _RABBITMQ_URL_initializers, 'amqp://guest:guest@localhost:5672'));
                this.BROKER_MAX_ATTEMPTS = (__runInitializers(this, _RABBITMQ_URL_extraInitializers), __runInitializers(this, _BROKER_MAX_ATTEMPTS_initializers, 3));
                this.BROKER_CONSUMER_NAME = (__runInitializers(this, _BROKER_MAX_ATTEMPTS_extraInitializers), __runInitializers(this, _BROKER_CONSUMER_NAME_initializers, 'instance-1'));
                this.QUESTION_ASSET_CACHE_TTL = (__runInitializers(this, _BROKER_CONSUMER_NAME_extraInitializers), __runInitializers(this, _QUESTION_ASSET_CACHE_TTL_initializers, 900));
                this.ENCOUNTER_TTL_SECONDS = (__runInitializers(this, _QUESTION_ASSET_CACHE_TTL_extraInitializers), __runInitializers(this, _ENCOUNTER_TTL_SECONDS_initializers, 120));
                __runInitializers(this, _ENCOUNTER_TTL_SECONDS_extraInitializers);
            }
            return EnvSchema;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _NODE_ENV_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _PORT_decorators = [(0, class_transformer_1.Type)(function () { return Number; }), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(1), (0, class_validator_1.IsOptional)()];
            _CORS_ORIGIN_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _REDIS_URL_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _REDIS_KEY_PREFIX_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _BROKER_TRANSPORT_decorators = [(0, class_validator_1.IsIn)(['memory', 'redis-streams', 'rabbitmq']), (0, class_validator_1.IsOptional)()];
            _RABBITMQ_URL_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _BROKER_MAX_ATTEMPTS_decorators = [(0, class_transformer_1.Type)(function () { return Number; }), (0, class_validator_1.IsInt)(), (0, class_validator_1.IsOptional)()];
            _BROKER_CONSUMER_NAME_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _QUESTION_ASSET_CACHE_TTL_decorators = [(0, class_transformer_1.Type)(function () { return Number; }), (0, class_validator_1.IsInt)(), (0, class_validator_1.IsOptional)()];
            _ENCOUNTER_TTL_SECONDS_decorators = [(0, class_transformer_1.Type)(function () { return Number; }), (0, class_validator_1.IsInt)(), (0, class_validator_1.IsOptional)()];
            __esDecorate(null, null, _NODE_ENV_decorators, { kind: "field", name: "NODE_ENV", static: false, private: false, access: { has: function (obj) { return "NODE_ENV" in obj; }, get: function (obj) { return obj.NODE_ENV; }, set: function (obj, value) { obj.NODE_ENV = value; } }, metadata: _metadata }, _NODE_ENV_initializers, _NODE_ENV_extraInitializers);
            __esDecorate(null, null, _PORT_decorators, { kind: "field", name: "PORT", static: false, private: false, access: { has: function (obj) { return "PORT" in obj; }, get: function (obj) { return obj.PORT; }, set: function (obj, value) { obj.PORT = value; } }, metadata: _metadata }, _PORT_initializers, _PORT_extraInitializers);
            __esDecorate(null, null, _CORS_ORIGIN_decorators, { kind: "field", name: "CORS_ORIGIN", static: false, private: false, access: { has: function (obj) { return "CORS_ORIGIN" in obj; }, get: function (obj) { return obj.CORS_ORIGIN; }, set: function (obj, value) { obj.CORS_ORIGIN = value; } }, metadata: _metadata }, _CORS_ORIGIN_initializers, _CORS_ORIGIN_extraInitializers);
            __esDecorate(null, null, _REDIS_URL_decorators, { kind: "field", name: "REDIS_URL", static: false, private: false, access: { has: function (obj) { return "REDIS_URL" in obj; }, get: function (obj) { return obj.REDIS_URL; }, set: function (obj, value) { obj.REDIS_URL = value; } }, metadata: _metadata }, _REDIS_URL_initializers, _REDIS_URL_extraInitializers);
            __esDecorate(null, null, _REDIS_KEY_PREFIX_decorators, { kind: "field", name: "REDIS_KEY_PREFIX", static: false, private: false, access: { has: function (obj) { return "REDIS_KEY_PREFIX" in obj; }, get: function (obj) { return obj.REDIS_KEY_PREFIX; }, set: function (obj, value) { obj.REDIS_KEY_PREFIX = value; } }, metadata: _metadata }, _REDIS_KEY_PREFIX_initializers, _REDIS_KEY_PREFIX_extraInitializers);
            __esDecorate(null, null, _BROKER_TRANSPORT_decorators, { kind: "field", name: "BROKER_TRANSPORT", static: false, private: false, access: { has: function (obj) { return "BROKER_TRANSPORT" in obj; }, get: function (obj) { return obj.BROKER_TRANSPORT; }, set: function (obj, value) { obj.BROKER_TRANSPORT = value; } }, metadata: _metadata }, _BROKER_TRANSPORT_initializers, _BROKER_TRANSPORT_extraInitializers);
            __esDecorate(null, null, _RABBITMQ_URL_decorators, { kind: "field", name: "RABBITMQ_URL", static: false, private: false, access: { has: function (obj) { return "RABBITMQ_URL" in obj; }, get: function (obj) { return obj.RABBITMQ_URL; }, set: function (obj, value) { obj.RABBITMQ_URL = value; } }, metadata: _metadata }, _RABBITMQ_URL_initializers, _RABBITMQ_URL_extraInitializers);
            __esDecorate(null, null, _BROKER_MAX_ATTEMPTS_decorators, { kind: "field", name: "BROKER_MAX_ATTEMPTS", static: false, private: false, access: { has: function (obj) { return "BROKER_MAX_ATTEMPTS" in obj; }, get: function (obj) { return obj.BROKER_MAX_ATTEMPTS; }, set: function (obj, value) { obj.BROKER_MAX_ATTEMPTS = value; } }, metadata: _metadata }, _BROKER_MAX_ATTEMPTS_initializers, _BROKER_MAX_ATTEMPTS_extraInitializers);
            __esDecorate(null, null, _BROKER_CONSUMER_NAME_decorators, { kind: "field", name: "BROKER_CONSUMER_NAME", static: false, private: false, access: { has: function (obj) { return "BROKER_CONSUMER_NAME" in obj; }, get: function (obj) { return obj.BROKER_CONSUMER_NAME; }, set: function (obj, value) { obj.BROKER_CONSUMER_NAME = value; } }, metadata: _metadata }, _BROKER_CONSUMER_NAME_initializers, _BROKER_CONSUMER_NAME_extraInitializers);
            __esDecorate(null, null, _QUESTION_ASSET_CACHE_TTL_decorators, { kind: "field", name: "QUESTION_ASSET_CACHE_TTL", static: false, private: false, access: { has: function (obj) { return "QUESTION_ASSET_CACHE_TTL" in obj; }, get: function (obj) { return obj.QUESTION_ASSET_CACHE_TTL; }, set: function (obj, value) { obj.QUESTION_ASSET_CACHE_TTL = value; } }, metadata: _metadata }, _QUESTION_ASSET_CACHE_TTL_initializers, _QUESTION_ASSET_CACHE_TTL_extraInitializers);
            __esDecorate(null, null, _ENCOUNTER_TTL_SECONDS_decorators, { kind: "field", name: "ENCOUNTER_TTL_SECONDS", static: false, private: false, access: { has: function (obj) { return "ENCOUNTER_TTL_SECONDS" in obj; }, get: function (obj) { return obj.ENCOUNTER_TTL_SECONDS; }, set: function (obj, value) { obj.ENCOUNTER_TTL_SECONDS = value; } }, metadata: _metadata }, _ENCOUNTER_TTL_SECONDS_initializers, _ENCOUNTER_TTL_SECONDS_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
function validateEnv(raw) {
    var parsed = (0, class_transformer_1.plainToInstance)(EnvSchema, raw, { enableImplicitConversion: true });
    var errors = (0, class_validator_1.validateSync)(parsed, { skipMissingProperties: false });
    if (errors.length)
        throw new Error("Invalid env config: ".concat(errors.toString()));
    return parsed;
}
