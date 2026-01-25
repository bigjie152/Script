"use client";

import { ReactNode } from "react";

type MetaCard = {
  key: string;
  title: string;
  icon?: ReactNode;
  content: ReactNode;
};

type ModuleMetaGridProps = {
  cards: MetaCard[];
};

export function ModuleMetaGrid({ cards }: ModuleMetaGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.key}
          className="rounded-2xl border border-slate-100 bg-white/90 px-5 py-4 shadow-sm"
        >
          <div className="flex items-center gap-2 text-xs text-muted">
            {card.icon}
            <span>{card.title}</span>
          </div>
          <div className="mt-3 text-sm text-ink">{card.content}</div>
        </div>
      ))}
    </div>
  );
}
