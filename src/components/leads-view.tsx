"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { HERO_MODELS } from "@/lib/copy";
import { formatWhen } from "@/lib/format";
import { displayPhone } from "@/lib/phones";
import type { Lead, LeadStatus } from "@/lib/types";

const FILTERS: { id: "all" | LeadStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "following", label: "Follow-up" },
  { id: "booked", label: "Booked" },
  { id: "purchased", label: "Purchased" },
  { id: "paused", label: "Paused" },
  { id: "failed", label: "Failed" },
];

export function LeadsView() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    model: "Splendor Plus",
  });

  const load = useCallback(() => {
    fetch("/api/leads")
      .then((response) => response.json())
      .then((data: { leads: Lead[] }) => setLeads(data.leads ?? []))
      .catch(() => toast.error("Could not load leads"));
  }, []);

  useEffect(() => {
    load();
    const onUpdate = () => load();
    window.addEventListener("leads-updated", onUpdate);
    return () => window.removeEventListener("leads-updated", onUpdate);
  }, [load]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return leads.filter((lead) => {
      const matchesFilter = filter === "all" || lead.status === filter;
      const matchesQuery =
        !needle ||
        lead.name.toLowerCase().includes(needle) ||
        lead.phone.includes(needle) ||
        lead.model.toLowerCase().includes(needle);
      return matchesFilter && matchesQuery;
    });
  }, [leads, query, filter]);

  const addLead = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, startFollowup: true }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not add lead");
      toast.success("Lead added. First WhatsApp is queued.");
      setOpen(false);
      setForm({ name: "", mobile: "", model: "Splendor Plus" });
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add lead");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl tracking-wide">Leads</h1>
          <p className="mt-1 text-muted-foreground">
            Booked sends the booking WhatsApp with a Purchase button. Purchase
            takes the lead out of auto follow-up.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" render={<Link href="/import" />}>
            Bulk import
          </Button>
          <Button onClick={() => setOpen(true)}>Add lead</Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <Input
          placeholder="Search name, mobile or model"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="lg:max-w-sm"
        />
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((item) => (
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
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>
              {leads.length === 0 ? "No leads imported" : "No leads match this filter"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            {leads.length === 0
              ? "Add one lead or upload the CSV template from the Import page."
              : "Try another status or search."}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Next WhatsApp</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <Link href={`/leads/${lead.id}`} className="font-medium hover:underline">
                        {lead.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {displayPhone(lead.phone)}
                      </p>
                      {lead.lastError ? (
                        <p className="mt-1 max-w-xs text-xs text-destructive">
                          {lead.lastError}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell>{lead.model}</TableCell>
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
              Name, WhatsApp number and the model they asked for. Auto follow-up
              starts immediately.
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addLead} disabled={saving}>
              {saving ? "Saving…" : "Add & start WhatsApp"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
