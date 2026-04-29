CREATE TABLE public.stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  phone TEXT,
  location TEXT,
  cbm_rate NUMERIC DEFAULT 0,
  weight_rate NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.consignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_no TEXT NOT NULL,
  marka TEXT NOT NULL,
  start_station TEXT NOT NULL,
  end_station TEXT NOT NULL,
  start_date DATE NOT NULL,
  expected_delivery_date DATE,
  client_name TEXT,
  client_phone TEXT,
  cbm NUMERIC DEFAULT 0,
  weight NUMERIC DEFAULT 0,
  quantity NUMERIC DEFAULT 0,
  ctn_no TEXT,
  cartoon NUMERIC DEFAULT 0,
  trade_mode TEXT,
  package_type TEXT,
  serial_prefix TEXT,
  description TEXT,
  remarks TEXT,
  image_url TEXT,
  packaging_fee NUMERIC DEFAULT 0,
  tax NUMERIC DEFAULT 0,
  freight NUMERIC DEFAULT 0,
  local_freight NUMERIC DEFAULT 0,
  insurance NUMERIC DEFAULT 0,
  bill_charge NUMERIC DEFAULT 10,
  loading_fee NUMERIC DEFAULT 0,
  payment_of_goods NUMERIC DEFAULT 0,
  goods_advance NUMERIC DEFAULT 0,
  unloading_fee NUMERIC DEFAULT 0,
  value_of_goods NUMERIC DEFAULT 0,
  payment_amount NUMERIC DEFAULT 0,
  calculation_factor TEXT DEFAULT 'CBM',
  calculation_rate NUMERIC DEFAULT 0,
  sub_total NUMERIC DEFAULT 0,
  advance_amount NUMERIC DEFAULT 0,
  grand_total NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'Pending',
  payment_status TEXT DEFAULT 'Unpaid',
  current_station TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  container_name TEXT NOT NULL,
  container_type TEXT,
  container_image_url TEXT,
  lot_no TEXT NOT NULL,
  driver_name TEXT,
  driver_phone TEXT,
  start_station TEXT NOT NULL,
  end_station TEXT NOT NULL,
  consignment_ids JSONB DEFAULT '[]'::jsonb,
  remarks TEXT,
  status TEXT DEFAULT 'In Transit',
  dispatched_by TEXT,
  arrival_approved_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Open stations" ON public.stations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Open clients" ON public.clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Open consignments" ON public.consignments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Open shipments" ON public.shipments FOR ALL USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_stations_updated BEFORE UPDATE ON public.stations
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_consignments_updated BEFORE UPDATE ON public.consignments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_shipments_updated BEFORE UPDATE ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();