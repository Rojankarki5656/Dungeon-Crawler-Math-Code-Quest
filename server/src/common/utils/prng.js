"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Rng = void 0;
exports.mulberry32 = mulberry32;
exports.hashString = hashString;
/** mulberry32 — tiny, fast, deterministic. Same seed => same dungeon. */
function mulberry32(seed) {
    var a = seed >>> 0;
    return function next() {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        var t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
function hashString(input) {
    var h = 2166136261 >>> 0;
    for (var i = 0; i < input.length; i++) {
        h ^= input.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}
var Rng = /** @class */ (function () {
    function Rng(seed) {
        this.next = mulberry32(typeof seed === 'string' ? hashString(seed) : seed);
    }
    Rng.prototype.float = function (min, max) {
        if (min === void 0) { min = 0; }
        if (max === void 0) { max = 1; }
        return min + this.next() * (max - min);
    };
    Rng.prototype.int = function (min, max) { return Math.floor(this.float(min, max + 1)); };
    Rng.prototype.pick = function (arr) { return arr[this.int(0, arr.length - 1)]; };
    Rng.prototype.chance = function (p) { return this.next() < p; };
    return Rng;
}());
exports.Rng = Rng;
