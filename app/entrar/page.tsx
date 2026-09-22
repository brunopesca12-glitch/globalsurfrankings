import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/Forms";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md px-5 py-12">
      <h1 className="font-serif text-5xl">Entrar</h1>
      <p className="mt-3 text-sm text-ink/70">
        Conta de demonstração: joao.vasques@gsr.surf · senha onda-2027. A mesa é mesa@gsr.surf, com a mesma senha.
      </p>
      <div className="mt-8">
        <LoginForm />
      </div>
      <p className="mt-6 text-sm">
        Sem conta? <Link href="/cadastrar" className="text-ocean">Cadastre-se</Link>
      </p>
    </div>
  );
}
