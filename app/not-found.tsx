import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-5 py-20">
      <h1 className="font-serif text-5xl">Off the board</h1>
      <p className="mt-4 text-ink/75">That page is not on the circuit.</p>
      <Link href="/" className="mt-6 inline-block text-ocean">
        Back to the start
      </Link>
    </div>
  );
}
