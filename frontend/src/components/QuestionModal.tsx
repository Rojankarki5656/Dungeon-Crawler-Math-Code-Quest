import {
  useEffect,
  useRef,
  useState,
} from "react";

import { useGameStore } from "@/state/store";

import { PixelPanel } from "./pixel/PixelPanel";
import { PixelButton } from "./pixel/PixelButton";
import { PixelBar } from "./pixel/PixelBar";
import { PixelText } from "./pixel/PixelText";

interface Props {
  onSubmit: (answer: string) => void;
  onAbandon: () => void;
}

const ENCOUNTER_DURATION_MS = 120_000;

export function QuestionModal({
  onSubmit,
  onAbandon,
}: Props) {
  const encounter = useGameStore(
    (s) => s.encounter
  );

  const [answer, setAnswer] = useState("");
  const [now, setNow] = useState(Date.now());

  const inputRef =
    useRef<HTMLInputElement>(null);

  const active = !!encounter;

  // ---------------------------------------------------------------------------
  // Timer
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!active) {
      return;
    }

    // Immediately synchronize when a new encounter opens.
    setNow(Date.now());

    const id = window.setInterval(() => {
      setNow(Date.now());
    }, 100);

    return () => {
      window.clearInterval(id);
    };
  }, [active, encounter?.encounterId]);

  // ---------------------------------------------------------------------------
  // Autofocus + reset when a new encounter starts
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!active) {
      setAnswer("");
      return;
    }

    setAnswer("");
    setNow(Date.now());

    const timeoutId = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 60);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    active,
    encounter?.encounterId,
  ]);

  // ---------------------------------------------------------------------------
  // ESC abandons the encounter
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!active) {
      return;
    }

    const onKeyDown = (
      e: KeyboardEvent
    ) => {
      if (e.key !== "Escape") {
        return;
      }

      // Don't abandon while the answer is being submitted.
      if (encounter?.submitting) {
        return;
      }

      e.preventDefault();

      onAbandon();
    };

    window.addEventListener(
      "keydown",
      onKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        onKeyDown
      );
    };
  }, [
    active,
    encounter?.submitting,
    onAbandon,
  ]);

  // ---------------------------------------------------------------------------
  // Release focus when modal closes
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (active) {
      return;
    }

    const element =
      document.activeElement as
        | HTMLElement
        | null;

    if (
      element &&
      (
        element.tagName === "INPUT" ||
        element.tagName === "TEXTAREA"
      )
    ) {
      element.blur();
    }

    // Refocus the game canvas if possible.
    const canvas =
      document.querySelector(
        "canvas"
      ) as HTMLElement | null;

    canvas?.focus?.();
  }, [active]);

  // Don't render anything without an encounter.
  if (!encounter) {
    return null;
  }

  // ---------------------------------------------------------------------------
  // Timer calculations
  // ---------------------------------------------------------------------------

  const remainingMs = Math.max(
    0,
    encounter.expiresAt - now
  );

  const remainingS = Math.ceil(
    remainingMs / 1000
  );

  const timePct = Math.min(
    1,
    remainingMs /
      ENCOUNTER_DURATION_MS
  );

  const expired =
    remainingMs <= 0;

  const monster = encounter.monster;

  // ---------------------------------------------------------------------------
  // Form submission
  // ---------------------------------------------------------------------------

  const handleSubmit = (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    const trimmedAnswer =
      answer.trim();

    if (
      !trimmedAnswer ||
      encounter.submitting ||
      expired
    ) {
      return;
    }

    // Release keyboard focus before returning
    // control to the game.
    inputRef.current?.blur();

    onSubmit(trimmedAnswer);
  };

  // ---------------------------------------------------------------------------
  // Clear answer
  // ---------------------------------------------------------------------------

  const handleClear = () => {
    if (encounter.submitting) {
      return;
    }

    setAnswer("");

    // Keep the input ready for typing.
    inputRef.current?.focus();
  };

  // ---------------------------------------------------------------------------
  // Answer input
  // ---------------------------------------------------------------------------

  const handleAnswerChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value
      // Allow numbers, letters, dots and hyphens.
      .replace(/[^0-9a-zA-Z.-]/g, "")
      .slice(0, 16);

    setAnswer(value);
  };

  // ---------------------------------------------------------------------------
  // Round display
  // ---------------------------------------------------------------------------

  const round = Math.max(
    1,
    Math.min(
      3,
      4 - encounter.attemptsLeft
    )
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background:
          "rgba(7,10,18,0.88)",
        backdropFilter:
          "blur(2px)",
      }}
    >
      <div className="px-pop w-full max-w-[560px]">
        <PixelPanel
          title={`ENCOUNTER · ${monster.name}`}
          accent={monster.color}
          className="p-4 pt-6"
        >
          {/* ---------------------------------------------------------------- */}
          {/* MONSTER STRIP                                                    */}
          {/* ---------------------------------------------------------------- */}

          <div className="mb-4 flex items-center gap-3">
            <div
              className="px-3 py-2"
              style={{
                background: "#0b0f1a",
                border: `3px solid ${monster.color}`,
                boxShadow:
                  "3px 3px 0 0 rgba(0,0,0,0.7)",
              }}
            >
              <PixelText
                size="xs"
                color={monster.color}
              >
                {monster.name}
              </PixelText>
            </div>

            <div className="flex-1">
              <PixelBar
                value={monster.hp}
                max={monster.maxHp}
                label="MONSTER HP"
                color={monster.color}
                height={12}
              />
            </div>

            <div className="text-right">
              <PixelText
                size="xs"
                color="#55678a"
                className="block"
              >
                LV
              </PixelText>

              <PixelText
                size="lg"
                color="#e04141"
              >
                {monster.difficulty}
              </PixelText>
            </div>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* TIMER                                                             */}
          {/* ---------------------------------------------------------------- */}

          <div className="mb-4">
            <PixelBar
              value={remainingS}
              max={120}
              color={
                timePct > 0.35
                  ? "#7fb2ff"
                  : timePct > 0.15
                    ? "#ffd166"
                    : "#e04141"
              }
              label={`TIME ${remainingS}s`}
              height={10}
            />
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* QUESTION                                                         */}
          {/* ---------------------------------------------------------------- */}

          <div
            className="relative mb-4 flex items-center justify-center p-4"
            style={{
              background: "#0b0f1a",
              border:
                "3px solid #2a3550",
              boxShadow:
                "inset 3px 3px 0 0 #000",
              minHeight: 150,
            }}
          >
            {!encounter.imageReady ? (
              <div className="flex flex-col items-center gap-3">
                <PixelText
                  size="xs"
                  color="#ffd166"
                  className="px-blink"
                >
                  LOADING QUESTION ASSET
                </PixelText>

                <div className="flex gap-1">
                  {[0, 1, 2, 3].map(
                    (i) => (
                      <span
                        key={i}
                        className="inline-block"
                        style={{
                          width: 10,
                          height: 10,
                          background:
                            "#4a7fd4",
                          animation:
                            `px-float 1.2s steps(4) ${i * 0.12}s infinite`,
                        }}
                      />
                    )
                  )}
                </div>

                <PixelText
                  size="xs"
                  color="#55678a"
                >
                  ASYNC FETCH WORKER
                  RESOLVING...
                </PixelText>
              </div>
            ) : (
              <img
                src={encounter.imageUrl}
                alt="Banana question"
                className="max-w-full"
                style={{
                  imageRendering:
                    "pixelated",
                }}
                onError={(e) => {
                  (
                    e.currentTarget
                  ).style.opacity =
                    "0.35";
                }}
              />
            )}
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* ANSWER FORM                                                      */}
          {/* ---------------------------------------------------------------- */}

          <form
            onSubmit={handleSubmit}
          >
            <div className="mb-3">
              <PixelText
                size="xs"
                color="#8fa3c8"
                className="mb-2 block"
              >
                ANSWER &gt;
              </PixelText>

              <input
                ref={inputRef}
                className="px-input w-full px-3 py-3 text-[14px] tracking-widest"
                value={answer}
                onChange={
                  handleAnswerChange
                }
                disabled={
                  encounter.submitting ||
                  expired
                }
                placeholder="TYPE..."
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                inputMode="text"
                maxLength={16}
              />
            </div>

            <div className="flex items-center gap-3">
              <PixelButton
                type="submit"
                variant="good"
                size="md"
                disabled={
                  !encounter.imageReady ||
                  !answer.trim() ||
                  encounter.submitting ||
                  expired
                }
                className="flex-1"
              >
                {encounter.submitting
                  ? "VALIDATING..."
                  : expired
                    ? "EXPIRED"
                    : !encounter.imageReady
                      ? "LOADING..."
                      : "SUBMIT"}
              </PixelButton>

              <PixelButton
                type="button"
                variant="ghost"
                size="md"
                onClick={handleClear}
                disabled={
                  encounter.submitting ||
                  !answer
                }
              >
                CLEAR
              </PixelButton>
            </div>
          </form>

          {/* ---------------------------------------------------------------- */}
          {/* FOOTER                                                           */}
          {/* ---------------------------------------------------------------- */}

          <div className="mt-4 flex items-center justify-between">
            <PixelText
              size="xs"
              color="#55678a"
            >
              TRIES LEFT:{" "}
              {encounter.attemptsLeft}
            </PixelText>

            <PixelText
              size="xs"
              color="#55678a"
            >
              DMG:{" "}
              {encounter.attemptsLeft ??
                14}{" "}
              · BANANA
            </PixelText>
          </div>

          <div className="mt-2 text-center">
            <PixelText
              size="xs"
              color="#3d4d75"
            >
              PRESS ESC TO ABANDON
            </PixelText>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* RETRY MESSAGE                                                    */}
          {/* ---------------------------------------------------------------- */}

          {encounter.retry && (
            <div className="mb-3 text-center">
              <PixelText
                size="xs"
                color="#ffd166"
                className="px-blink"
              >
                ROUND {round} / 3 —
                NEW QUESTION INCOMING
              </PixelText>
            </div>
          )}
        </PixelPanel>
      </div>
    </div>
  );
}
