import { Controller, Get, NotFoundException, Param } from '@nestjs/common';

/**
 * Question endpoints.
 *
 * The active question's image lives on the Sanfoh CDN and its absolute URL is
 * pushed to the client via the `question:asset:ready` WebSocket event — no
 * server-side proxy is needed for the hot path.
 *
 * This controller is intentionally minimal. If you later want a same-origin
 * mirror of the CDN image (e.g. for strict CSP environments), add it as a
 * separate proxy module rather than importing CombatModule here.
 */
@Controller('api/questions')
export class QuestionController {
  /** Lightweight ping so the frontend can verify connectivity. */
  @Get('ping')
  ping() {
    return { ok: true, at: Date.now() };
  }

  /**
   * Placeholder — kept so external tooling that hits `/api/questions/:id`
   * doesn't 404. Real questions are delivered through WebSocket events.
   */
  @Get(':id')
  getQuestion(@Param('id') id: string) {
    throw new NotFoundException(`Direct question lookup is disabled (id=${id})`);
  }
}