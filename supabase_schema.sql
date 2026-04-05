-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  plan TEXT DEFAULT 'free',
  generate_count INTEGER DEFAULT 0,
  remove_bg_count INTEGER DEFAULT 0,
  is_paid BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create generations table
CREATE TABLE generations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  prompt TEXT,
  image_url TEXT NOT NULL,
  result_image TEXT,
  source_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Generations Policies
CREATE POLICY "Users can view their own generations" ON generations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own generations" ON generations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own generations" ON generations
  FOR DELETE USING (auth.uid() = user_id);

-- Create saved_images table
CREATE TABLE saved_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  prompt TEXT,
  model TEXT,
  aspect_ratio TEXT,
  quality TEXT,
  tags TEXT[],
  title TEXT,
  description TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE saved_images ENABLE ROW LEVEL SECURITY;

-- Policies for saved_images
CREATE POLICY "Users can view their own saved images" ON saved_images
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved images" ON saved_images
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved images" ON saved_images
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved images" ON saved_images
  FOR DELETE USING (auth.uid() = user_id);

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public) VALUES ('generated_images', 'generated_images', true) ON CONFLICT DO NOTHING;

-- Storage policies
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'generated_images');
CREATE POLICY "Users can upload their own images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'generated_images' AND auth.uid() = owner);
CREATE POLICY "Users can update their own images" ON storage.objects FOR UPDATE USING (bucket_id = 'generated_images' AND auth.uid() = owner);
CREATE POLICY "Users can delete their own images" ON storage.objects FOR DELETE USING (bucket_id = 'generated_images' AND auth.uid() = owner);
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Table للصور
create table gallery_images (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  tags text[] default '{}',
  category text not null,
  image_url text not null,
  thumb_url text,
  width int default 800,
  height int default 800,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Storage bucket للصور
insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', true);

-- Policy: anyone can view
create policy "Public read" on storage.objects
  for select using (bucket_id = 'gallery');

-- Policy: only authenticated (admin) can upload/delete
create policy "Admin upload" on storage.objects
  for insert with check (bucket_id = 'gallery' and auth.role() = 'authenticated');

create policy "Admin delete" on storage.objects
  for delete using (bucket_id = 'gallery' and auth.role() = 'authenticated');

-- RLS on table
alter table gallery_images enable row level security;
create policy "Public read images" on gallery_images for select using (true);
create policy "Admin all" on gallery_images for all using (auth.role() = 'authenticated');