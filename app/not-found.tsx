import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-5 py-20">
      <h1 className="font-serif text-5xl">Fora do quadro</h1>
      <p className="mt-4 text-ink/75">Essa página não existe no circuito.</p>
      <Link href="/" className="mt-6 inline-block text-ocean">
        Voltar ao início
      </Link>
    </div>
  );
}
