"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { parseLeadCsv, type ParsedLeadRow } from "@/lib/csv";
import { downloadLeadTemplate } from "@/lib/download-template";

export function ImportView() {
  const [rows, setRows] = useState<ParsedLeadRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [startFollowup, setStartFollowup] = useState(true);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const validCount = useMemo(
    () => rows.filter((row) => !row.error).length,
    [rows],
  );

  const onFile = async (file: File) => {
    setResult(null);
    setFileName(file.name);
    const text = await file.text();
    const parsed = parseLeadCsv(text);
    setRows(parsed.rows);
    if (parsed.errors.length) {
      toast.error(parsed.errors[0]);
    }
  };

  const importRows = async () => {
    if (!fileName) return;
    const valid = rows.filter((row) => !row.error);
    if (!valid.length) {
      toast.error("Fix the highlighted rows before importing.");
      return;
    }
    setBusy(true);
    try {
      const csv = [
        "name,mobile,model",
        ...valid.map(
          (row) =>
            `${JSON.stringify(row.name)},${JSON.stringify(row.mobile)},${JSON.stringify(row.model)}`,
        ),
      ].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const form = new FormData();
      form.set("file", blob, fileName);
      form.set("startFollowup", startFollowup ? "true" : "false");
      const response = await fetch("/api/leads/import", {
        method: "POST",
        body: form,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Import failed");
      const skipped = data.skipped?.length ?? 0;
      setResult(
        `Imported ${data.created} lead${data.created === 1 ? "" : "s"}${
          skipped ? `, skipped ${skipped} duplicate number${skipped === 1 ? "" : "s"}` : ""
        }.`,
      );
      toast.success("Leads imported");
      window.dispatchEvent(new Event("leads-updated"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-3xl tracking-wide">Bulk lead upload</h1>
        <p className="mt-1 max-w-2xl text-muted-foreground">
          Use the template with customer name, mobile number and the Hero model
          they inquired for. Duplicate numbers are skipped. Auto WhatsApp starts
          as soon as the file is accepted.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>CSV template</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Columns: <code>name</code>, <code>mobile</code>, <code>model</code>.
              10-digit Indian numbers are stored as +91.
            </p>
            <pre className="overflow-x-auto rounded-lg bg-[#16110f] p-3 text-xs text-[#f7f1e8]">
{`name,mobile,model
Rajesh Sharma,9876543210,Splendor Plus
Priya Verma,9123456789,Xtreme 160R
Amit Singh,9988776655,HF Deluxe`}
            </pre>
            <Button
              variant="outline"
              onClick={() => {
                void downloadLeadTemplate();
              }}
            >
              Download template CSV
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Upload file</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 px-4 py-10 text-center">
              <span className="font-medium">Drop CSV here or browse</span>
              <span className="mt-1 text-sm text-muted-foreground">
                {fileName ?? "Accepted: .csv with name, mobile, model"}
              </span>
              <input
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void onFile(file);
                }}
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={startFollowup}
                onCheckedChange={(value) => setStartFollowup(Boolean(value))}
              />
              Start auto WhatsApp follow-up immediately
            </label>
            <Button onClick={importRows} disabled={busy || validCount === 0}>
              {busy ? "Importing…" : `Import ${validCount || ""} leads`}
            </Button>
            {result ? <p className="text-sm text-emerald-800">{result}</p> : null}
          </CardContent>
        </Card>
      </div>

      {rows.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Row</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Check</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={`${row.row}-${row.mobile}`}>
                    <TableCell>{row.row}</TableCell>
                    <TableCell>{row.name || "—"}</TableCell>
                    <TableCell>{row.phone || row.mobile || "—"}</TableCell>
                    <TableCell>{row.model || "—"}</TableCell>
                    <TableCell className={row.error ? "text-destructive" : "text-emerald-800"}>
                      {row.error ?? "Ready"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
