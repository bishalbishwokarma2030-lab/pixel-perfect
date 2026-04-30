CREATE TABLE public.delivery_receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  consignment_ids JSONB DEFAULT '[]'::jsonb,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_email TEXT,
  receiver_name TEXT NOT NULL,
  receiver_phone TEXT NOT NULL,
  receiver_email TEXT,
  remarks TEXT,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.delivery_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Open delivery_receipts" ON public.delivery_receipts FOR ALL USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.set_delivery_receipts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_delivery_receipts_updated_at
BEFORE UPDATE ON public.delivery_receipts
FOR EACH ROW EXECUTE FUNCTION public.set_delivery_receipts_updated_at();