import type { Metadata } from "next";
import Link from "next/link";
import { CHAIN_EXECUTION } from "@/lib/escrow";
import { formatDate, formatUsd } from "@/lib/format";
import { loadPublication } from "@/lib/payment-publish";
import type { PaymentOrder, PeriodFile, Publication } from "@/lib/payment-orders";

export const metadata: Metadata = { title: "Escrow" };
export const dynamic = "force-dynamic";

const SPLIT_LABEL: Record<PaymentOrder["splitBasis"], string> = {
  weekly_race: "Weekly race",
  season_table: "Season table",
  champions_fund: "Champions' fund",
  judges_champions: "Judges · Champions",
  judges_pro_tour: "Judges · Pro tour",
};

export default async function EscrowPage() {
  let publication: Publication | null = null;
  let failed = false;
  try {
    publication = await loadPublication();
  } catch {
    failed = true;
  }

  const files = publication?.files ?? [];
  const orders = files.flatMap((file) => file.orders);
  const ready = orders.filter((order) => order.status === "published");
  const waiting = orders.filter((order) => order.status === "awaiting_wallet");
  const publishedCents = orders.reduce((sum, order) => sum + order.amountCents, 0);
  const readyCents = ready.reduce((sum, order) => sum + order.amountCents, 0);

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <p className="text-xs uppercase tracking-[0.22em] text-gold">Payment orders</p>
      <h1 className="mt-2 font-serif text-5xl">Escrow</h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink/80">
        This site publishes who is owed what. A separate bot, outside this codebase, pays those orders in USDC on the
        blockchain. Nothing here holds a key, signs a transaction, or sends money.
      </p>

      <dl className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          ["Orders published", String(orders.length)],
          ["USDC in the orders", formatUsd(publishedCents)],
          ["Executed on chain", String(CHAIN_EXECUTION.transactions.length)],
        ].map(([label, value]) => (
          <div key={label} className="border border-line bg-white px-4 py-4">
            <dt className="text-xs uppercase tracking-widest text-ink/50">{label}</dt>
            <dd className="mt-2 font-serif text-3xl">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-sm text-ink/60">
        {ready.length} with a wallet ({formatUsd(readyCents)}). {waiting.length} waiting for a wallet. A missing wallet
        is not paid to anyone else.
      </p>

      <section className="mt-10">
        <h2 className="font-serif text-3xl">Contract</h2>
        <p className="mt-3 text-sm leading-relaxed text-ink/70">
          Executed payments are public transaction hashes. This page can list them only after a contract address is
          public. No address is set, so the executed list is empty.
        </p>
        <p className="mt-3 border border-dashed border-gold bg-white px-4 py-3 font-mono text-sm">Not deployed</p>
        <p className="mt-2 text-sm text-ink/60">
          {CHAIN_EXECUTION.asset}. Network unset. {CHAIN_EXECUTION.transactions.length} transaction hashes on file.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-3xl">Published orders</h2>
        {failed ? (
          <p className="mt-3 text-ink/70">The order file could not be loaded.</p>
        ) : (
          <OrderList files={files} />
        )}
        <p className="mt-4 text-sm">
          {/* JSON file, not an app page. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/api/payment-orders" className="text-ocean">
            Machine-readable index
          </a>
          {publication ? (
            <span className="mt-2 block break-all font-mono text-xs text-ink/50">
              Index hash {publication.index.contentHash}
            </span>
          ) : null}
        </p>
      </section>

      <p className="mt-8 text-sm">
        <Link href="/rules" className="text-ocean">
          Read the rules
        </Link>
      </p>
    </div>
  );
}

function OrderList({ files }: { files: PeriodFile[] }) {
  const filled = files.filter((file) => file.orders.length > 0);
  if (filled.length === 0) {
    return (
      <p className="mt-3 leading-relaxed text-ink/70">
        No orders yet. The weekly files and the season file are already public, and they stay empty until a Season 1
        place or a sealed Champions or pro tour ballot exists.
      </p>
    );
  }
  return (
    <div className="mt-4 space-y-8">
      {filled.map((file) => (
        <section key={file.period}>
          <h3 className="font-serif text-2xl">{file.period}</h3>
          <p className="mt-1 text-sm text-ink/60">
            {file.clock === "season_close" ? "Season close" : "Monday"} · pay on {formatDate(file.payOn)} ·{" "}
            <a className="text-ocean" href={`/api/payment-orders/${file.period}`}>
              JSON
            </a>
          </p>
          <p className="mt-1 break-all font-mono text-xs text-ink/45">{file.contentHash}</p>
          <ul className="mt-3 divide-y divide-line border border-line bg-white">
            {file.orders.map((order) => (
              <li key={order.id} className="px-4 py-3 text-sm">
                <p>
                  {order.event ?? "Judges"}
                  {order.board ? ` · ${order.board}` : ""}
                  {order.placement != null ? ` · #${order.placement}` : ""}
                  {order.ballots != null ? ` · ${order.ballots} ballots` : ""}
                </p>
                <p className="mt-1">
                  {order.recipientName} · {formatUsd(order.amountCents)} · {SPLIT_LABEL[order.splitBasis]}
                </p>
                <p className="break-all text-ink/60">
                  {order.status === "published"
                    ? `${order.walletNetwork} ${order.walletAddress}`
                    : "Waiting for a wallet"}
                </p>
                <p className="text-ink/45">{order.ruleRef}</p>
                <p className="text-ink/45">Executed —</p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
