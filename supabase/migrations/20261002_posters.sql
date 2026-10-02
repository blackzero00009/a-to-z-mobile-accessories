-- Create posters table for homepage carousel
CREATE TABLE public.posters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  item_name TEXT NOT NULL,
  price NUMERIC(10, 2),
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.posters ENABLE ROW LEVEL SECURITY;

-- Admins can manage posters
CREATE POLICY "admins manage posters" ON public.posters
  FOR ALL
  USING (public.is_active_admin())
  WITH CHECK (public.is_active_admin());

-- Public can view active posters
CREATE POLICY "public view active posters" ON public.posters
  FOR SELECT
  USING (is_active = TRUE);

-- Create storage bucket for poster images
INSERT INTO storage.buckets (id, name, public)
VALUES ('poster-images', 'poster-images', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for poster images
CREATE POLICY "admins upload poster images" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'poster-images' AND
    public.is_active_admin()
  );

CREATE POLICY "admins update poster images" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'poster-images' AND
    public.is_active_admin()
  );

CREATE POLICY "admins delete poster images" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'poster-images' AND
    public.is_active_admin()
  );

CREATE POLICY "public view poster images" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'poster-images');

-- Index for sorting
CREATE INDEX idx_posters_sort_order ON public.posters(sort_order);
CREATE INDEX idx_posters_is_active ON public.posters(is_active);
