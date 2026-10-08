"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (function () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    return ({
        env: (_a = process.env.NODE_ENV) !== null && _a !== void 0 ? _a : 'development',
        port: parseInt((_b = process.env.PORT) !== null && _b !== void 0 ? _b : '4000', 10),
        corsOrigin: (_c = process.env.CORS_ORIGIN) !== null && _c !== void 0 ? _c : 'http://localhost:5173',
        redis: {
            url: (_d = process.env.REDIS_URL) !== null && _d !== void 0 ? _d : 'redis://localhost:6379',
            keyPrefix: (_e = process.env.REDIS_KEY_PREFIX) !== null && _e !== void 0 ? _e : 'dcq',
        },
        broker: {
            transport: (_f = process.env.BROKER_TRANSPORT) !== null && _f !== void 0 ? _f : 'redis-streams',
            rabbitUrl: (_g = process.env.RABBITMQ_URL) !== null && _g !== void 0 ? _g : 'amqp://guest:guest@localhost:5672',
            maxAttempts: parseInt((_h = process.env.BROKER_MAX_ATTEMPTS) !== null && _h !== void 0 ? _h : '3', 10),
            consumerName: (_j = process.env.BROKER_CONSUMER_NAME) !== null && _j !== void 0 ? _j : "instance-".concat(process.pid),
        },
        game: {
            questionAssetCacheTtl: parseInt((_k = process.env.QUESTION_ASSET_CACHE_TTL) !== null && _k !== void 0 ? _k : '900', 10),
            encounterTtlSeconds: parseInt((_l = process.env.ENCOUNTER_TTL_SECONDS) !== null && _l !== void 0 ? _l : '120', 10),
        },
    });
});
