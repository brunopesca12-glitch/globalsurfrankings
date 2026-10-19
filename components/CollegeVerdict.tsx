import type { College } from "@/lib/median";
import { PANEL_NAME } from "@/lib/panel";
import { COLLEGES } from "@/lib/median";

export function CollegeVerdictLine({
  verdicts,
  finalPlace,
}: {
  verdicts: readonly { college: College; place: number | null }[];
  finalPlace: number;
}) {
  if (verdicts.length === 0) {
    return <p className="mt-2 text-xs text-ink/55">Panel places were not recorded for this placement.</p>;
  }
  const byCollege = new Map(verdicts.map((verdict) => [verdict.college, verdict.place]));
  const parts = COLLEGES.map((college) => {
    const place = byCollege.get(college);
    return `${PANEL_NAME[college]} ${place == null ? "—" : place}`;
  });
  return (
    <p className="mt-2 text-xs leading-relaxed text-ink/70">
      {parts.join(" · ")} · Final {finalPlace}
    </p>
  );
}
