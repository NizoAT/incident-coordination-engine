"use client";

import * as Label from "@radix-ui/react-label";
import * as Select from "@radix-ui/react-select";

import { SEVERITY_LABELS } from "@/lib/incidents/labels";
import type { Severity } from "@/lib/incidents/types";
import { SEVERITIES } from "@/lib/incidents/types";
import { cn } from "@/lib/utils";

function ChevronDownIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className="opacity-60"
    >
      <path
        d="M4 6l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M3.5 8.5 6.5 11.5 12.5 4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SeveritySelect({
  name,
  id,
  defaultValue = "medium",
  required,
}: {
  name: string;
  id: string;
  defaultValue?: Severity;
  required?: boolean;
}) {
  return (
    <>
      <Select.Root name={name} defaultValue={defaultValue} required={required}>
        <Select.Trigger
          id={id}
          className={cn(
            "inline-flex h-10 w-full items-center justify-between gap-2 rounded-md border border-zinc-300 bg-white px-3 text-sm",
            "dark:border-zinc-700 dark:bg-zinc-900",
            "focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600",
          )}
        >
          <Select.Value placeholder="Choisir une sévérité" />
          <Select.Icon>
            <ChevronDownIcon />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content
            className={cn(
              "z-50 overflow-hidden rounded-md border border-zinc-200 bg-white shadow-md",
              "dark:border-zinc-700 dark:bg-zinc-900",
            )}
            position="popper"
            sideOffset={4}
          >
            <Select.Viewport className="p-1">
              {SEVERITIES.map((severity) => (
                <Select.Item
                  key={severity}
                  value={severity}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center rounded-sm py-2 pl-8 pr-3 text-sm outline-none",
                    "focus:bg-zinc-100 dark:focus:bg-zinc-800",
                  )}
                >
                  <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
                    <CheckIcon />
                  </Select.ItemIndicator>
                  <Select.ItemText>{SEVERITY_LABELS[severity]}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </>
  );
}

export function SeverityFieldLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <Label.Root
      htmlFor={htmlFor}
      className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
    >
      {children}
    </Label.Root>
  );
}
