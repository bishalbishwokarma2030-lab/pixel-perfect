import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Search, Copy, Download, Pencil, Printer, ZoomIn, ZoomOut, Maximize2, Languages, FileDown } from "lucide-react";
import { toast } from "sonner";
import { toPng } from "html-to-image";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { ActionButtons } from "@/components/ActionButtons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { api, Shipment, Station, Consignment } from "@/lib/store";
import { ConsignmentForm } from "@/components/ConsignmentForm";
import { ConsignmentReceipt } from "@/components/ConsignmentReceipt";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { exportToExcel } from "@/lib/excel";

const STATION_OPTIONS = [
  "Guangzhou", "Yiwu", "Lhasa", "Nylam (Khasa)", "Tatopani", "Kerung",
  "Kathmandu", "Nylam", "Shantou", "Tatopani - Kerung", "Kerung - Tatopani",
];
const CONTAINER_TYPES = ["Container", "Truck", "Train", "Plane", "Ship"];
const CLEAR = "__clear__";

const empty = {
  container_name: "", container_type: "Truck", lot_no: "",
  driver_name: "", driver_phone: "", start_station: "", end_station: "",
  consignment_ids: [] as string[], remarks: "", status: "In Transit",
  dispatched_by: "",
};

const Shipments = () => {
  const [items, setItems] = useState<Shipment[]>([]);
  const [, setStations] = useState<Station[]>([]);
  const [consignments, setConsignments] = useState<Consignment[]>([]);
  const [search, setSearch] = useState("");
  const [fStation, setFStation] = useState(CLEAR);
  const [fStatus, setFStatus] = useState(CLEAR);
  const [fDispatched, setFDispatched] = useState(CLEAR);
  const [fStartDate, setFStartDate] = useState("");
  const [fEndDate, setFEndDate] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Shipment | null>(null);
  const [form, setForm] = useState<any>(empty);
  const [viewing, setViewing] = useState<Shipment | null>(null);
  const [viewConsignment, setViewConsignment] = useState<Consignment | null>(null);
  const [editConsignment, setEditConsignment] = useState<Consignment | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [zoom, setZoom] = useState(1);
  const [translate, setTranslate] = useState(false);
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
      const a = document.createElement("a");
      a.download = `consignment-${viewConsignment?.bill_no || "receipt"}.png`;
      a.href = dataUrl; a.click();
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

  const removeConsignment = async (c: Consignment) => {
    if (!confirm(`Delete consignment "${c.bill_no}"?`)) return;
    try { await api.consignments.remove(c.id); toast.success("Deleted"); load(); } catch (e: any) { toast.error(e.message); }
  };

  const load = () => Promise.all([api.shipments.list(), api.stations.list(), api.consignments.list()])
    .then(([sh, st, cn]) => { setItems(sh); setStations(st); setConsignments(cn); })
    .catch((e) => toast.error(e.message));
  useEffect(() => { load(); }, []);

  const dispatchedOpts = useMemo(() => Array.from(new Set(items.map((i) => i.dispatched_by).filter(Boolean) as string[])), [items]);
  const stationOpts = useMemo(() => Array.from(new Set([...STATION_OPTIONS, ...items.flatMap((i) => [i.start_station, i.end_station])].filter(Boolean) as string[])), [items]);

  const filtered = items.filter((s) => {
    const hay = [s.lot_no, s.container_name, s.driver_name, s.start_station, s.end_station].filter(Boolean).join(" ").toLowerCase();
    if (search && !hay.includes(search.toLowerCase())) return false;
    if (fStation !== CLEAR && s.start_station !== fStation && s.end_station !== fStation) return false;
    if (fStatus !== CLEAR && s.status !== fStatus) return false;
    if (fDispatched !== CLEAR && s.dispatched_by !== fDispatched) return false;
    const created = (s.created_at || "").slice(0, 10);
    if (fStartDate && created < fStartDate) return false;
    if (fEndDate && created > fEndDate) return false;
    return true;
  });

  const toggleRow = (id: string) => setSelectedIds((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  const toggleAll = (checked: boolean) => setSelectedIds(checked ? filtered.map((s) => s.id) : []);
  const shipmentRow = (s: Shipment) => ({
    "Lot No": s.lot_no, "Container": s.container_name, "Type": s.container_type,
    "Driver": s.driver_name, "Phone": s.driver_phone, "From": s.start_station, "To": s.end_station,
    "Status": s.status, "Consignments": s.consignment_ids.length, "Dispatched By": s.dispatched_by,
    "Created": s.created_at, "Remarks": s.remarks,
  });
  const exportSelected = () => {
    const rows = items.filter((s) => selectedIds.includes(s.id));
    if (!rows.length) return toast.error("Select at least one shipment");
    exportToExcel(rows.map(shipmentRow), `shipments-selected-${new Date().toISOString().slice(0,10)}.xlsx`);
  };
  const exportAll = () => {
    if (!items.length) return toast.error("Nothing to export");
    exportToExcel(items.map(shipmentRow), `shipments-all-${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const possibleConsignments = useMemo(
    () => consignments.filter((c) => (!form.start_station || c.start_station === form.start_station) && (!form.end_station || c.end_station === form.end_station)),
    [consignments, form.start_station, form.end_station]
  );

  const openCreate = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (s: Shipment) => { setEditing(s); setForm({ ...s, consignment_ids: s.consignment_ids || [] }); setOpen(true); };

  const toggleConsignment = (id: string) => {
    setForm((f: any) => ({ ...f, consignment_ids: f.consignment_ids.includes(id) ? f.consignment_ids.filter((x: string) => x !== id) : [...f.consignment_ids, id] }));
  };

  const save = async () => {
    if (!form.container_name || !form.lot_no || !form.start_station || !form.end_station) return toast.error("Fill all required fields");
    try {
      const payload = { ...form, consignment_ids: form.consignment_ids };
      if (editing) await api.shipments.update(editing.id, payload);
      else await api.shipments.create(payload);
      toast.success("Saved"); setOpen(false); load();
    } catch (e: any) { toast.error(e.message); }
  };

  const remove = async (s: Shipment) => {
    if (!confirm(`Delete shipment "${s.lot_no}"?`)) return;
    try { await api.shipments.remove(s.id); toast.success("Deleted"); load(); } catch (e: any) { toast.error(e.message); }
  };

  const statusBadge = (st: string) => {
    const cls = st === "Delivered" ? "bg-success text-success-foreground" : st === "In Transit" ? "bg-warning text-warning-foreground" : "bg-muted";
    return <Badge className={cls}>{st}</Badge>;
  };

  const selected = consignments.filter((c) => form.consignment_ids.includes(c.id));

  return (
    <div>
      <PageHeader
        title="Dispatched Shipments"
        breadcrumbs={[{ label: "Home" }, { label: "Shipments" }, { label: "Dispatched Shipments" }]}
        actions={
          <>
            <Button variant="outline" onClick={exportSelected} disabled={selectedIds.length === 0}><FileDown className="mr-1 h-4 w-4" />Export Selected ({selectedIds.length})</Button>
            <Button variant="outline" onClick={exportAll}><FileDown className="mr-1 h-4 w-4" />Export All</Button>
            <Button onClick={openCreate} className="bg-gradient-primary text-primary-foreground"><Plus className="mr-1 h-4 w-4" />Create Shipment</Button>
          </>
        }
      />
      <div className="p-6">
        {/* Filter bar */}
        <div className="mb-4 grid grid-cols-2 gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-3 lg:grid-cols-6">
          <SF label="Search">
            <div className="relative"><Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="eg. Search…" className="pl-7 h-9" /></div>
          </SF>
          <SF label="Station">
            <Select value={fStation} onValueChange={setFStation}>
              <SelectTrigger className="h-9"><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent><SelectItem value={CLEAR}>All</SelectItem>{stationOpts.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
            </Select>
          </SF>
          <SF label="Status">
            <Select value={fStatus} onValueChange={setFStatus}>
              <SelectTrigger className="h-9"><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent><SelectItem value={CLEAR}>All</SelectItem><SelectItem value="In Transit">In Transit</SelectItem><SelectItem value="Delivered">Delivered</SelectItem><SelectItem value="Pending">Pending</SelectItem></SelectContent>
            </Select>
          </SF>
          <SF label="Dispatched By">
            <Select value={fDispatched} onValueChange={setFDispatched}>
              <SelectTrigger className="h-9"><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent><SelectItem value={CLEAR}>All</SelectItem>{dispatchedOpts.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
            </Select>
          </SF>
          <SF label="Start Date"><Input type="date" value={fStartDate} onChange={(e) => setFStartDate(e.target.value)} className="h-9" /></SF>
          <SF label="End Date"><Input type="date" value={fEndDate} onChange={(e) => setFEndDate(e.target.value)} className="h-9" /></SF>
        </div>
        <div className="mb-3 text-sm text-muted-foreground">Showing Results: 1-{filtered.length} of {items.length}</div>
        <DataTable<Shipment>
          data={filtered}
          selectable
          selectedIds={selectedIds}
          onToggleRow={toggleRow}
          onToggleAll={toggleAll}
          columns={[
            { key: "#", header: "#", render: (_r, i) => <span className="text-muted-foreground">{i + 1}</span> },
            { key: "lot_no", header: "Lot No", render: (r) => <Badge variant="secondary" className="bg-primary/10 text-primary">{r.lot_no}</Badge> },
            { key: "container", header: "Container", render: (r) => <div><div className="text-sm"><b>Name:</b> {r.container_name}</div><div className="text-sm"><b>Type:</b> <span className="text-primary">{r.container_type}</span></div></div> },
            { key: "driver", header: "Driver Details", render: (r) => <div><div className="text-sm"><b>Name:</b> {r.driver_name || "—"}</div><div className="text-sm"><b>Phone:</b> {r.driver_phone || "—"}</div></div> },
            { key: "no_consig", header: "Consignments", render: (r) => <Badge variant="outline">{r.consignment_ids.length}</Badge> },
            { key: "from", header: "From", render: (r) => <Badge variant="outline">{r.start_station}</Badge> },
            { key: "status", header: "Status", render: (r) => statusBadge(r.status) },
            { key: "to", header: "Destination", render: (r) => <Badge variant="outline">{r.end_station}</Badge> },
            { key: "by", header: "Dispatched By", render: (r) => r.dispatched_by || "—" },
            { key: "created_at", header: "Created", render: (r) => <span className="text-sm text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span> },
            { key: "actions", header: "Actions", render: (r) => <ActionButtons onView={() => setViewing(r)} onEdit={() => openEdit(r)} onDelete={() => remove(r)} /> },
          ]}
        />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Shipment" : "Dispatch Shipment"}</DialogTitle></DialogHeader>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="mb-3 text-base font-semibold text-primary">Container Details</div>
              <div className="space-y-3">
                <F label="Container Name *"><Input value={form.container_name} onChange={(e) => setForm({ ...form, container_name: e.target.value })} placeholder="eg. TLC23" /></F>
                <F label="Container Type *">
                  <Select value={form.container_type || CLEAR} onValueChange={(v) => setForm({ ...form, container_type: v === CLEAR ? "" : v })}>
                    <SelectTrigger><SelectValue placeholder="Select container type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={CLEAR}>Clear Selection</SelectItem>
                      {CONTAINER_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </F>
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="mb-3 text-base font-semibold text-primary">Lot Details</div>
                <F label="Lot No. *"><Input value={form.lot_no} onChange={(e) => setForm({ ...form, lot_no: e.target.value })} placeholder="eg. Lot23" /></F>
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="mb-3 text-base font-semibold text-primary">Driver Details</div>
                <div className="grid grid-cols-2 gap-3">
                  <F label="Driver Name"><Input value={form.driver_name} onChange={(e) => setForm({ ...form, driver_name: e.target.value })} /></F>
                  <F label="Driver Phone *"><Input value={form.driver_phone} onChange={(e) => setForm({ ...form, driver_phone: e.target.value })} /></F>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="mb-3 text-base font-semibold text-primary">Start Station</div>
                  <Select value={form.start_station || CLEAR} onValueChange={(v) => setForm({ ...form, start_station: v === CLEAR ? "" : v })}>
                    <SelectTrigger><SelectValue placeholder="Choose station" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={CLEAR}>Clear Selection</SelectItem>
                      {STATION_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="mb-3 text-base font-semibold text-primary">End Station</div>
                  <Select value={form.end_station || CLEAR} onValueChange={(v) => setForm({ ...form, end_station: v === CLEAR ? "" : v })}>
                    <SelectTrigger><SelectValue placeholder="Choose station" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={CLEAR}>Clear Selection</SelectItem>
                      {STATION_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-2 text-base font-semibold text-primary">Possible Shipment Consignments ({possibleConsignments.length})</div>
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-primary text-primary-foreground"><tr><th className="p-2 w-8"></th><th className="p-2 text-left">Bill No</th><th className="p-2 text-left">Marka</th><th className="p-2">CBM</th><th className="p-2">Weight</th><th className="p-2 text-right">Total</th></tr></thead>
                <tbody>
                  {possibleConsignments.length === 0 ? <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">No matching consignments</td></tr> :
                    possibleConsignments.map((c) => (
                      <tr key={c.id} className="border-t border-border">
                        <td className="p-2"><Checkbox checked={form.consignment_ids.includes(c.id)} onCheckedChange={() => toggleConsignment(c.id)} /></td>
                        <td className="p-2">{c.bill_no}</td><td className="p-2">{c.marka}</td>
                        <td className="p-2 text-center">{c.cbm}</td><td className="p-2 text-center">{c.weight}</td>
                        <td className="p-2 text-right">¥ {Number(c.grand_total).toFixed(2)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-2 text-base font-semibold text-primary">Selected Shipment Consignments ({selected.length})</div>
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-primary text-primary-foreground"><tr><th className="p-2 text-left">Bill No</th><th className="p-2 text-left">Marka</th><th className="p-2">CBM</th><th className="p-2">Weight</th><th className="p-2 text-right">Total</th></tr></thead>
                <tbody>
                  {selected.length === 0 ? <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">No data found</td></tr> :
                    selected.map((c) => (<tr key={c.id} className="border-t border-border"><td className="p-2">{c.bill_no}</td><td className="p-2">{c.marka}</td><td className="p-2 text-center">{c.cbm}</td><td className="p-2 text-center">{c.weight}</td><td className="p-2 text-right">¥ {Number(c.grand_total).toFixed(2)}</td></tr>))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <F label="Status">
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="In Transit">In Transit</SelectItem><SelectItem value="Delivered">Delivered</SelectItem><SelectItem value="Pending">Pending</SelectItem></SelectContent>
              </Select>
            </F>
            <F label="Dispatched By"><Input value={form.dispatched_by} onChange={(e) => setForm({ ...form, dispatched_by: e.target.value })} /></F>
          </div>
          <div className="mt-3"><F label="Remarks"><Textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} placeholder="Shipment remarks here…" /></F></div>

          <DialogFooter className="mt-4"><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save} className="bg-gradient-primary text-primary-foreground">Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="w-[97vw] max-w-[1500px] max-h-[92vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Shipment Details</DialogTitle></DialogHeader>
          {viewing && (
            <ShipmentView
              shipment={viewing}
              consignments={consignments.filter((c) => viewing.consignment_ids.includes(c.id))}
              onView={(c) => setViewConsignment(c)}
              onEdit={(c) => setEditConsignment(c)}
              onDelete={removeConsignment}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Receipt viewer for shipment-consignments */}
      <Dialog open={!!viewConsignment} onOpenChange={(o) => { if (!o) { setViewConsignment(null); zoomReset(); setTranslate(false); } }}>
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
                <Button size="sm" variant="outline" onClick={() => { if (viewConsignment) { setEditConsignment(viewConsignment); setViewConsignment(null); } }}><Pencil className="mr-1 h-4 w-4" />Edit</Button>
                <Button size="sm" variant={translate ? "default" : "outline"} onClick={() => setTranslate((t) => !t)}><Languages className="mr-1 h-4 w-4" />{translate ? "Original" : "Translate to English"}</Button>
                <Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="mr-1 h-4 w-4" />Print</Button>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-auto rounded-md bg-muted/20 p-3">
            {viewConsignment && (
              <ContextMenu>
                <ContextMenuTrigger asChild>
                  <div>
                    <ConsignmentReceipt ref={receiptRef} c={viewConsignment} width={Math.round(BASE_W * zoom)} translate={translate} />
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem onClick={() => setTranslate((t) => !t)}>
                    <Languages className="mr-2 h-4 w-4" />
                    {translate ? "Show Original" : "Translate to English"}
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit consignment from shipment view */}
      <Dialog open={!!editConsignment} onOpenChange={(o) => { if (!o) setEditConsignment(null); }}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Consignment</DialogTitle></DialogHeader>
          {editConsignment && (
            <ConsignmentForm
              initialData={editConsignment}
              onSaved={() => { setEditConsignment(null); load(); }}
              onCancel={() => setEditConsignment(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label className="mb-1.5 block text-sm">{label}</Label>{children}</div>;
}
function Info({ label, value }: { label: string; value: string }) {
  return <div><div className="text-sm text-muted-foreground">{label}</div><div className="font-medium">{value}</div></div>;
}

function ShipmentView({ shipment, consignments, onView, onEdit, onDelete }: {
  shipment: Shipment;
  consignments: Consignment[];
  onView: (c: Consignment) => void;
  onEdit: (c: Consignment) => void;
  onDelete: (c: Consignment) => void;
}) {
  const totals = consignments.reduce((acc, c) => {
    acc.cbm += Number(c.cbm || 0);
    acc.weight += Number(c.weight || 0);
    acc.freight += Number(c.freight || 0);
    acc.local_freight += Number(c.local_freight || 0);
    acc.bill_charge += Number(c.bill_charge || 0);
    acc.insurance += Number(c.insurance || 0);
    acc.tax += Number(c.tax || 0);
    acc.other += Number(c.packaging_fee || 0) + Number(c.loading_fee || 0) + Number(c.unloading_fee || 0);
    acc.total += Number(c.grand_total || 0);
    return acc;
  }, { cbm: 0, weight: 0, freight: 0, local_freight: 0, bill_charge: 0, insurance: 0, tax: 0, other: 0, total: 0 });

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 text-base">
        <Info label="Lot No" value={shipment.lot_no} />
        <Info label="Status" value={shipment.status} />
        <Info label="Container" value={`${shipment.container_name} (${shipment.container_type})`} />
        <Info label="Driver" value={`${shipment.driver_name || "—"} · ${shipment.driver_phone || "—"}`} />
        <Info label="From" value={shipment.start_station} />
        <Info label="To" value={shipment.end_station} />
        <Info label="Dispatched By" value={shipment.dispatched_by || "—"} />
        <Info label="Consignments" value={String(shipment.consignment_ids.length)} />
        <div className="col-span-2 md:col-span-4"><Info label="Remarks" value={shipment.remarks || "—"} /></div>
      </div>

      <div>
        <div className="mb-2 text-base font-semibold text-primary">Consignments in this shipment</div>
        <div className="overflow-auto rounded-lg border border-border max-h-[60vh]">
          <table className="w-full text-sm border-separate border-spacing-0">
            <thead className="bg-gradient-primary text-primary-foreground sticky top-0 z-30">
              <tr className="text-left">
                {["Date","Consignment No.","Brand","Description","Cartoon","CTN No.","CBM","Weight","Freight","Local Freight","Bill Charge","Insurance","Other Charges","Tax","Total","Remarks","Actions"].map((h) => {
                  const isBrand = h === "Brand", isCartoon = h === "Cartoon", isActions = h === "Actions";
                  return (
                    <th key={h} className={`px-3 py-2 font-bold text-xs uppercase tracking-wider whitespace-nowrap ${isBrand ? "!bg-amber-500 !text-white" : ""} ${isCartoon ? "!bg-emerald-500 !text-white" : ""} ${isActions ? "sticky right-0 z-40 bg-gradient-primary" : ""}`}>{h}</th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {consignments.length === 0 ? (
                <tr><td colSpan={17} className="px-4 py-8 text-center text-muted-foreground">No consignments</td></tr>
              ) : consignments.map((c) => {
                const other = Number(c.packaging_fee || 0) + Number(c.loading_fee || 0) + Number(c.unloading_fee || 0);
                return (
                  <tr key={c.id} className="group hover:bg-accent/30">
                    <td className="px-3 py-2 whitespace-nowrap border-t border-border bg-card group-hover:bg-accent/30">{new Date(c.start_date).toLocaleDateString()}</td>
                    <td className="px-3 py-2 border-t border-border bg-card group-hover:bg-accent/30"><Badge variant="secondary" className="bg-primary/10 text-primary">{c.bill_no}</Badge></td>
                    <td className="px-3 py-2 font-semibold border-t border-border bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200">{c.marka || "—"}</td>
                    <td className="px-3 py-2 max-w-[220px] truncate border-t border-border bg-card group-hover:bg-accent/30" title={c.description || ""}>{c.description || "—"}</td>
                    <td className="px-3 py-2 text-center font-semibold border-t border-border bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200">{c.cartoon}</td>
                    <td className="px-3 py-2 border-t border-border bg-card group-hover:bg-accent/30">{c.ctn_no || "—"}</td>
                    <td className="px-3 py-2 text-center border-t border-border bg-card group-hover:bg-accent/30">{c.cbm}</td>
                    <td className="px-3 py-2 text-center border-t border-border bg-card group-hover:bg-accent/30">{c.weight}</td>
                    <td className="px-3 py-2 text-right border-t border-border bg-card group-hover:bg-accent/30">¥ {Math.round(Number(c.freight || 0))}</td>
                    <td className="px-3 py-2 text-right border-t border-border bg-card group-hover:bg-accent/30">¥ {Math.round(Number(c.local_freight || 0))}</td>
                    <td className="px-3 py-2 text-right border-t border-border bg-card group-hover:bg-accent/30">¥ {Math.round(Number(c.bill_charge || 0))}</td>
                    <td className="px-3 py-2 text-right border-t border-border bg-card group-hover:bg-accent/30">¥ {Math.round(Number(c.insurance || 0))}</td>
                    <td className="px-3 py-2 text-right border-t border-border bg-card group-hover:bg-accent/30">¥ {Math.round(other)}</td>
                    <td className="px-3 py-2 text-right border-t border-border bg-card group-hover:bg-accent/30">¥ {Math.round(Number(c.tax || 0))}</td>
                    <td className="px-3 py-2 text-right font-semibold border-t border-border bg-card group-hover:bg-accent/30">¥ {Math.round(Number(c.grand_total || 0))}</td>
                    <td className="px-3 py-2 max-w-[180px] truncate border-t border-border bg-card group-hover:bg-accent/30" title={c.remarks || ""}>{c.remarks || "—"}</td>
                    <td className="px-3 py-2 border-t border-border bg-card group-hover:bg-accent/30 sticky right-0 z-20"><ActionButtons onView={() => onView(c)} onEdit={() => onEdit(c)} onDelete={() => onDelete(c)} /></td>
                  </tr>
                );
              })}
            </tbody>
            {consignments.length > 0 && (
              <tfoot className="bg-muted font-semibold">
                <tr>
                  <td className="px-3 py-2" colSpan={6}>Totals</td>
                  <td className="px-3 py-2 text-center">{totals.cbm.toFixed(2)}</td>
                  <td className="px-3 py-2 text-center">{totals.weight.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">¥ {Math.round(totals.freight)}</td>
                  <td className="px-3 py-2 text-right">¥ {Math.round(totals.local_freight)}</td>
                  <td className="px-3 py-2 text-right">¥ {Math.round(totals.bill_charge)}</td>
                  <td className="px-3 py-2 text-right">¥ {Math.round(totals.insurance)}</td>
                  <td className="px-3 py-2 text-right">¥ {Math.round(totals.other)}</td>
                  <td className="px-3 py-2 text-right">¥ {Math.round(totals.tax)}</td>
                  <td className="px-3 py-2 text-right">¥ {Math.round(totals.total)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}

export default Shipments;