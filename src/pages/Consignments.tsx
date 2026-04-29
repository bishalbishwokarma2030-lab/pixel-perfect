import { useEffect, useRef, useState } from "react";
import { Plus, Search, Printer, Copy, Download, Pencil, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { toast } from "sonner";
import { toPng } from "html-to-image";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { ActionButtons } from "@/components/ActionButtons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ConsignmentForm } from "@/components/ConsignmentForm";
import { ConsignmentReceipt } from "@/components/ConsignmentReceipt";
import { api, Consignment } from "@/lib/store";

const Consignments = () => {
  const [items, setItems] = useState<Consignment[]>([]);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Consignment | null>(null);
  const [viewing, setViewing] = useState<Consignment | null>(null);
  const [zoom, setZoom] = useState(1);
  const receiptRef = useRef<HTMLDivElement>(null);
  const BASE_W = 1200;
  const zoomIn = () => setZoom((z) => Math.min(2.5, +(z + 0.15).toFixed(2)));
  const zoomOut = () => setZoom((z) => Math.max(0.4, +(z - 0.15).toFixed(2)));
  const zoomReset = () => setZoom(1);

  const renderReceiptPng = async () => {
    if (!receiptRef.current) throw new Error("Receipt not ready");
    return await toPng(receiptRef.current, { pixelRatio: 2, cacheBust: true, backgroundColor: "#ffffff" });
  };

  const downloadReceipt = async () => {
    try {
      const dataUrl = await renderReceiptPng();
      const link = document.createElement("a");
      link.download = `consignment-${viewing?.bill_no || "receipt"}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Downloaded");
    } catch (e: any) { toast.error(e.message || "Download failed"); }
  };

  const copyReceipt = async () => {
    try {
      const dataUrl = await renderReceiptPng();
      const blob = await (await fetch(dataUrl)).blob();
      // @ts-ignore
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      toast.success("Copied to clipboard");
    } catch (e: any) { toast.error(e.message || "Copy failed"); }
  };

  const editReceipt = () => {
    if (viewing) { setEditing(viewing); setViewing(null); setFormOpen(true); }
  };

  const load = () => api.consignments.list().then(setItems).catch((e) => toast.error(e.message));
  useEffect(() => { load(); }, []);

  const filtered = items.filter((c) => [c.bill_no, c.marka, c.start_station, c.end_station, c.client_name].filter(Boolean).join(" ").toLowerCase().includes(search.toLowerCase()));

  const remove = async (c: Consignment) => {
    if (!confirm(`Delete consignment "${c.bill_no}"?`)) return;
    try { await api.consignments.remove(c.id); toast.success("Deleted"); load(); } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div>
      <PageHeader
        title="Consignments"
        breadcrumbs={[{ label: "Home" }, { label: "Consignments" }]}
        actions={
          <>
            <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="pl-9 w-64" /></div>
            <Button onClick={() => { setEditing(null); setFormOpen(true); }} className="bg-gradient-primary text-primary-foreground"><Plus className="mr-1 h-4 w-4" />Create Consignment</Button>
          </>
        }
      />
      <div className="p-6">
        <div className="mb-3 text-sm text-muted-foreground">Showing {filtered.length} of {items.length}</div>
        <DataTable<Consignment>
          data={filtered}
          columns={[
            { key: "date", header: "Date", render: (r) => <span className="text-sm">{new Date(r.start_date).toLocaleDateString()}</span> },
            { key: "bill_no", header: "Consignment No.", render: (r) => <Badge variant="secondary" className="bg-primary/10 text-primary">{r.bill_no}</Badge> },
            { key: "marka", header: "Brand", render: (r) => <span className="font-medium">{r.marka || "—"}</span> },
            { key: "ctn_no", header: "CTN No.", render: (r) => <span className="text-sm">{r.ctn_no || "—"}</span> },
            { key: "cbm", header: "CBM" },
            { key: "weight", header: "Weight" },
            { key: "cartoon", header: "Cartoon" },
            { key: "quantity", header: "Quantity" },
            { key: "client", header: "Client", render: (r) => r.client_name || "—" },
            { key: "grand_total", header: "Total", render: (r) => <span className="font-semibold">¥ {Number(r.grand_total).toFixed(2)}</span> },
            { key: "dues", header: "Dues", render: (r) => {
              const dues = Number(r.grand_total || 0) - Number(r.advance_amount || 0);
              return <span className={dues > 0 ? "text-destructive font-medium" : "text-muted-foreground"}>¥ {dues.toFixed(2)}</span>;
            }},
            { key: "status", header: "Status", render: (r) => <Badge variant="outline">{r.status}</Badge> },
            { key: "payment_status", header: "Payment", render: (r) => {
              const ps = r.payment_status || "Unpaid";
              const cls = ps === "Paid" ? "bg-primary/15 text-primary" : ps === "Partial" ? "bg-warning/20 text-warning" : "bg-destructive/10 text-destructive";
              return <Badge variant="secondary" className={cls}>{ps}</Badge>;
            }},
            { key: "description", header: "Description", render: (r) => <span className="text-sm text-muted-foreground" title={r.description || ""}>{r.description || "—"}</span> },
            { key: "start_station", header: "Start Station", render: (r) => <Badge variant="outline">{r.start_station || "—"}</Badge> },
            { key: "current_station", header: "Current At", render: (r) => <Badge variant="outline" className="bg-accent/40">{r.current_station || r.start_station || "—"}</Badge> },
            { key: "end_station", header: "End Station", render: (r) => <Badge variant="outline">{r.end_station || "—"}</Badge> },
            { key: "actions", header: "Actions", render: (r) => <ActionButtons onView={() => setViewing(r)} onEdit={() => { setEditing(r); setFormOpen(true); }} onDelete={() => remove(r)} /> },
          ]}
        />
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Consignment" : "Create Consignment"}</DialogTitle></DialogHeader>
          <ConsignmentForm initialData={editing} onSaved={() => { setFormOpen(false); load(); }} onCancel={() => setFormOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewing} onOpenChange={(o) => { if (!o) { setViewing(null); zoomReset(); } }}>
        <DialogContent className="w-[97vw] max-w-[1600px] max-h-[95vh] overflow-hidden p-4 sm:p-6 flex flex-col">
          <DialogHeader>
            <div className="flex flex-wrap items-center justify-between gap-2 pr-6">
              <DialogTitle>Consignment Receipt</DialogTitle>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 rounded-md border border-border bg-muted/40 px-1 py-0.5">
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={zoomOut} title="Zoom out"><ZoomOut className="h-4 w-4" /></Button>
                  <span className="min-w-[3rem] text-center text-xs font-semibold tabular-nums">{Math.round(zoom * 100)}%</span>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={zoomIn} title="Zoom in"><ZoomIn className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={zoomReset} title="Reset zoom"><Maximize2 className="h-4 w-4" /></Button>
                </div>
                <Button size="sm" variant="outline" onClick={copyReceipt}><Copy className="mr-1 h-4 w-4" />Copy</Button>
                <Button size="sm" variant="outline" onClick={downloadReceipt}><Download className="mr-1 h-4 w-4" />Download</Button>
                <Button size="sm" variant="outline" onClick={editReceipt}><Pencil className="mr-1 h-4 w-4" />Edit</Button>
                <Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="mr-1 h-4 w-4" />Print</Button>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-auto rounded-md bg-muted/20 p-3">
            {viewing && <ConsignmentReceipt ref={receiptRef} c={viewing} width={Math.round(BASE_W * zoom)} />}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Consignments;