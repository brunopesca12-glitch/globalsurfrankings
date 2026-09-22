"use client";

import { useActionState } from "react";
import { setJudgingDuty, type JudgeState } from "@/app/actions/judging";

export function DutyForm({ athleteId, current }: { athleteId: string; current: boolean }) {
  const [state, action, pending] = useActionState(setJudgingDuty, { error: null, saved: false } satisfies JudgeState);
  return (
    <form action={action} className="flex items-center gap-3 text-sm">
      <input type="hidden" name="athleteId" value={athleteId} />
      <label className="flex items-center gap-2">
        <input type="checkbox" name="duty" defaultChecked={current} />
        Dever em dia
      </label>
      <button className="border border-line px-2 py-1" type="submit" disabled={pending}>
        Salvar
      </button>
      {state.error ? <span className="text-stamp">{state.error}</span> : null}
      {state.saved ? <span className="text-ocean">Atualizado.</span> : null}
    </form>
  );
}
