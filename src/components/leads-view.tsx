"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LeadActions } from "@/components/lead-actions";
import { StatusBadge } from "@/components/status-badge";
import { TemplateSelect } from "@/components/template-picker";
import { HERO_MODELS } from "@/lib/copy";
import { formatDateIst, formatWhen, istYmd } from "@/lib/format";
import { HERO_FESTIVE_OFFER_TEMPLATE_ID, LEAD_FOLLOWUP_TEMPLATE_ID } from "@/lib/hindi-templates";
import { displayPhone } from "@/lib/phones";
import type { Lead, LeadStatus } from "@/lib/types";

const STATUS_FILTERS: { id: "all" | LeadStatus; label: string }[] = [
  { id: "all", label: "All status" },
  { id: "following", label: "Follow-up" },
  { id: "booked", label: "Booked" },
  { id: "purchased", label: "Purchased" },
  { id: "paused", label: "Paused" },
  { id: "exhausted", label: "Waiting" },
  { id: "failed", label: "Failed" },
];

const SOURCE_FILTERS = [
  { id: "all", label: "All sources" },
  { id: "csv", label: "CSV upload" },
  { id: "manual", label: "Manual" },
  { id: "webhook", label: "WhatsApp" },
] as const;

export function LeadsView() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof STATUS_FILTERS)[number]["id"]>("all");
  const [modelFilter, setModelFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState<(typeof SOURCE_FILTERS)[number]["id"]>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [bulkTemplateId, setBulkTemplateId] = useState(HERO_FESTIVE_OFFER_TEMPLATE_ID);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    model: "Splendor Plus",
    templateId: LEAD_FOLLOWUP_TEMPLATE_ID,
    startFollowup: true,
  });

  const load = useCallback(() => {
    fetch("/api/leads")
      .then((response) => response.json())
      .then((data: { leads: Lead[] }) => setLeads(data.leads ?? []))
      .catch(() => toast.error("Could not load lead register"));
  }, []);

  useEffect(() => {
    load();
    const onUpdate = () => load();
    window.addEventListener("leads-updated", onUpdate);
    return () => window.removeEventListener("leads-updated", onUpdate);
  }, [load]);

  const models = useMemo(() => {
    const unique = new Set<string>(HERO_MODELS);
    for (const lead of leads) {
      if (lead.model) unique.add(lead.model);
    }
    return [...unique];
  }, [leads]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return leads.filter((lead) => {
      const uploaded = istYmd(lead.createdAt);
      const matchesStatus = filter === "all" || lead.status === filter;
      const matchesModel = modelFilter === "all" || lead.model === modelFilter;
      const matchesSource = sourceFilter === "all" || lead.source === sourceFilter;
      const matchesFrom = !fromDate || uploaded >= fromDate;
      const matchesTo = !toDate || uploaded <= toDate;
      const matchesQuery =
        !needle ||
        lead.name.toLowerCase().includes(needle) ||
        lead.phone.includes(needle) ||
        lead.model.toLowerCase().includes(needle);
      return (
        matchesStatus &&
        matchesModel &&
        matchesSource &&
        matchesFrom &&
        matchesTo &&
        matchesQuery
      );
    });
  }, [leads, query, filter, modelFilter, sourceFilter, fromDate, toDate]);

  const selectedIds = filtered.filter((lead) => selected[lead.id]).map((lead) => lead.id);
  const allFilteredSelected =
    filtered.length > 0 && filtered.every((lead) => selected[lead.id]);

  const addLead = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          startFollowup: form.startFollowup,
          templateId: form.templateId,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not add lead");
      toast.success("Lead added to register");
      setOpen(false);
      setForm({
        name: "",
        mobile: "",
        model: "Splendor Plus",
        templateId: LEAD_FOLLOWUP_TEMPLATE_ID,
        startFollowup: true,
      });
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add lead");
    } finally {
      setSaving(false);
    }
  };

  const sendSelected = async () => {
    if (!selectedIds.length) {
      toast.error("Select leads in the register");
      return;
    }
    if (!bulkTemplateId) {
      toast.error("Choose a template");
      return;
    }
    setBulkBusy(true);
    try {
      const response = await fetch("/api/leads/send-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadIds: selectedIds, templateId: bulkTemplateId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Send failed");
      toast.success(
        `भेजा: ${data.sent} · फेल: ${data.failed} · छोड़े: ${data.skipped}`,
      );
      setSelected({});
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Send failed");
    } finally {
      setBulkBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl tracking-wide">लीड रजिस्टर</h1>
          <p className="mt-1 text-muted-foreground">
            अपलोड तारीख, मॉडल और स्टेटस से फ़िल्टर करें। चुनी लीड्स पर कोई भी
            टेम्पलेट भेजें। ऑटो फॉलो-अप खरीद होने तक चलता रहता है।
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" render={<Link href="/import" />}>
            Bulk import
          </Button>
          <Button onClick={() => setOpen(true)}>Add lead</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>फ़िल्टर</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="grid gap-1.5 md:col-span-2">
            <Label htmlFor="leadSearch">Search</Label>
            <Input
              id="leadSearch"
              placeholder="नाम, मोबाइल या मॉडल"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="fromDate">Upload from</Label>
            <Input
              id="fromDate"
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="toDate">Upload to</Label>
            <Input
              id="toDate"
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="modelFilter">Model</Label>
            <select
              id="modelFilter"
              className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
              value={modelFilter}
              onChange={(event) => setModelFilter(event.target.value)}
            >
              <option value="all">All models</option>
              {models.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="sourceFilter">Source</Label>
            <select
              id="sourceFilter"
              className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
              value={sourceFilter}
              onChange={(event) =>
                setSourceFilter(event.target.value as (typeof SOURCE_FILTERS)[number]["id"])
              }
            >
              {SOURCE_FILTERS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap items-end gap-1.5 xl:col-span-2">
            {STATUS_FILTERS.map((item) => (
              <Button
                key={item.id}
                size="sm"
                variant={filter === item.id ? "default" : "outline"}
                onClick={() => setFilter(item.id)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>चुनी लीड्स पर टेम्पलेट</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="grid flex-1 gap-1.5">
            <Label>Template</Label>
            <TemplateSelect value={bulkTemplateId} onChange={setBulkTemplateId} />
          </div>
          <Button onClick={sendSelected} disabled={bulkBusy || selectedIds.length === 0}>
            {bulkBusy
              ? "भेज रहे हैं…"
              : `Send to ${selectedIds.length} lead${selectedIds.length === 1 ? "" : "s"}`}
          </Button>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>
              {leads.length === 0 ? "रजिस्टर खाली है" : "No leads match this filter"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            {leads.length === 0
              ? "Add one lead or upload CSV from Import. Upload पर टेम्पलेट चुनें।"
              : "तारीख, मॉडल या स्टेटस फ़िल्टर बदलें।"}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allFilteredSelected}
                      onCheckedChange={(value) => {
                        const next = { ...selected };
                        for (const lead of filtered) {
                          next[lead.id] = Boolean(value);
                        }
                        setSelected(next);
                      }}
                      aria-label="Select all filtered leads"
                    />
                  </TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Next WhatsApp</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <Checkbox
                        checked={Boolean(selected[lead.id])}
                        disabled={lead.status === "purchased"}
                        onCheckedChange={(value) =>
                          setSelected((current) => ({
                            ...current,
                            [lead.id]: Boolean(value),
                          }))
                        }
                        aria-label={`Select ${lead.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <Link href={`/leads/${lead.id}`} className="font-medium hover:underline">
                        {lead.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {displayPhone(lead.phone)} · {lead.source}
                      </p>
                      {lead.lastError ? (
                        <p className="mt-1 max-w-xs text-xs text-destructive">
                          {lead.lastError}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell>{lead.model}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateIst(lead.createdAt)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={lead.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {lead.status === "purchased"
                        ? "Stopped"
                        : formatWhen(lead.nextFollowupAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end">
                        <LeadActions lead={lead} compact />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add a Hero enquiry</DialogTitle>
            <DialogDescription>
              Name, WhatsApp number, model, and which template to send first.
              Follow-up keeps going until खरीद.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="name">Customer name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="mobile">Mobile number</Label>
              <Input
                id="mobile"
                value={form.mobile}
                onChange={(event) =>
                  setForm({ ...form, mobile: event.target.value })
                }
                placeholder="9876543210"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="model">Model inquired for</Label>
              <select
                id="model"
                className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
                value={form.model}
                onChange={(event) =>
                  setForm({ ...form, model: event.target.value })
                }
              >
                {HERO_MODELS.map((model) => (
                  <option key={model}>{model}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="addTemplate">Template</Label>
              <TemplateSelect
                id="addTemplate"
                value={form.templateId}
                onChange={(templateId) => setForm({ ...form, templateId })}
                includeNone
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.startFollowup}
                onCheckedChange={(value) =>
                  setForm({ ...form, startFollowup: Boolean(value) })
                }
              />
              खरीद तक ऑटो फॉलो-अप जारी रखें
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addLead} disabled={saving}>
              {saving ? "Saving…" : "Add to register"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
