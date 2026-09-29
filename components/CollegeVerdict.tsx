import type { College } from "@/lib/median";
import { COLLEGE_PUBLIC_LABEL } from "@/lib/tribunal";
import { COLLEGES } from "@/lib/median";

export function CollegeVerdictLine({
  verdicts,
  finalPlace,
}: {
  verdicts: readonly { college: College; place: number | null }[];
  finalPlace: number;
}) {
  if (verdicts.length === 0) {
    return <p className="mt-2 text-xs text-ink/55">College verdicts were not recorded for this placement.</p>;
  }
  const byCollege = new Map(verdicts.map((verdict) => [verdict.college, verdict.place]));
  const parts = COLLEGES.map((college) => {
    const place = byCollege.get(college);
    return `${COLLEGE_PUBLIC_LABEL[college]} ${place == null ? "—" : place}`;
  });
  return (
    <p className="mt-2 text-xs leading-relaxed text-ink/70">
      {parts.join(" · ")} · Final {finalPlace}
    </p>
  );
}
