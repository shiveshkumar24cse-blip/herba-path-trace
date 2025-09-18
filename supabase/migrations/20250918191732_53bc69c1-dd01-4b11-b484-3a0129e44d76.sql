-- Create user profiles table with roles
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('farmer', 'wild_collector', 'aggregator', 'lab', 'factory', 'consumer', 'admin')),
  organization TEXT,
  aadhaar_id TEXT,
  cooperative_group TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create collectors table for farmer/wild collector registration
CREATE TABLE public.collectors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  collector_type TEXT NOT NULL CHECK (collector_type IN ('farmer', 'wild_collector')),
  aadhaar_id TEXT,
  cooperative_id TEXT,
  contact_details JSONB,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create herbs/species master table
CREATE TABLE public.herbs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  botanical_name TEXT NOT NULL UNIQUE,
  local_name TEXT NOT NULL,
  plant_family TEXT,
  medicinal_properties TEXT[],
  harvest_season TEXT[],
  conservation_status TEXT CHECK (conservation_status IN ('common', 'vulnerable', 'endangered', 'critical')),
  approved_regions TEXT[],
  quality_parameters JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create collection events table
CREATE TABLE public.collection_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  collector_id UUID NOT NULL REFERENCES public.collectors(id),
  herb_id UUID NOT NULL REFERENCES public.herbs(id),
  plant_part TEXT NOT NULL CHECK (plant_part IN ('leaf', 'root', 'seed', 'bark', 'flower', 'fruit', 'whole_plant')),
  quantity_kg DECIMAL(10,2) NOT NULL,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  collection_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  harvest_season TEXT NOT NULL,
  initial_condition TEXT NOT NULL CHECK (initial_condition IN ('fresh', 'dry', 'damaged', 'excellent', 'good', 'fair')),
  storage_conditions JSONB,
  environmental_data JSONB,
  blockchain_hash TEXT UNIQUE,
  compliance_validated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create batches table
CREATE TABLE public.batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id TEXT NOT NULL UNIQUE,
  herb_id UUID NOT NULL REFERENCES public.herbs(id),
  total_quantity_kg DECIMAL(10,2) NOT NULL,
  batch_status TEXT DEFAULT 'created' CHECK (batch_status IN ('created', 'lab_testing', 'approved', 'rejected', 'dispatched', 'sold')),
  aggregator_id UUID NOT NULL REFERENCES public.profiles(id),
  creation_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  quality_notes TEXT,
  storage_location TEXT,
  blockchain_hash TEXT UNIQUE,
  qr_code TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create batch collections mapping
CREATE TABLE public.batch_collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  collection_event_id UUID NOT NULL REFERENCES public.collection_events(id),
  contribution_percentage DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quality tests table
CREATE TABLE public.quality_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES public.batches(id),
  lab_id UUID NOT NULL REFERENCES public.profiles(id),
  sample_id TEXT NOT NULL UNIQUE,
  test_type TEXT NOT NULL CHECK (test_type IN ('moisture', 'pesticide', 'dna_barcode', 'heavy_metals', 'microbial', 'chemical_composition')),
  test_parameters JSONB NOT NULL,
  test_results JSONB NOT NULL,
  test_status TEXT DEFAULT 'pending' CHECK (test_status IN ('pending', 'in_progress', 'completed', 'failed')),
  test_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completion_date TIMESTAMP WITH TIME ZONE,
  certificate_url TEXT,
  blockchain_hash TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create processing steps table
CREATE TABLE public.processing_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES public.batches(id),
  processor_id UUID NOT NULL REFERENCES public.profiles(id),
  process_type TEXT NOT NULL CHECK (process_type IN ('drying', 'grinding', 'extraction', 'purification', 'packaging', 'formulation')),
  process_parameters JSONB NOT NULL,
  input_quantity_kg DECIMAL(10,2) NOT NULL,
  output_quantity_kg DECIMAL(10,2),
  process_conditions JSONB,
  process_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completion_date TIMESTAMP WITH TIME ZONE,
  quality_metrics JSONB,
  blockchain_hash TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table for final formulated products
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_name TEXT NOT NULL,
  product_type TEXT NOT NULL,
  manufacturer_id UUID NOT NULL REFERENCES public.profiles(id),
  batch_ids UUID[] NOT NULL,
  formulation_details JSONB NOT NULL,
  final_quantity INTEGER NOT NULL,
  unit_type TEXT NOT NULL CHECK (unit_type IN ('bottles', 'packets', 'tablets', 'capsules')),
  qr_code TEXT NOT NULL UNIQUE,
  manufacturing_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expiry_date TIMESTAMP WITH TIME ZONE,
  regulatory_approvals JSONB,
  blockchain_hash TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create handoffs table for supply chain transfers
