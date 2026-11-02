import { eventBus } from "../eventBus.js";
import { EVENTS } from "../eventTypes.js";
import { GameEvent } from "../../models/GameEvent.js";

eventBus.on(EVENTS.ANSWER_CORRECT, async (p) =>
  GameEvent.create({ type: EVENTS.ANSWER_CORRECT, player: p.userId, metadata: p })
);
eventBus.on(EVENTS.ANSWER_INCORRECT, async (p) =>
  GameEvent.create({ type: EVENTS.ANSWER_INCORRECT, player: p.userId, metadata: p })
);