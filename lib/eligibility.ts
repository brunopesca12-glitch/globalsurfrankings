import type { College } from "@/lib/median";
import { COLLEGE_SEAT_LABEL, resolveCollege } from "@/lib/tribunal";

export type EligibilityInput = {
  role: "ATHLETE" | "ADMIN";
  hasAthlete: boolean;
  seatedChamber: boolean;
  seatedRanked: boolean;
  upper: boolean;
  enteredThisSeason: boolean;
  override: College | null;
};

export type CollegeClaim = {
  college: College;
  seated: boolean;
  because: string;
};

export type Eligibility = {
  college: College | null;
  label: string | null;
  why: string;
  qualify: string | null;
  claims: CollegeClaim[];
};

const CLAIM_COPY: Record<College, { yes: string; no: string }> = {
  CHAMBER: {
    yes: "You hold a Chamber seat. Former world champions sit here by invitation, for life, after they leave the elite tour.",
    no: "The Chamber is by invitation. A legend is seated by the desk, or by a personal invite link.",
  },
  RANKED: {
    yes: "You hold a Ranked seat. Surfers on a current professional circuit sit here once the desk verifies that ranking.",
    no: "The Ranked is by verification. A current professional-circuit ranking, confirmed by the desk, opens this seat.",
  },
  UPPER: {
    yes: "You are in the top 10 of a category ranking, so you judge the decisive band of other categories.",
    no: "The Upper Chamber is the top 10 of each category ranking. It is earned on the board, not assigned.",
  },
  ATHLETES: {
    yes: "You entered a wave this season, so you judge every category except your own.",
    no: "Enter a wave this season and you join the Athletes' College automatically.",
  },
  PUBLIC: {
    yes: "Every verified account may judge. Each ballot is scored for accuracy against Monday's verdict.",
    no: "A verified athlete profile opens the Public.",
  },
};

/**
 * One college per person. The desk may override. Otherwise the order is
 * Chamber, Ranked, Upper Chamber, Athletes' College, Public.
 * The same ballot is used in every college.
 */
export function eligibilityFor(input: EligibilityInput): Eligibility {
  const college = resolveCollege({
    role: input.role,
    seatedChamber: input.seatedChamber,
    seatedRanked: input.seatedRanked,
    upper: input.upper,
    enteredThisSeason: input.enteredThisSeason,
    override: input.override,
    hasAthlete: input.hasAthlete,
  });

  const automatic: Record<College, boolean> = {
    CHAMBER: input.seatedChamber,
    RANKED: input.seatedRanked,
    UPPER: input.upper,
    ATHLETES: input.enteredThisSeason,
    PUBLIC: input.hasAthlete && input.role !== "ADMIN",
  };

  const claims: CollegeClaim[] = (Object.keys(CLAIM_COPY) as College[]).map((name) => ({
    college: name,
    seated: input.override === name || (input.override == null && college === name),
    because:
      input.override === name
        ? `The desk assigned the ${COLLEGE_SEAT_LABEL[name]}.`
        : CLAIM_COPY[name][automatic[name] ? "yes" : "no"],
  }));

  if (input.override && college) {
    return {
      college,
      label: COLLEGE_SEAT_LABEL[college],
      why: `The desk seated you in the ${COLLEGE_SEAT_LABEL[college]}. That override stands until the desk clears it.`,
      qualify: null,
      claims,
    };
  }

  if (!college) {
    const qualify =
      input.role === "ADMIN"
        ? "The desk does not judge. An invitation to the Chamber or the Ranked is how this account sits."
        : "Create an athlete profile. Every verified account joins the Public, and an invite opens the Chamber or the Ranked.";
    return {
      college: null,
      label: null,
      why: input.role === "ADMIN" ? "This account is the desk, and it has no judging seat." : "This account has no athlete profile yet.",
      qualify,
      claims,
    };
  }

  return {
    college,
    label: COLLEGE_SEAT_LABEL[college],
    why: CLAIM_COPY[college].yes,
    qualify: null,
    claims,
  };
}
