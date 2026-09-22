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
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: Number.isInteger(points) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(points);
}

export function formatDatePt(iso: string): string {
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day) return iso;
  return `${day}/${month}/${year}`;
}

export function sexLabel(sex: "M" | "W"): string {
  return sex === "M" ? "Homens" : "Mulheres";
}

export function verificationLabel(tier: "VERIFIED" | "VERIFIED_PRO"): string {
  return tier === "VERIFIED_PRO" ? "Verificado Pro" : "Verificado";
}

export function environmentLabel(environment: "OCEAN" | "POOL"): string {
  return environment === "OCEAN" ? "Oceano" : "Piscina";
}
