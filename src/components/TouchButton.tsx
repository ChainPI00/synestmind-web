"use client";

import React from "react";

interface TouchButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "success" | "danger" | "neutral";
  className?: string;
  disabled?: boolean;
}

const variants = {
  primary: "bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white",
  secondary: "bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white",
  success: "bg-green-600 hover:bg-green-500 active:bg-green-700 text-white",
  danger: "bg-red-700 hover:bg-red-600 active:bg-red-800 text-white",
  neutral: "bg-zinc-600 hover:bg-zinc-500 active:bg-zinc-700 text-white",
};

export function TouchButton({
  children,
  onClick,
  variant = "primary",
  className = "",
  disabled = false,
}: TouchButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick ?? undefined}
      disabled={disabled}
      className={`
        min-h-[48px] min-w-[120px] rounded-xl px-6 py-4 text-lg font-medium
        transition-colors touch-manipulation select-none
        disabled:opacity-50 disabled:pointer-events-none
        ${variants[variant]} ${className}
      `}
    >
      {children}
    </button>
  );
}
