/*
  # Create storage bucket for goat photos

  1. Storage Setup
    - Create `goat-photos` storage bucket
    - Set up public access for image viewing
    - Configure RLS policies for secure uploads

  2. Security
    - Enable RLS on storage bucket
    - Allow authenticated users to upload to their own folders
    - Allow public read access for image display
*/

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'goat-photos',
  'goat-photos',
  true,
  262144, -- 256KB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Enable RLS on the bucket
UPDATE storage.buckets 
SET public = true 
WHERE id = 'goat-photos';

-- Create policy to allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload goat photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'goat-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy to allow authenticated users to view images
CREATE POLICY "Anyone can view goat photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'goat-photos');

-- Create policy to allow authenticated users to delete their own images
CREATE POLICY "Users can delete their own goat photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'goat-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy to allow authenticated users to update their own images
CREATE POLICY "Users can update their own goat photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'goat-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);