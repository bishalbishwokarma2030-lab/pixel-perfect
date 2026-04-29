import { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
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
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Shipment | null>(null);
  const [form, setForm] = useState<any>(empty);
  const [viewing, setViewing] = useState<Shipment | null>(null);

  const load = () => Promise.all([api.shipments.list(), api.stations.list(), api.consignments.list()])
    .then(([sh, st, cn]) => { setItems(sh); setStations(st); setConsignments(cn); })
    .catch((e) => toast.error(e.message));
  useEffect(() => { load(); }, []);

  const filtered = items.filter((s) => [s.lot_no, s.container_name, s.driver_name, s.start_station, s.end_station].filter(Boolean).join(" ").toLowerCase().includes(search.toLowerCase()));

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
            <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="pl-9 w-64" /></div>
            <Button onClick={openCreate} className="bg-gradient-primary text-primary-foreground"><Plus className="mr-1 h-4 w-4" />Create Shipment</Button>
          </>
        }
      />
      <div className="p-6">
        <div className="mb-3 text-sm text-muted-foreground">Showing {filtered.length} of {items.length}</div>
        <DataTable<Shipment>
          data={filtered}
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
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Shipment Details</DialogTitle></DialogHeader>
          {viewing && (
            <div className="grid grid-cols-2 gap-3 text-base">
              <Info label="Lot No" value={viewing.lot_no} />
              <Info label="Status" value={viewing.status} />
              <Info label="Container" value={`${viewing.container_name} (${viewing.container_type})`} />
              <Info label="Driver" value={`${viewing.driver_name || "—"} · ${viewing.driver_phone || "—"}`} />
              <Info label="From" value={viewing.start_station} />
              <Info label="To" value={viewing.end_station} />
              <Info label="Dispatched By" value={viewing.dispatched_by || "—"} />
              <Info label="Consignments" value={String(viewing.consignment_ids.length)} />
              <div className="col-span-2"><Info label="Remarks" value={viewing.remarks || "—"} /></div>
            </div>
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

export default Shipments;