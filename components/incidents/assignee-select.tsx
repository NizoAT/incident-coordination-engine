"use client";

import * as Select from "@radix-ui/react-select";

import { cn } from "@/lib/utils";

function ChevronDownIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden
      className="opacity-60"
    >
      <path
        d="M2.5 4.5L6 8L9.5 4.5"
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
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path
        d="M2.5 6L5 8.5L9.5 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type AssigneeOption = {
  id: string;
  email: string;
};

export function AssigneeSelect({
  id,
  name,
  users,
  defaultValue,
}: {
  id: string;
  name: string;
  users: AssigneeOption[];
  defaultValue: string;
}) {
  return (
    <Select.Root name={name} defaultValue={defaultValue}>
      <Select.Trigger
        id={id}
        className={cn(
          "inline-flex h-10 w-full items-center justify-between rounded-md border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950",
          "focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600",
        )}
      >
        <Select.Value placeholder="Choisir un responder" />
        <Select.Icon>
          <ChevronDownIcon />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          className="z-50 overflow-hidden rounded-md border border-zinc-200 bg-white shadow-md dark:border-zinc-700 dark:bg-zinc-900"
          position="popper"
          sideOffset={4}
        >
          <Select.Viewport className="p-1">
            <Select.Item
              value="__unassigned__"
              className={cn(
                "relative flex cursor-pointer select-none items-center rounded px-8 py-2 text-sm outline-none",
                "data-[highlighted]:bg-zinc-100 dark:data-[highlighted]:bg-zinc-800",
              )}
            >
              <Select.ItemText>Non assigné</Select.ItemText>
              <Select.ItemIndicator className="absolute left-2 inline-flex">
                <CheckIcon />
              </Select.ItemIndicator>
            </Select.Item>
            {users.map((user) => (
              <Select.Item
                key={user.id}
                value={user.id}
                className={cn(
                  "relative flex cursor-pointer select-none items-center rounded px-8 py-2 text-sm outline-none",
                  "data-[highlighted]:bg-zinc-100 dark:data-[highlighted]:bg-zinc-800",
                )}
              >
                <Select.ItemText>{user.email}</Select.ItemText>
                <Select.ItemIndicator className="absolute left-2 inline-flex">
                  <CheckIcon />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
