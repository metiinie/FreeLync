import { api, endpoints } from './api';
import { BaseService, ServiceResponse } from './base';
import { Listing, SearchFilters, CreateListingData, UpdateListingData } from '../types';

export class ListingsService extends BaseService {
  // Get all listings with filters and pagination
  static async getListings(
    filters: SearchFilters = {},
    pagination: { page: number; limit: number } = { page: 1, limit: 12 }
  ): Promise<{ success: boolean; data: Listing[]; total: number; message?: string }> {
    try {
      const response = await api.get(endpoints.listings.list, {
        params: { ...filters, ...pagination }
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        data: [],
        total: 0,
        message: error.message || 'Failed to fetch listings',
      };
    }
  }

  // Get a single listing by ID
  static async getListingById(id: string): Promise<{ success: boolean; data: Listing | null; message?: string }> {
    try {
      const response = await api.get(endpoints.listings.detail(id));
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.message || 'Failed to fetch listing',
      };
    }
  }

  // Get user's own listings
  static async getUserListings(
    userId: string,
    pagination: { page: number; limit: number } = { page: 1, limit: 12 }
  ): Promise<{ success: boolean; data: Listing[]; total: number; message?: string }> {
    try {
      // Assuming backend handles user filtering via token or a dedicated endpoint like /users/me/listings
      // Or we can pass owner_id as filter to list endpoint if supported
      const response = await api.get(endpoints.listings.list, {
        params: { ...pagination, owner_id: userId }
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        data: [],
        total: 0,
        message: error.message || 'Failed to fetch user listings',
      };
    }
  }

  // Create a new listing
  static async createListing(listingData: CreateListingData): Promise<{ success: boolean; data: Listing | null; message?: string }> {
    try {
      // 1. Upload Images
      let uploadedImages: any[] = [];
      if (listingData.images && listingData.images.length > 0) {
        const files = listingData.images as unknown as File[];
        // Check if they are actually Files
        if (files[0] instanceof File) {
          const { UploadService } = await import('./upload');
          uploadedImages = await UploadService.uploadListingImages(files, 'user-id-placeholder'); // UserId handled in backend usually? Or we need currentUser here.
          // But uploadService.uploadListingImages returns { url, public_id... }
        } else {
          uploadedImages = listingData.images; // Already URLs?
        }
      }

      // 2. Upload Documents
      let uploadedDocuments: any[] = [];
      if (listingData.documents && listingData.documents.length > 0) {
        const files = listingData.documents as unknown as File[];
        if (files[0] instanceof File) {
          const { UploadService } = await import('./upload');
          uploadedDocuments = await UploadService.uploadDocuments(files, 'user-id-placeholder');
        } else {
          uploadedDocuments = listingData.documents;
        }
      }

      // 3. Prepare JSON payload
      const payload = {
        ...listingData,
        images: uploadedImages,
        documents: uploadedDocuments
      };

      // 4. Send JSON
      const response = await api.post(endpoints.listings.create, payload);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.message || 'Failed to create listing',
      };
    }
  }

  // Update a listing
  static async updateListing(
    id: string,
    updates: UpdateListingData
  ): Promise<{ success: boolean; data: Listing | null; message?: string }> {
    try {
      const response = await api.patch(endpoints.listings.update(id), updates);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.message || 'Failed to update listing',
      };
    }
  }

  // Delete a listing
  static async deleteListing(id: string): Promise<ServiceResponse> {
    try {
      const response = await api.delete(endpoints.listings.delete(id));
      return response.data;
    } catch (error: any) {
      return this.handleError(error, 'deleteListing');
    }
  }

  // Increment view count
  static async incrementViews(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      // Assuming backend has an endpoint or we treat it as an update
      // Just ignore or use update
      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  // Get featured listings
  static async getFeaturedListings(limit: number = 6): Promise<{ success: boolean; data: Listing[]; message?: string }> {
    try {
      return await this.getListings({ sortBy: 'views_desc' }, { page: 1, limit });
    } catch (error: any) {
      return { success: false, data: [], message: error.message };
    }
  }

  // Get listings by category
  static async getListingsByCategory(
    category: string,
    limit: number = 12
  ): Promise<{ success: boolean; data: Listing[]; message?: string }> {
    return this.getListings({ category }, { page: 1, limit });
  }

  // Search listings
  static async searchListings(
    searchTerm: string,
    filters: Omit<SearchFilters, 'search'> = {},
    pagination: { page: number; limit: number } = { page: 1, limit: 12 }
  ): Promise<{ success: boolean; data: Listing[]; total: number; message?: string }> {
    return this.getListings({ ...filters, search: searchTerm }, pagination);
  }

  // Get similar listings
  static async getSimilarListings(
    listingId: string,
    limit: number = 4
  ): Promise<{ success: boolean; data: Listing[]; message?: string }> {
    // Backend should implement this logic ideally, or we execute multiple calls
    // For now, let's keep it simple and just fetch latest
    return this.getListings({}, { page: 1, limit });
  }

  // Get all listings for admin (including pending)
  static async getAllListingsForAdmin(
    filters: SearchFilters = {},
    pagination: { page: number; limit: number } = { page: 1, limit: 100 }
  ): Promise<{ success: boolean; data: Listing[]; total: number; message?: string }> {
    try {
      const response = await api.get('/admin/listings', {
        params: { ...filters, ...pagination }
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        data: [],
        total: 0,
        message: error.message || 'Failed to fetch admin listings',
      };
    }
  }

  // Approve listing (Admin)
  static async approveListing(id: string, reason?: string, notes?: string): Promise<ServiceResponse> {
    try {
      const response = await api.patch(`/admin/listings/${id}/approve`, { reason, notes });
      return response.data;
    } catch (error: any) {
      return this.handleError(error, 'approveListing');
    }
  }

  // Reject listing (Admin)
  static async rejectListing(id: string, reason: string): Promise<ServiceResponse> {
    try {
      const response = await api.patch(`/admin/listings/${id}/reject`, { reason });
      return response.data;
    } catch (error: any) {
      return this.handleError(error, 'rejectListing');
    }
  }

  // Delete listing as Admin
  static async deleteListingAsAdmin(id: string, reason: string): Promise<ServiceResponse> {
    try {
      const response = await api.delete(`/admin/listings/${id}`, { data: { reason } });
      return response.data;
    } catch (error: any) {
      return this.handleError(error, 'deleteListingAsAdmin');
    }
  }

  // Update listing status (Legacy/General)
  static async updateListingStatus(
    id: string,
    status: string,
    notes?: string
  ): Promise<ServiceResponse> {
    // Redirect to specific actions if applicable
    if (status === 'approved') return this.approveListing(id, 'Approved via status update', notes);
    if (status === 'rejected') return this.rejectListing(id, notes || 'Rejected via status update');

    try {
      const response = await api.patch(endpoints.listings.updateStatus(id), {
        status,
        notes
      });
      return response.data;
    } catch (error: any) {
      return this.handleError(error, 'updateListingStatus');
    }
  }

  // Get listing statistics
  static async getListingStats(): Promise<{ success: boolean; data: any; message?: string }> {
    try {
      const response = await api.get('/listings/stats');
      return response.data;
    } catch (error: any) {
      return { success: false, data: null, message: error.message };
    }
  }
}