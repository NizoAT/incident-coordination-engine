"use client";

import * as Select from "@radix-ui/react-select";

import { cn } from "@/lib/utils";
import type { Change } from "@/lib/causality/types";

function ChevronDownIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden className="opacity-60">
      <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChangeSelect({
  id,
  name,
  changes,
  required,
}: {
  id: string;
  name: string;
  changes: Change[];
  required?: boolean;
}) {
  if (changes.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Aucun changement disponible : {" "}
        <a href="/changes" className="underline">
          en créer un
        </a>
        .
      </p>
    );
  }

  return (
    <Select.Root name={name} required={required}>
      <Select.Trigger
        id={id}
        className={cn(
          "inline-flex h-10 w-full items-center justify-between rounded-md border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950",
          "focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600",
        )}
      >
        <Select.Value placeholder="Sélectionner un changement" />
        <Select.Icon>
          <ChevronDownIcon />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          className="z-50 max-h-60 overflow-auto rounded-md border border-zinc-200 bg-white shadow-md dark:border-zinc-700 dark:bg-zinc-900"
          position="popper"
          sideOffset={4}
        >
          <Select.Viewport className="p-1">
            {changes.map((change) => (
              <Select.Item
                key={change.id}
                value={change.id}
                className={cn(
                  "relative flex cursor-pointer select-none items-center rounded px-8 py-2 text-sm outline-none",
                  "data-[highlighted]:bg-zinc-100 dark:data-[highlighted]:bg-zinc-800",
                )}
              >
                <Select.ItemText>
                  {change.title}
                  {change.externalRef ? ` (${change.externalRef})` : ""}
                </Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
