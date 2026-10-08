"use strict";
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
exports.renderQuestionPng = renderQuestionPng;
var pngjs_1 = require("pngjs");
var pixel_font_1 = require("./pixel-font");
/**
 * Deterministic PNG renderer — draws uppercase ASCII text onto a raw RGBA
 * buffer with a 5x7 bitmap font, then encodes with pngjs.
 * No native deps, no font files, fully reproducible output => stable ETags.
 */
function renderQuestionPng(lines, options) {
    if (options === void 0) { options = {}; }
    var _a = options.scale, scale = _a === void 0 ? 4 : _a, _b = options.padding, padding = _b === void 0 ? 10 : _b, _c = options.bg, bg = _c === void 0 ? [11, 15, 26, 255] : _c, _d = options.fg, fg = _d === void 0 ? [232, 241, 255, 255] : _d, _e = options.accent, accent = _e === void 0 ? [255, 209, 102, 255] : _e, _f = options.lineGap, lineGap = _f === void 0 ? 4 : _f, _g = options.glyphGap, glyphGap = _g === void 0 ? 1 : _g;
    var safeLines = lines.map(function (l) { return l.toUpperCase(); });
    var maxCols = Math.max.apply(Math, __spreadArray([1], safeLines.map(function (l) { return l.length; }), false));
    var cols = maxCols;
    var contentW = cols * (pixel_font_1.GLYPH_W + glyphGap) * scale;
    var contentH = (safeLines.length * (pixel_font_1.GLYPH_H + lineGap) - lineGap) * scale;
    var width = contentW + padding * 2;
    var height = contentH + padding * 2;
    var png = new pngjs_1.PNG({ width: width, height: height });
    // --- Background + outer pixel border ---------------------------------
    fillRect(png, 0, 0, width, height, bg);
    drawBorder(png, 0, 0, width, height, accent, 2 * scale, scale);
    // --- Glyphs ------------------------------------------------------------
    safeLines.forEach(function (line, lineIdx) {
        var _a;
        var rowOffsetY = padding + lineIdx * (pixel_font_1.GLYPH_H + lineGap) * scale;
        // Center each line horizontally for a clean card look.
        var lineW = line.length * (pixel_font_1.GLYPH_W + glyphGap) * scale - glyphGap * scale;
        var rowOffsetX = Math.floor((width - lineW) / 2);
        for (var i = 0; i < line.length; i++) {
            var glyph = (_a = pixel_font_1.FONT_5X7[line[i]]) !== null && _a !== void 0 ? _a : pixel_font_1.FONT_5X7['?'];
            var gx = rowOffsetX + i * (pixel_font_1.GLYPH_W + glyphGap) * scale;
            for (var ry = 0; ry < pixel_font_1.GLYPH_H; ry++) {
                var bits = glyph[ry];
                for (var rx = 0; rx < pixel_font_1.GLYPH_W; rx++) {
                    if (bits[rx] !== '1')
                        continue;
                    fillRect(png, gx + rx * scale, rowOffsetY + ry * scale, scale, scale, fg);
                }
            }
        }
    });
    var buffer = pngjs_1.PNG.sync.write(png, { colorType: 6, inputColorType: 6 });
    return { buffer: buffer, width: width, height: height, etag: "\"png-".concat(width, "x").concat(height, "-").concat(hashBuffer(buffer), "\"") };
}
function fillRect(png, x, y, w, h, rgba) {
    var r = rgba[0], g = rgba[1], b = rgba[2], a = rgba[3];
    var x0 = Math.max(0, x), y0 = Math.max(0, y);
    var x1 = Math.min(png.width, x + w), y1 = Math.min(png.height, y + h);
    for (var py = y0; py < y1; py++) {
        for (var px = x0; px < x1; px++) {
            var idx = (png.width * py + px) << 2;
            png.data[idx] = r;
            png.data[idx + 1] = g;
            png.data[idx + 2] = b;
            png.data[idx + 3] = a;
        }
    }
}
function drawBorder(png, x, y, w, h, rgba, thickness, dash) {
    for (var i = 0; i < thickness; i++) {
        for (var px = x; px < x + w; px++) {
            if (Math.floor(px / dash) % 2 === 0) {
                fillRect(png, px, y + i, 1, 1, rgba);
                fillRect(png, px, y + h - 1 - i, 1, 1, rgba);
            }
        }
        for (var py = y; py < y + h; py++) {
            if (Math.floor(py / dash) % 2 === 0) {
                fillRect(png, x + i, py, 1, 1, rgba);
                fillRect(png, x + w - 1 - i, py, 1, 1, rgba);
            }
        }
    }
}
function hashBuffer(buf) {
    var h = 2166136261 >>> 0;
    for (var i = 0; i < buf.length; i += 7) {
        h ^= buf[i];
        h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(36);
}
