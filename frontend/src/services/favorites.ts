import { api, endpoints } from './api';
import { Favorite } from '../types';

export class FavoritesService {
  // Add listing to favorites
  static async addToFavorites(userId: string, listingId: string): Promise<{ success: boolean; message?: string }> {
    try {
      await api.post(endpoints.favorites.toggle(listingId));
      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to add to favorites' };
    }
  }

  // Remove listing from favorites
  static async removeFromFavorites(userId: string, listingId: string): Promise<{ success: boolean; message?: string }> {
    try {
      await api.delete(endpoints.favorites.toggle(listingId));
      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to remove from favorites' };
    }
  }

  // Check if listing is favorited by user
  static async isFavorited(userId: string, listingId: string): Promise<{ success: boolean; isFavorited: boolean; message?: string }> {
    try {
      // Optimized check can be done in backend (e.g. GET /favorites handles checking if listingId matches)
      // Or we fetch all favorites and check match on client if list is small, or backend has specific check endpoint
      // Assuming GET /favorites returns list of favorites 
      const response = await api.get(endpoints.favorites.list);
      const isFavorited = (response.data || []).some((fav: any) => (fav.listing_id || fav.listingId) === listingId);

      return { success: true, isFavorited };
    } catch (error: any) {
      return { success: false, isFavorited: false, message: error.message };
    }
  }

  // Get user's favorites
  static async getUserFavorites(
    userId: string,
    pagination: { page: number; limit: number } = { page: 1, limit: 12 }
  ): Promise<{ success: boolean; data: Favorite[]; total: number; message?: string }> {
    try {
      const response = await api.get(endpoints.favorites.list, { params: pagination });
      return { success: true, data: response.data || [], total: (response.data || []).length };
    } catch (error: any) {
      return { success: false, data: [], total: 0, message: error.message };
    }
  }

  // Toggle favorite status
  static async toggleFavorite(userId: string, listingId: string): Promise<{ success: boolean; isFavorited: boolean; message?: string }> {
    // Rely on the helper which calls add/remove
    const check = await this.isFavorited(userId, listingId);
    if (check.isFavorited) {
      const res = await this.removeFromFavorites(userId, listingId);
      return { success: res.success, isFavorited: false, message: res.message };
    } else {
      const res = await this.addToFavorites(userId, listingId);
      return { success: res.success, isFavorited: true, message: res.message };
    }
  }
}
