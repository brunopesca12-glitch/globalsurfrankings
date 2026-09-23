const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const usdCents = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatUsd(cents: number): string {
  if (cents % 100 === 0) return usd.format(cents / 100).replace("$", "US$ ");
  return usdCents.format(cents / 100).replace("$", "US$ ");
}

export function formatUsdAmount(amount: number): string {
  return formatUsd(Math.round(amount * 100));
}

export function formatPoints(points: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: Number.isInteger(points) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(points);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

export function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day) return iso;
  const name = MONTHS[Number(month) - 1];
  if (!name) return iso;
  return `${name} ${Number(day)}, ${year}`;
}

export function sexLabel(sex: "M" | "W"): string {
  return sex === "M" ? "Men" : "Women";
}

export function verificationLabel(tier: "VERIFIED" | "VERIFIED_PRO"): string {
  return tier === "VERIFIED_PRO" ? "Verified Pro" : "Verified";
}

export function environmentLabel(environment: "OCEAN" | "POOL"): string {
  return environment === "OCEAN" ? "Ocean" : "Pool";
}

export function ordinal(place: number): string {
  const mod100 = place % 100;
  const suffix =
    mod100 >= 11 && mod100 <= 13
      ? "th"
      : place % 10 === 1
        ? "st"
        : place % 10 === 2
          ? "nd"
          : place % 10 === 3
            ? "rd"
            : "th";
  return `${place}${suffix}`;
}
