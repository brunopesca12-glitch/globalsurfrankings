import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/Forms";

export const metadata: Metadata = { title: "Cadastrar" };

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-lg px-5 py-12">
      <h1 className="font-serif text-5xl">Cadastrar</h1>
      <p className="mt-3 text-ink/75">
        Uma pessoa, uma conta. A categoria sai da idade em 30 de setembro de 2027: Júnior até 18, Open, Masters 40+ e Masters
        50+. Verificação de documento não existe nesta versão — o crachá Verificado é o padrão, e o Pro é um stub.
      </p>
      <div className="mt-8">
        <RegisterForm />
      </div>
      <p className="mt-6 text-sm">
        Já tem conta? <Link href="/entrar" className="text-ocean">Entrar</Link>
      </p>
    </div>
  );
}
