-- Enquiry status workflow + customer email
ALTER TABLE public.enquiries ADD COLUMN IF NOT EXISTS customer_email text;
ALTER TABLE public.enquiries ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'NEW';

ALTER TABLE public.enquiries ADD CONSTRAINT enquiries_status_check
  CHECK (status IN ('NEW', 'IN PROGRESS', 'RESOLVED'));

-- Allow public inserts to keep working with the new column (no policy change needed)
-- Admins can update enquiry status
CREATE POLICY "admins update enquiries" ON public.enquiries
  FOR UPDATE
  USING (public.is_active_admin())
  WITH CHECK (public.is_active_admin());

CREATE INDEX idx_enquiries_status ON public.enquiries(status);
CREATE INDEX idx_enquiries_created_at ON public.enquiries(created_at DESC);
