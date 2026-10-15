"use client";

import { sendableTemplates } from "@/lib/hindi-templates";

export function TemplateSelect({
  id,
  value,
  onChange,
  includeNone = false,
  noneLabel = "अभी टेम्पलेट न भेजें",
  className,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  includeNone?: boolean;
  noneLabel?: string;
  className?: string;
}) {
  return (
    <select
      id={id}
      className={
        className ??
        "h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
      }
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {includeNone ? <option value="">{noneLabel}</option> : null}
      {sendableTemplates().map((row) => (
        <option key={row.templateId} value={row.templateId}>
          {row.nameHi} · {row.templateId} · {row.category}
        </option>
      ))}
    </select>
  );
}
