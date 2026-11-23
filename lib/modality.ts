import { themeBySlug } from "@/lib/catalogue";

export type WaveSetting = "ocean" | "pool" | "unknown";
export type WaveStance = "frontside" | "backside" | "unknown";
export type WaveAnswer = "yes" | "no" | "unknown";
export type WaveSize = "small" | "medium" | "large" | "unknown";

/** What the frames show. `confidence` covers the whole read, from 0 to 1. */
export type WaveObservation = {
  setting: WaveSetting;
  stance: WaveStance;
  tube: WaveAnswer;
  aerial: WaveAnswer;
  size: WaveSize;
  paddleIn: WaveAnswer;
  confidence: number;
};

export type ModalityDecision = {
  outcome: "fit" | "uncertain" | "unfit";
  note: string;
};

/** Below this, a hard miss is not trusted and the wave waits for a person. */
export const SURE_CONFIDENCE = 0.72;

const UNCERTAIN_NOTE =
  "The automatic check was not confident this wave fits the title. It is in, and the desk will review it.";

function titleName(slug: string): string {
  return themeBySlug(slug)?.name ?? "this title";
}

function unsure(slug: string, detail: string): ModalityDecision {
  return {
    outcome: "uncertain",
    note: `${detail} It is in ${titleName(slug)}, and the desk will review it.`,
  };
}

/**
 * Turns a frame reading into a title decision.
 * A clear miss is refused. Anything short of a clear read waits for the desk.
 */
export function judgeModality(themeSlug: string, observation: WaveObservation): ModalityDecision {
  if (!themeBySlug(themeSlug)) {
    return { outcome: "uncertain", note: UNCERTAIN_NOTE };
  }
  if (!(observation.confidence >= SURE_CONFIDENCE)) {
    return { outcome: "uncertain", note: UNCERTAIN_NOTE };
  }

  if (observation.setting === "pool" && themeSlug !== "wave-pool") {
    return {
      outcome: "unfit",
      note: "This looks like a wave-pool wave. Pool waves can only be entered in Wave Pool, so this one was not entered.",
    };
  }
  if (observation.setting === "ocean" && themeSlug === "wave-pool") {
    return {
      outcome: "unfit",
      note: "This looks like an ocean wave. Wave Pool only takes waves ridden in a pool, so this one was not entered.",
    };
  }

  const specific = specificRule(themeSlug, observation);
  if (specific) return specific;

  if (observation.setting === "unknown") {
    return unsure(themeSlug, "We could not tell an ocean wave from a pool wave.");
  }
  return { outcome: "fit", note: `This wave fits ${titleName(themeSlug)}.` };
}

function specificRule(themeSlug: string, observation: WaveObservation): ModalityDecision | null {
  switch (themeSlug) {
    case "best-tube":
      if (observation.tube === "no") {
        return {
          outcome: "unfit",
          note: "No tube shows in this clip, so it cannot enter Best Tube. It was not entered.",
        };
      }
      if (observation.tube !== "yes") return unsure(themeSlug, "We could not see a tube.");
      return null;
    case "best-aerial":
      if (observation.aerial === "no") {
        return {
          outcome: "unfit",
          note: "No aerial shows in this clip, so it cannot enter Best Aerial. It was not entered.",
        };
      }
      if (observation.aerial !== "yes") return unsure(themeSlug, "We could not see an aerial.");
      return null;
    case "biggest-paddle-in":
      if (observation.size === "small") {
        return {
          outcome: "unfit",
          note: "This wave is too small for Biggest Paddle-In Wave. It was not entered.",
        };
      }
      if (observation.paddleIn === "no") {
        return {
          outcome: "unfit",
          note: "This does not look paddle-in. Biggest Paddle-In Wave does not take a tow-in. It was not entered.",
        };
      }
      if (observation.size !== "large") return unsure(themeSlug, "This does not clearly look like a big wave.");
      if (observation.paddleIn !== "yes") return unsure(themeSlug, "We could not see a paddle-in takeoff.");
      return null;
    case "best-small-wave":
      if (observation.size === "large") {
        return {
          outcome: "unfit",
          note: "This wave is too big for Best Small-Wave Performance. It was not entered.",
        };
      }
      if (observation.size !== "small") return unsure(themeSlug, "This may be above waist-high.");
      return null;
    case "frontside":
      if (observation.stance === "backside") {
        return {
          outcome: "unfit",
          note: "This looks backside. It cannot enter Frontside Lines. It was not entered.",
        };
      }
      if (observation.stance !== "frontside") return unsure(themeSlug, "We could not tell frontside from backside.");
      return null;
    case "backside":
      if (observation.stance === "frontside") {
        return {
          outcome: "unfit",
          note: "This looks frontside. It cannot enter Backside Lines. It was not entered.",
        };
      }
      if (observation.stance !== "backside") return unsure(themeSlug, "We could not tell frontside from backside.");
      return null;
    case "wave-pool":
      if (observation.setting !== "pool") return unsure(themeSlug, "We could not see a wave pool.");
      return null;
    default:
      return unsure(themeSlug, "This title could not be checked.");
  }
}
