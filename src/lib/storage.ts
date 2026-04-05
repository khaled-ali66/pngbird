import { supabase } from './supabase';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export interface SavedImage {
  id: string;
  url: string; // public url from supabase storage
  prompt: string;
  timestamp: number;
  model?: string;
  aspectRatio?: string;
  quality?: string;
  tags?: string[];
  title?: string;
  description?: string;
  category?: string;
}

export const storage = {
  async saveImage(userId: string, image: Omit<SavedImage, 'id' | 'timestamp'>): Promise<SavedImage> {
    if (!userId) {
      console.warn('User not authenticated, skipping history save.');
      return { id: 'dummy', url: image.url, prompt: image.prompt, timestamp: Date.now() };
    }

    let finalUrl = image.url;

    // If it's a base64 or data URL, upload it to Supabase Storage
    if (image.url.startsWith('data:image')) {
      const base64Data = image.url.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });

      const fileName = `${userId}/${Date.now()}_${crypto.randomUUID()}.png`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('generated_images')
        .upload(fileName, blob, {
          contentType: 'image/png',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('generated_images')
        .getPublicUrl(fileName);

      finalUrl = publicUrl;
    }

    const { data, error } = await supabase
      .from('saved_images')
      .insert([{
        user_id: userId,
        url: finalUrl,
        prompt: image.prompt,
        model: image.model,
        aspect_ratio: image.aspectRatio,
        quality: image.quality,
        tags: image.tags,
        title: image.title,
        description: image.description,
        category: image.category
      }])
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      url: data.url,
      prompt: data.prompt,
      timestamp: new Date(data.created_at).getTime(),
      model: data.model,
      aspectRatio: data.aspect_ratio,
      quality: data.quality,
      tags: data.tags,
      title: data.title,
      description: data.description,
      category: data.category
    };
  },

  async updateImage(userId: string, id: string, updates: Partial<SavedImage>): Promise<void> {
    if (id === 'dummy') return; // Skip updating dummy images
    if (!userId) {
      console.warn('User not authenticated, skipping history update.');
      return;
    }

    const dbUpdates: any = {};
    if (updates.prompt !== undefined) dbUpdates.prompt = updates.prompt;
    if (updates.model !== undefined) dbUpdates.model = updates.model;
    if (updates.aspectRatio !== undefined) dbUpdates.aspect_ratio = updates.aspectRatio;
    if (updates.quality !== undefined) dbUpdates.quality = updates.quality;
    if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.category !== undefined) dbUpdates.category = updates.category;

    const { error } = await supabase
      .from('saved_images')
      .update(dbUpdates)
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  },

  async getImages(userId: string, limit?: number): Promise<SavedImage[]> {
    if (!userId) return [];

    let query = supabase
      .from('saved_images')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (limit && limit > 0) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data.map(row => ({
      id: row.id,
      url: row.url,
      prompt: row.prompt,
      timestamp: new Date(row.created_at).getTime(),
      model: row.model,
      aspectRatio: row.aspect_ratio,
      quality: row.quality,
      tags: row.tags,
      title: row.title,
      description: row.description,
      category: row.category
    }));
  },

  async deleteImage(userId: string, id: string): Promise<void> {
    if (!userId) throw new Error('User not authenticated');

    // Get the image URL to delete from storage
    const { data: image } = await supabase
      .from('saved_images')
      .select('url')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (image && image.url) {
      // Extract path from public URL
      const urlParts = image.url.split('/generated_images/');
      if (urlParts.length > 1) {
        const path = urlParts[1];
        await supabase.storage.from('generated_images').remove([path]);
      }
    }

    const { error } = await supabase
      .from('saved_images')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  },

  async deleteAllImages(userId: string): Promise<void> {
    if (!userId) throw new Error('User not authenticated');

    // Get all images to delete from storage
    const { data: images } = await supabase
      .from('saved_images')
      .select('url')
      .eq('user_id', userId);

    if (images && images.length > 0) {
      const paths = images
        .map(img => {
          const parts = img.url.split('/generated_images/');
          return parts.length > 1 ? parts[1] : null;
        })
        .filter(Boolean) as string[];

      if (paths.length > 0) {
        await supabase.storage.from('generated_images').remove(paths);
      }
    }

    const { error } = await supabase
      .from('saved_images')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
  },

  async exportImagesZip(userId: string): Promise<void> {
    const images = await this.getImages(userId);
    if (images.length === 0) {
      throw new Error('No images to export');
    }

    const zip = new JSZip();
    const imgFolder = zip.folder('generated_images');

    if (!imgFolder) {
      throw new Error('Failed to create zip folder');
    }

    // Fetch all images and add to zip
    const fetchPromises = images.map(async (img, index) => {
      try {
        const response = await fetch(img.url);
        const blob = await response.blob();
        
        // Create a safe filename from the prompt
        const safePrompt = img.prompt.replace(/[^a-z0-9]/gi, '_').substring(0, 30);
        const filename = `${index + 1}_${safePrompt}_${img.timestamp}.png`;
        imgFolder.file(filename, blob);
      } catch (err) {
        console.error(`Failed to fetch image ${img.url}`, err);
      }
    });

    await Promise.all(fetchPromises);

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'my_generated_images.zip');
  }
};
