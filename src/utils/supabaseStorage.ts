import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

const BUCKET_NAME = 'goat-photos';

export const uploadImage = async (file: File, userId: string): Promise<string> => {
  const fileExtension = file.name.split('.').pop();
  const fileName = `${uuidv4()}.${fileExtension}`;
  const filePath = `${userId}/${fileName}`; // Store images under user ID folder

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600', // Cache for 1 hour
      upsert: false, // Do not overwrite existing files
    });

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  if (!publicUrlData) {
    throw new Error('Failed to get public URL for uploaded image.');
  }

  return publicUrlData.publicUrl;
};

export const deleteImage = async (publicUrl: string): Promise<void> => {
  // Extract file path from public URL
  const pathSegments = publicUrl.split('/');
  const bucketIndex = pathSegments.indexOf(BUCKET_NAME);
  if (bucketIndex === -1 || bucketIndex + 1 >= pathSegments.length) {
    console.warn('Could not parse file path from public URL for deletion:', publicUrl);
    return;
  }
  const filePath = pathSegments.slice(bucketIndex + 1).join('/');

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath]);

  if (error) {
    console.error(`Failed to delete image from storage: ${error.message}`);
    throw new Error(`Failed to delete image: ${error.message}`);
  }
};