CREATE TABLE public.handoffs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_entity_id UUID NOT NULL REFERENCES public.profiles(id),
  to_entity_id UUID NOT NULL REFERENCES public.profiles(id),
  item_type TEXT NOT NULL CHECK (item_type IN ('batch', 'product', 'sample')),
  item_id UUID NOT NULL,
  handoff_type TEXT NOT NULL CHECK (handoff_type IN ('sale', 'transfer', 'sample_dispatch', 'processing')),
  quantity DECIMAL(10,2),
  handoff_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  conditions JSONB,
  chain_of_custody JSONB NOT NULL,
  blockchain_hash TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create compliance rules table
CREATE TABLE public.compliance_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  herb_id UUID NOT NULL REFERENCES public.herbs(id),
  rule_type TEXT NOT NULL CHECK (rule_type IN ('geo_fencing', 'seasonal', 'quantity_limit', 'quality_threshold')),
  rule_parameters JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create blockchain records table (simulated blockchain)
CREATE TABLE public.blockchain_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  block_hash TEXT NOT NULL UNIQUE,
  previous_hash TEXT,
  transaction_type TEXT NOT NULL,
  transaction_data JSONB NOT NULL,
  entity_id UUID NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  block_number BIGINT NOT NULL,
  merkle_root TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.herbs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quality_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processing_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.handoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockchain_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for collectors
CREATE POLICY "Users can view collectors they interact with" ON public.collectors FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = collectors.profile_id AND user_id = auth.uid())
  OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('aggregator', 'admin'))
);
CREATE POLICY "Users can manage their collector profile" ON public.collectors FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = collectors.profile_id AND user_id = auth.uid())
);

-- Create RLS policies for herbs (public read access)
CREATE POLICY "Anyone can view herbs" ON public.herbs FOR SELECT USING (true);
CREATE POLICY "Admins can manage herbs" ON public.herbs FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Create RLS policies for collection events
CREATE POLICY "Users can view related collection events" ON public.collection_events FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.collectors c 
    JOIN public.profiles p ON c.profile_id = p.id 
    WHERE c.id = collection_events.collector_id AND p.user_id = auth.uid()
  )
  OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('aggregator', 'lab', 'factory', 'admin'))
);
CREATE POLICY "Collectors can manage their collection events" ON public.collection_events FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.collectors c 
    JOIN public.profiles p ON c.profile_id = p.id 
    WHERE c.id = collection_events.collector_id AND p.user_id = auth.uid()
  )
);

-- Create RLS policies for batches
CREATE POLICY "Users can view related batches" ON public.batches FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND (id = batches.aggregator_id OR role IN ('lab', 'factory', 'admin')))
  OR
  EXISTS (
    SELECT 1 FROM public.batch_collections bc
    JOIN public.collection_events ce ON bc.collection_event_id = ce.id
    JOIN public.collectors c ON ce.collector_id = c.id
    JOIN public.profiles p ON c.profile_id = p.id
    WHERE bc.batch_id = batches.id AND p.user_id = auth.uid()
  )
);
CREATE POLICY "Aggregators can manage batches" ON public.batches FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND (id = batches.aggregator_id OR role = 'admin'))
);

-- Create RLS policies for batch collections
CREATE POLICY "Users can view related batch collections" ON public.batch_collections FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.batches b 
    JOIN public.profiles p ON b.aggregator_id = p.id 
    WHERE b.id = batch_collections.batch_id AND p.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.collection_events ce
    JOIN public.collectors c ON ce.collector_id = c.id
    JOIN public.profiles p ON c.profile_id = p.id
    WHERE ce.id = batch_collections.collection_event_id AND p.user_id = auth.uid()
  )
);

