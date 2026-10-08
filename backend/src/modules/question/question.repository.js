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
exports.QuestionRepository = void 0;
var common_1 = require("@nestjs/common");
var prng_1 = require("../../common/utils/prng");
var TEMPLATES = [
    // ---- MATH ----------------------------------------------------------
    { kind: 'math', difficulty: 1, build: function (r) {
            var a = r.int(2, 12), b = r.int(2, 12);
            return { prompt: "".concat(a, " + ").concat(b, " = ?"), answer: String(a + b) };
        } },
    { kind: 'math', difficulty: 1, build: function (r) {
            var a = r.int(10, 25), b = r.int(2, 9);
            return { prompt: "".concat(a, " - ").concat(b, " = ?"), answer: String(a - b) };
        } },
    { kind: 'math', difficulty: 2, build: function (r) {
            var a = r.int(3, 12), b = r.int(3, 12);
            return { prompt: "".concat(a, " * ").concat(b, " = ?"), answer: String(a * b) };
        } },
    { kind: 'math', difficulty: 3, build: function (r) {
            var b = r.int(3, 12), q = r.int(3, 12);
            return { prompt: "".concat(b * q, " / ").concat(b, " = ?"), answer: String(q) };
        } },
    { kind: 'math', difficulty: 2, build: function (r) {
            var a = r.int(2, 9);
            return { prompt: "".concat(a, " ^ 2 = ?"), answer: String(a * a) };
        } },
    { kind: 'math', difficulty: 3, build: function (r) {
            var a = r.int(2, 6), b = r.int(2, 5), c = r.int(2, 20);
            return { prompt: "".concat(a, " * ").concat(b, " + ").concat(c, " = ?"), answer: String(a * b + c) };
        } },
    { kind: 'math', difficulty: 2, build: function (r) {
            var n = r.int(3, 15);
            var f = 1;
            for (var i = 2; i <= n; i++)
                f *= i;
            return { prompt: "".concat(n, "! MOD 100 = ?"), answer: String(f % 100) };
        } },
    // ---- CODE ----------------------------------------------------------
    { kind: 'code', difficulty: 1, build: function (r) {
            var arr = Array.from({ length: 5 }, function () { return r.int(1, 9); });
            return { prompt: "LEN([".concat(arr.join(','), "]) = ?"), answer: String(arr.length) };
        } },
    { kind: 'code', difficulty: 2, build: function (r) {
            var arr = Array.from({ length: 5 }, function () { return r.int(1, 20); });
            var sum = arr.reduce(function (a, b) { return a + b; }, 0);
            return { prompt: "SUM([".concat(arr.join(','), "]) = ?"), answer: String(sum) };
        } },
    { kind: 'code', difficulty: 2, build: function (r) {
            var arr = Array.from({ length: 6 }, function () { return r.int(1, 30); });
            return { prompt: "MAX([".concat(arr.join(','), "]) = ?"), answer: String(Math.max.apply(Math, arr)) };
        } },
    { kind: 'code', difficulty: 3, build: function (r) {
            var arr = Array.from({ length: 6 }, function () { return r.int(1, 15); });
            var sorted = __spreadArray([], arr, true).sort(function (a, b) { return a - b; });
            var mid = Math.floor(sorted.length / 2);
            return {
                prompt: "MEDIAN([".concat(arr.join(','), "]) = ?"),
                answer: String(sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2),
            };
        } },
    { kind: 'code', difficulty: 3, build: function (r) {
            var base = r.int(2, 5), exp = r.int(3, 7);
            var v = 1;
            for (var i = 0; i < exp; i++)
                v *= base;
            return { prompt: "POW(".concat(base, ",").concat(exp, ") = ?"), answer: String(v) };
        } },
    { kind: 'code', difficulty: 2, build: function (r) {
            var n = r.int(5, 20);
            var fib = [0, 1];
            while (fib.length <= n)
                fib.push(fib.at(-1) + fib.at(-2));
            return { prompt: "FIB(".concat(n, ") = ?"), answer: String(fib[n]) };
        } },
];
var DIFFICULTY_DAMAGE = { 1: 8, 2: 14, 3: 22 };
var QuestionRepository = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var QuestionRepository = _classThis = /** @class */ (function () {
        function QuestionRepository_1() {
        }
        /**
         * Deterministic question generation.
         * Same `questionId` ALWAYS yields the same prompt & answer — this is what
         * makes the async fetch pipeline + Redis caching + ETags safe.
         */
        QuestionRepository_1.prototype.getById = function (questionId) {
            var rng = new prng_1.Rng((0, prng_1.hashString)(questionId));
            var template = TEMPLATES[rng.int(0, TEMPLATES.length - 1)];
            var _a = template.build(rng), prompt = _a.prompt, answer = _a.answer;
            return {
                id: questionId,
                prompt: prompt,
                answer: answer,
                difficulty: template.difficulty,
                kind: template.kind,
                damage: DIFFICULTY_DAMAGE[template.difficulty],
            };
        };
        QuestionRepository_1.prototype.generateId = function (difficulty) {
            var _a;
            if (difficulty === void 0) { difficulty = 2; }
            var pool = TEMPLATES.filter(function (t) { return t.difficulty === difficulty; });
            var t = (_a = pool[Math.floor(Math.random() * pool.length)]) !== null && _a !== void 0 ? _a : TEMPLATES[0];
            var kindIdx = TEMPLATES.indexOf(t);
            return "q-".concat(kindIdx, "-").concat(Date.now().toString(36), "-").concat(Math.random().toString(36).slice(2, 8));
        };
        return QuestionRepository_1;
    }());
    __setFunctionName(_classThis, "QuestionRepository");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        QuestionRepository = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return QuestionRepository = _classThis;
}();
exports.QuestionRepository = QuestionRepository;
