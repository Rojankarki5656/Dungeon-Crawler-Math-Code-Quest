import axios from "axios";
import { QuestionProvider } from "./QuestionProvider.js";
import { env } from "../config/env.js";
import { ExternalAPIError } from "../errors/index.js";
import { APIRequestLog } from "../models/APIRequestLog.js";

/**
 * Adapter for the teacher-provided math API.
 *
 * Real wire format (Banana API — marcconrad.com/uob/banana/api.php):
 *   → { "question": "https://www.sanfoh.com/uob/banana/data/xxx.png",
 *        "solution": 6 }
 *
 * The `question` field is a URL to a PNG that must be fetched separately.
 * The `solution` field is the numeric answer.
 *
 * The Banana API does not accept a difficulty parameter — it returns a
 * random question every time. To honour the player's level, the local
 * fallback provider is used when difficulty-scaled questions matter; the
 * teacher API is used opportunistically and its questions are labelled with
 * the difficulty the caller requested.
 *
 * Robustness: `_normalise` also tolerates (a) a raw binary PNG with the
 * answer in an `x-answer` header, and (b) JSON with `image`/`answer` fields,
 * in case the endpoint is ever swapped for a different implementation.
 */
export class TeacherAPIProvider extends QuestionProvider {
  get name() { return "teacher"; }

  async generate({ difficulty = 1 } = {}) {
    if (!env.teacherApi.enabled || !env.teacherApi.url) {
      throw new ExternalAPIError("Teacher API disabled");
    }

    const started = Date.now();
    try {
      const res = await axios.get(env.teacherApi.url, {
        timeout: env.teacherApi.timeout,
        responseType: "arraybuffer",
        validateStatus: (s) => s >= 200 && s < 300,
        // NOTE: no `difficulty` param — the Banana API doesn't accept one.
      });

      const normalised = await this._normalise(res, difficulty);

      await APIRequestLog.create({
        provider: "teacher",
        status: "success",
        responseTimeMs: Date.now() - started,
        endpoint: env.teacherApi.url,
      });
      return normalised;
    } catch (err) {
      await APIRequestLog.create({
        provider: "teacher",
        status: "failure",
        responseTimeMs: Date.now() - started,
        errorMessage: err.message,
        endpoint: env.teacherApi.url,
      }).catch(() => {});
      throw new ExternalAPIError("Teacher API request failed", { cause: err.message });
    }
  }

  async _normalise(res, requestedDifficulty = 1) {
    const contentType = String(res.headers?.["content-type"] || "").toLowerCase();

    // --- Case 1: raw binary PNG (defensive fallback, not used by Banana) ---
    if (contentType.includes("image/") || contentType.includes("application/octet-stream")) {
      const buf = Buffer.from(res.data);
      const answer = res.headers["x-answer"];
      if (!answer) throw new ExternalAPIError("Binary response missing x-answer header");
      return { pngBuffer: buf, correctAnswer: String(answer), difficulty: requestedDifficulty };
    }

    // --- Case 2: JSON (this is the Banana API's actual format) ---
    let json;
    try {
      json = JSON.parse(Buffer.from(res.data).toString("utf8"));
    } catch {
      throw new ExternalAPIError("Teacher API returned non-JSON body");
    }

    // Banana uses `solution`; the alt-shape uses `answer`.
    const rawAnswer = json.solution ?? json.answer;
    if (rawAnswer === undefined || rawAnswer === null) {
      throw new ExternalAPIError("Teacher API response missing solution/answer");
    }

    // Banana uses `question` (URL); alt-shape uses `image` (URL or base64).
    let pngBuffer;

    if (typeof json.question === "string" && /^https?:\/\//.test(json.question)) {
      // ── Banana path: fetch the PNG from the returned URL ──
      const img = await axios.get(json.question, {
        responseType: "arraybuffer",
        timeout: env.teacherApi.timeout,
      });
      pngBuffer = Buffer.from(img.data);
    } else if (typeof json.image === "string" && /^https?:\/\//.test(json.image)) {
      const img = await axios.get(json.image, {
        responseType: "arraybuffer",
        timeout: env.teacherApi.timeout,
      });
      pngBuffer = Buffer.from(img.data);
    } else if (typeof json.image === "string") {
      // base64 data-URL or bare base64
      pngBuffer = Buffer.from(
        json.image.replace(/^data:image\/\w+;base64,/, ""),
        "base64"
      );
    } else if (json.imageBase64) {
      pngBuffer = Buffer.from(json.imageBase64, "base64");
    } else {
      throw new ExternalAPIError("Teacher API response missing question/image");
    }

    if (!pngBuffer?.length || pngBuffer.length < 8) {
      throw new ExternalAPIError("Teacher API returned malformed PNG");
    }

    return {
      pngBuffer,
      correctAnswer: String(rawAnswer),
      difficulty: Number(json.difficulty ?? requestedDifficulty),
    };
  }
}