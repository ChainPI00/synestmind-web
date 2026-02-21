"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MidiStatus } from "@/components/MidiStatus";
import { TouchButton } from "@/components/TouchButton";

export default function StroopMenuPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#141418] text-zinc-100">
      <header className="flex items-center justify-between border-b border-zinc-700/50 px-4 py-3">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="rounded-lg bg-zinc-700/50 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-600"
        >
          Indietro
        </button>
        <MidiStatus />
      </header>

      <main className="mx-auto flex max-w-lg flex-col items-center px-4 py-12">
        <h1 className="mb-10 text-2xl font-bold text-zinc-100">
          Seleziona modalità Stroop
        </h1>

        <div className="flex w-full max-w-sm flex-col gap-6">
          <Link href="/stroop" className="block">
            <TouchButton variant="secondary" className="w-full">
              Standard Stroop
            </TouchButton>
          </Link>
          <Link href="/adv-stroop" className="block">
            <TouchButton variant="danger" className="w-full">
              Advantage Stroop
            </TouchButton>
          </Link>
        </div>
      </main>
    </div>
  );
}
