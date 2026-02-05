import { api, endpoints } from './api';

export class UploadService {

  // Ensure bucket exists (No-op in new backend structure, kept for compatibility if needed)
  static async ensureBucketExists(bucketName: string, isPublic: boolean = true): Promise<void> {
    return;
  }

  // Upload file to Backend
  static async uploadFile(
    file: File,
    bucket: string, // Ignored in backend for now, everything goes to /uploads
    path: string, // Ignored
    options?: {
      cacheControl?: string;
      upsert?: boolean;
    }
  ): Promise<{ path: string; publicUrl: string }> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/upload/file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return {
        path: response.data.path,
        publicUrl: response.data.publicUrl,
      };
    } catch (error: any) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  // Upload multiple files
  static async uploadMultipleFiles(
    files: File[],
    bucket: string,
    basePath: string,
    userId: string
  ): Promise<Array<{ path: string; publicUrl: string; name: string }>> {
    try {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));

      const response = await api.post('/upload/files', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Backend returns array of { originalname, filename, path, publicUrl }
      // We map to expected return type
      return response.data.map((item: any) => ({
        path: item.path,
        publicUrl: item.publicUrl,
        name: item.originalname
      }));
    } catch (error) {
      console.error('Error uploading multiple files:', error);
      throw error;
    }
  }

  // Upload listing images
  static async uploadListingImages(
    files: File[],
    userId: string,
    listingId?: string
  ): Promise<Array<{ url: string; public_id: string; caption?: string; is_primary: boolean }>> {
    try {
      // Use uploadMultipleFiles
      const results = await this.uploadMultipleFiles(files, 'listing-images', 'ignored', userId);

      return results.map((result, index) => ({
        url: result.publicUrl,
        public_id: result.path,
        caption: '',
        is_primary: index === 0,
      }));
    } catch (error) {
      console.error('Error uploading listing images:', error);
      throw error;
    }
  }

  // Upload user avatar
  static async uploadUserAvatar(
    file: File,
    userId: string
  ): Promise<{ url: string; public_id: string }> {
    try {
      const result = await this.uploadFile(file, 'user-avatars', 'ignored');
      return {
        url: result.publicUrl,
        public_id: result.path
      };
    } catch (error: any) {
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  // Upload documents
  static async uploadDocuments(
    files: File[],
    userId: string,
    listingId?: string
  ): Promise<Array<{ name: string; url: string; type: string; public_id: string }>> {
    try {
      const results = await this.uploadMultipleFiles(files, 'documents', 'ignored', userId);

      return results.map((result) => ({
        name: result.name || 'document',
        url: result.publicUrl,
        type: this.getDocumentType(result.name || 'file.pdf'),
        public_id: result.path,
      }));
    } catch (error) {
      console.error('Error uploading documents:', error);
      throw error;
    }
  }

  // Delete file
  static async deleteFile(bucket: string, path: string): Promise<void> {
    // TODO: Implement delete endpoint on backend
    console.warn('Delete file not implemented in backend');
  }

  // Delete multiple files
  static async deleteMultipleFiles(bucket: string, paths: string[]): Promise<void> {
    // TODO: Implement delete endpoint on backend
    console.warn('Delete multiple files not implemented in backend');
  }

  // Get file URL (Already returned by upload, but helper if needed)
  static getFileUrl(bucket: string, path: string): string {
    // Return absolute URL if path is relative
    if (path.startsWith('http')) return path;
    return `${api.defaults.baseURL}/${path}`;
  }

  // Get signed URL for private files
  static async getSignedUrl(
    bucket: string,
    path: string,
    expiresIn: number = 3600
  ): Promise<string> {
    // For now, return public URL as we don't have private bucket implementation
    return this.getFileUrl(bucket, path);
  }

  // Validate file type
  static validateFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.includes(file.type);
  }

  // Validate file size
  static validateFileSize(file: File, maxSizeInMB: number): boolean {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    return file.size <= maxSizeInBytes;
  }

  // Get document type from filename
  private static getDocumentType(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'pdf':
        return 'ownership';
      case 'jpg':
      case 'jpeg':
      case 'png':
        return 'registration';
      case 'doc':
      case 'docx':
        return 'insurance';
      default:
        return 'other';
    }
  }

  // Compress image before upload
  static async compressImage(
    file: File,
    maxWidth: number = 1200,
    quality: number = 0.8
  ): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          file.type,
          quality
        );
      };

      img.src = URL.createObjectURL(file);
    });
  }
}