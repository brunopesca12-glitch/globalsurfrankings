import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/Forms";
import { auth } from "@/lib/auth";
import { SEASON_2027 } from "@/lib/catalogue";
import { CATEGORY_LABEL, categoryFor, formatDateOnly, parseDateOnly } from "@/lib/category";
import { getAthleteByUser } from "@/lib/data";
import { formatDate, sexLabel, verificationLabel } from "@/lib/format";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");
  const athlete = await getAthleteByUser(session.user.id);

  if (!athlete) {
    return (
      <div className="mx-auto max-w-xl px-5 py-12">
        <h1 className="font-serif text-5xl">The house does not compete</h1>
        <p className="mt-4 text-ink/75">This account belongs to the desk. It has no athlete profile and does not enter the rankings.</p>
      </div>
    );
  }

  const asOf = parseDateOnly(SEASON_2027.ageAsOf)!;
  const category = categoryFor(athlete.birthDate, asOf);

  return (
    <div className="mx-auto max-w-xl px-5 py-12">
      <p className="text-xs uppercase tracking-[0.22em] text-gold">{verificationLabel(athlete.verification)}</p>
      <h1 className="mt-2 font-serif text-5xl">{athlete.displayName}</h1>
      <p className="mt-3 text-sm text-ink/70">
        {CATEGORY_LABEL[category]} · {sexLabel(athlete.sex)} · born {formatDate(formatDateOnly(athlete.birthDate))} · judging duty{" "}
        {athlete.judgingDutyCurrent ? "current" : "overdue"}
      </p>
      <p className="mt-2 text-sm text-ink/60">
        Sex and date of birth stay fixed after signup. In the real version, both are checked against a document.
      </p>
      <div className="mt-8">
        <ProfileForm
          displayName={athlete.displayName}
          city={athlete.city ?? ""}
          club={athlete.club ?? ""}
          country={athlete.country}
          bio={athlete.bio ?? ""}
          hashtags={athlete.hashtags.join(", ")}
        />
      </div>
    </div>
  );
}
