"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sleep = void 0;
exports.computeBackoff = computeBackoff;
function computeBackoff(attempt, opts) {
    if (opts === void 0) { opts = {}; }
    var _a = opts.baseMs, baseMs = _a === void 0 ? 100 : _a, _b = opts.maxMs, maxMs = _b === void 0 ? 8000 : _b, _c = opts.jitter, jitter = _c === void 0 ? true : _c;
    var raw = Math.min(maxMs, baseMs * Math.pow(2, attempt));
    if (!jitter)
        return raw;
    // Full jitter — prevents thundering herd on retry storms.
    return Math.floor(Math.random() * raw);
}
var sleep = function (ms) { return new Promise(function (r) { return setTimeout(r, ms); }); };
exports.sleep = sleep;
