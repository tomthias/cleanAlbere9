-- 1. Create the area_swaps table
CREATE TABLE IF NOT EXISTS public.area_swaps (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    week_id int4 NOT NULL,
    area_id text NOT NULL,
    original_person text NOT NULL,
    swapped_with text NULL,
    status text NOT NULL DEFAULT 'pending'::text, -- 'pending', 'accepted', 'cancelled'
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT area_swaps_pkey PRIMARY KEY (id)
);

-- 2. Enable Row Level Security
ALTER TABLE public.area_swaps ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
-- Note: Using simple policies as requested. Can be refined for specific users.

-- Everyone can view swaps
CREATE POLICY "Enable read access for all" 
ON public.area_swaps 
FOR SELECT 
USING (true);

-- Everyone can create a swap request
CREATE POLICY "Enable insert for all" 
ON public.area_swaps 
FOR INSERT 
WITH CHECK (true);

-- Everyone can update a swap (to accept or cancel)
CREATE POLICY "Enable update for all" 
ON public.area_swaps 
FOR UPDATE 
USING (true);

-- 4. Enable Realtime for the table
-- Run this if you want realtime updates for this table
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.area_swaps;
