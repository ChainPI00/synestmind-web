"use client";

import React from "react";
import { TouchButton } from "./TouchButton";

interface EndScreenProps {
  title: string;
  subtitle?: string;
  accuracy?: number;
  levelChange?: 1 | -1 | 0;
  onRestart: () => void;
  onMenu: () => void;
  onExit?: () => void;
}

export function EndScreen({
  title,
  subtitle,
  accuracy,
  levelChange,
  onRestart,
  onMenu,
  onExit,
}: EndScreenProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4">
      <h1 className="text-center text-2xl font-bold text-zinc-100 sm:text-3xl">
        {title}
      </h1>
      {subtitle && (
        <p className="text-center text-lg text-zinc-400">{subtitle}</p>
      )}
      {accuracy !== undefined && (
        <p className="text-2xl font-semibold text-zinc-200">
          Accuratezza: {accuracy.toFixed(0)}%
        </p>
      )}
      {levelChange !== undefined && levelChange !== 0 && (
        <p
          className={
            levelChange === 1
              ? "text-green-400"
              : levelChange === -1
                ? "text-red-400"
                : "text-zinc-500"
          }
        >
          {levelChange === 1
            ? "Livello aumentato!"
            : levelChange === -1
              ? "Livello diminuito!"
              : "Livello invariato"}
        </p>
      )}
      <div className="flex flex-wrap justify-center gap-4">
        <TouchButton variant="primary" onClick={onRestart}>
          Nuova partita
        </TouchButton>
        <TouchButton variant="neutral" onClick={onMenu}>
          Menu
        </TouchButton>
        {onExit && (
          <TouchButton variant="danger" onClick={onExit}>
            Esci
          </TouchButton>
        )}
      </div>
    </div>
  );
}
