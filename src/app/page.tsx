"use client";

import Link from "next/link";
import { MidiStatus } from "@/components/MidiStatus";
import { NoteLegend } from "@/components/NoteLegend";
import { FullscreenButton } from "@/components/FullscreenButton";

const linkButtonClass =
  "block min-h-[48px] min-w-[120px] w-full rounded-xl px-6 py-4 text-lg font-medium transition-colors touch-manipulation select-none text-center flex items-center justify-center";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#141418] text-zinc-100">
      <header className="flex items-center justify-between gap-2 border-b border-zinc-700/50 px-4 py-3">
        <h1 className="text-lg font-semibold">SynestMind</h1>
        <div className="flex items-center gap-2">
          <MidiStatus />
          <FullscreenButton />
        </div>
      </header>

      <main className="mx-auto flex max-w-lg flex-col items-center px-4 py-8">
        <h1 className="mb-2 text-3xl font-bold text-zinc-100 sm:text-4xl">
          SynestMind
        </h1>
        <p className="mb-10 text-zinc-400">Allenamento cognitivo musicale</p>

        <div className="flex w-full max-w-sm flex-col gap-6">
          <Link
            href="/dual"
            className={`${linkButtonClass} bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white`}
          >
            Dual-Music-Back
          </Link>
          <Link
            href="/stroop-menu"
            className={`${linkButtonClass} bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white`}
          >
            Test Stroop
          </Link>
          <Link
            href="/inverse"
            className={`${linkButtonClass} bg-red-700 hover:bg-red-600 active:bg-red-800 text-white`}
          >
            Inverse Stroop
          </Link>
          <Link
            href="/simulation"
            className={`${linkButtonClass} bg-zinc-600 hover:bg-zinc-500 active:bg-zinc-700 text-white`}
          >
            Simulazione
          </Link>
        </div>

        <div className="mt-12 w-full max-w-md">
          <NoteLegend />
        </div>
      </main>
    </div>
  );
}
