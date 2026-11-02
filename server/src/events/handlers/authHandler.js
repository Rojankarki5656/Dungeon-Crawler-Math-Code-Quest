import { eventBus } from "../eventBus.js";
import { EVENTS } from "../eventTypes.js";
import { GameEvent } from "../../models/GameEvent.js";

eventBus.on(EVENTS.USER_REGISTERED, async ({ userId }) => {
  await GameEvent.create({ type: EVENTS.USER_REGISTERED, player: userId });
});

eventBus.on(EVENTS.USER_LOGGED_IN, async ({ userId }) => {
  await GameEvent.create({ type: EVENTS.USER_LOGGED_IN, player: userId });
});