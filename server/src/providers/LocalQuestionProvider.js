import { Resvg } from "@resvg/resvg-js";
import { QuestionProvider } from "./QuestionProvider.js";

/** Difficulty-scaled random math question generator. Renders text to PNG via SVG. */
export class LocalQuestionProvider extends QuestionProvider {
  get name() { return "local"; }

  async generate({ difficulty = 1 } = {}) {
    const { text, answer } = this._makeQuestion(difficulty);
    const pngBuffer = this._renderPng(text);
    return { pngBuffer, correctAnswer: String(answer), difficulty };
  }

  _makeQuestion(d) {
    const r = (n) => Math.floor(Math.random() * n);
    const level = Math.max(1, Math.min(6, d));
    const type = this._pickType(level);

    switch (type) {
      case "add": {
        const hi = level * 20; const a = r(hi) + 1, b = r(hi) + 1;
        return { text: `${a} + ${b} = ?`, answer: a + b };
      }
      case "sub": {
        const hi = level * 20; const a = r(hi) + hi, b = r(hi) + 1;
        return { text: `${a} − ${b} = ?`, answer: a - b };
      }
      case "mul": {
        const hi = Math.min(12, 2 + level * 2); const a = r(hi) + 1, b = r(hi) + 1;
        return { text: `${a} × ${b} = ?`, answer: a * b };
      }
      case "div": {
        const b = r(Math.min(12, 2 + level)) + 2; const q = r(Math.min(12, 2 + level)) + 1;
        return { text: `${b * q} ÷ ${b} = ?`, answer: q };
      }
      case "frac": {
        const den = r(4) + 2; const num = r(den - 1) + 1; const mult = r(6) + 1;
        return { text: `${num}/${den} of ${den * mult} = ?`, answer: num * mult };
      }
      case "alg":
      default: {
        const x = r(10) + 1; const a = r(5) + 2; const b = r(20);
        return { text: `Solve: ${a}x + ${b} = ${a * x + b}`, answer: x };
      }
    }
  }

  _pickType(level) {
    const pool = ["add", "sub"];
    if (level >= 2) pool.push("mul");
    if (level >= 3) pool.push("div");
    if (level >= 4) pool.push("frac");
    if (level >= 5) pool.push("alg");
    return pool[Math.floor(Math.random() * pool.length)];
  }

  _renderPng(text) {
    const w = 640, h = 200;
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
        <rect width="100%" height="100%" fill="#0f0d18"/>
        <rect x="4" y="4" width="${w - 8}" height="${h - 8}" fill="none" stroke="#c9a227" stroke-width="3"/>
        <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"
              font-family="monospace" font-size="44" fill="#f5e7b8">${this._escape(text)}</text>
      </svg>`;
    const resvg = new Resvg(svg, { fitTo: { mode: "width", value: w } });
    return resvg.render().asPng();
  }

  _escape(s) {
    return s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]));
  }
}