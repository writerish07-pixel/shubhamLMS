export async function downloadLeadTemplate() {
  const response = await fetch("/api/leads/template");
  if (!response.ok) throw new Error("Could not download template");
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "shubham-motors-leads-template.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