-- Create RLS policies for quality tests
CREATE POLICY "Users can view related quality tests" ON public.quality_tests FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND (id = quality_tests.lab_id OR role IN ('aggregator', 'factory', 'admin')))
  OR
  EXISTS (
    SELECT 1 FROM public.batches b 
    JOIN public.profiles p ON b.aggregator_id = p.id 
    WHERE b.id = quality_tests.batch_id AND p.user_id = auth.uid()
  )
);
CREATE POLICY "Labs can manage quality tests" ON public.quality_tests FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND (id = quality_tests.lab_id OR role = 'admin'))
);

-- Create RLS policies for processing steps
CREATE POLICY "Users can view related processing steps" ON public.processing_steps FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND (id = processing_steps.processor_id OR role IN ('aggregator', 'admin')))
  OR
  EXISTS (
    SELECT 1 FROM public.batches b 
    JOIN public.profiles p ON b.aggregator_id = p.id 
    WHERE b.id = processing_steps.batch_id AND p.user_id = auth.uid()
  )
);
CREATE POLICY "Factories can manage processing steps" ON public.processing_steps FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND (id = processing_steps.processor_id OR role = 'admin'))
);

-- Create RLS policies for products (public read for consumers)
CREATE POLICY "Anyone can view products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Manufacturers can manage products" ON public.products FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND (id = products.manufacturer_id OR role = 'admin'))
);

-- Create RLS policies for handoffs
CREATE POLICY "Users can view related handoffs" ON public.handoffs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND (id = handoffs.from_entity_id OR id = handoffs.to_entity_id OR role = 'admin'))
);
CREATE POLICY "Users can create handoffs" ON public.handoffs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND id = handoffs.from_entity_id)
);

-- Create RLS policies for compliance rules (read-only for most users)
CREATE POLICY "Anyone can view compliance rules" ON public.compliance_rules FOR SELECT USING (true);
CREATE POLICY "Admins can manage compliance rules" ON public.compliance_rules FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Create RLS policies for blockchain records (read-only)
CREATE POLICY "Anyone can view blockchain records" ON public.blockchain_records FOR SELECT USING (true);
CREATE POLICY "System can insert blockchain records" ON public.blockchain_records FOR INSERT WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample herb species
INSERT INTO public.herbs (botanical_name, local_name, plant_family, medicinal_properties, harvest_season, conservation_status, approved_regions, quality_parameters) VALUES
('Withania somnifera', 'Ashwagandha', 'Solanaceae', ARRAY['adaptogenic', 'anti-stress', 'immunomodulatory'], ARRAY['winter', 'post-monsoon'], 'common', ARRAY['Rajasthan', 'Madhya Pradesh', 'Gujarat'], '{"moisture_max": 12, "withanolides_min": 0.3}'),
('Bacopa monnieri', 'Brahmi', 'Plantaginaceae', ARRAY['nootropic', 'memory-enhancer', 'neuroprotective'], ARRAY['monsoon', 'post-monsoon'], 'common', ARRAY['Kerala', 'Tamil Nadu', 'Andhra Pradesh'], '{"moisture_max": 10, "bacosides_min": 2.5}'),
('Centella asiatica', 'Mandukaparni', 'Apiaceae', ARRAY['wound-healing', 'anti-inflammatory', 'cognitive'], ARRAY['monsoon', 'winter'], 'vulnerable', ARRAY['Western Ghats', 'Northeast India'], '{"moisture_max": 8, "asiaticoside_min": 0.1}'),
('Curcuma longa', 'Haldi', 'Zingiberaceae', ARRAY['anti-inflammatory', 'antioxidant', 'hepatoprotective'], ARRAY['post-monsoon', 'winter'], 'common', ARRAY['Andhra Pradesh', 'Tamil Nadu', 'Karnataka'], '{"moisture_max": 10, "curcumin_min": 3.0}'),
('Tinospora cordifolia', 'Giloy', 'Menispermaceae', ARRAY['immunomodulatory', 'hepatoprotective', 'anti-diabetic'], ARRAY['winter', 'spring'], 'vulnerable', ARRAY['Central India', 'Northern Plains'], '{"moisture_max": 12, "alkaloids_min": 0.15}');

-- Create sequence for batch IDs
CREATE SEQUENCE batch_id_seq START 1000;