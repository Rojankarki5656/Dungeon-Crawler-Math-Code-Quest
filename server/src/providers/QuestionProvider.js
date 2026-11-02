/**
 * Abstract provider interface. Every provider must return:
 * { pngBuffer: Buffer, correctAnswer: string, difficulty: number }
 * The provider MUST NOT leak the answer outside the server.
 */
export class QuestionProvider {
  get name() { throw new Error("not implemented"); }
  async generate({ difficulty = 1 } = {}) { throw new Error("not implemented"); }
}