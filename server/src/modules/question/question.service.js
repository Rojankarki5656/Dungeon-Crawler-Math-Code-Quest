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
exports.QuestionService = void 0;
var common_1 = require("@nestjs/common");
var QuestionService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var QuestionService = _classThis = /** @class */ (function () {
        function QuestionService_1(repo, assets) {
            this.repo = repo;
            this.assets = assets;
        }
        /** Full question INCLUDING solution — server-side only. */
        QuestionService_1.prototype.getInternal = function (id) {
            return this.repo.getById(id);
        };
        /** Safe, client-facing projection — solution stripped. */
        QuestionService_1.prototype.getPublic = function (id) {
            var q = this.repo.getById(id);
            return {
                id: q.id,
                prompt: q.prompt,
                kind: q.kind,
                difficulty: q.difficulty,
                damage: q.damage,
                imageUrl: "/api/questions/".concat(q.id, "/image.png"),
            };
        };
        QuestionService_1.prototype.nextId = function (difficulty) {
            if (difficulty === void 0) { difficulty = 2; }
            return this.repo.generateId(difficulty);
        };
        QuestionService_1.prototype.render = function (id) {
            return this.assets.getAsset(id);
        };
        QuestionService_1.prototype.warm = function (id) {
            return this.assets.warm(id);
        };
        /** Constant-time-ish comparison to avoid timing side-channels. */
        QuestionService_1.prototype.verify = function (questionId, submitted) {
            var expected = this.repo.getById(questionId).answer.trim().toLowerCase();
            var got = submitted.trim().toLowerCase();
            if (expected.length !== got.length)
                return false;
            var diff = 0;
            for (var i = 0; i < expected.length; i++) {
                diff |= expected.charCodeAt(i) ^ got.charCodeAt(i);
            }
            return diff === 0;
        };
        return QuestionService_1;
    }());
    __setFunctionName(_classThis, "QuestionService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        QuestionService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return QuestionService = _classThis;
}();
exports.QuestionService = QuestionService;
