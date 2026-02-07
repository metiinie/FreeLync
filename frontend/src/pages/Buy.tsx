import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Star, Heart, Eye, Loader2, AlertCircle } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ListingsService } from '@/services/listings';
import { FavoritesService } from '@/services/favorites';
import { Listing, SearchFilters } from '@/types';
import { formatPrice, formatRelativeTime, getCategoryIcon } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { getMediaUrl } from '@/services/api';

const Buy: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get('search') || '';

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<SearchFilters>({
    category: undefined,
    type: 'sale',
    minPrice: undefined,
    maxPrice: undefined,
    city: undefined,
    verified: undefined,
    sortBy: 'date_desc',
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 12 });
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [userFavorites, setUserFavorites] = useState<string[]>([]);
  const { user } = useAuth();

  const categories = [
    { id: 'all', name: 'All Categories', icon: '🏠' },
    { id: 'house', name: 'Houses', icon: '🏠' },
    { id: 'car', name: 'Cars', icon: '🚗' },
    { id: 'land', name: 'Land', icon: '🏞️' },
    { id: 'commercial', name: 'Commercial', icon: '🏢' },
    { id: 'other', name: 'Other', icon: '📦' },
  ];

  const loadListings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const searchFilters: SearchFilters = { type: 'sale' };

      if (searchTerm.trim()) {
        searchFilters.search = searchTerm.trim();
      }

      // Only apply category filter if user has selected something other than 'all'
      if (filters.category && filters.category !== 'all') {
        searchFilters.category = filters.category;
      }

      // Only apply price filters if user has entered values
      if (filters.minPrice) {
        searchFilters.minPrice = filters.minPrice;
      }
      if (filters.maxPrice) {
        searchFilters.maxPrice = filters.maxPrice;
      }

      // Only apply city filter if user has entered a city
      if (filters.city) {
        searchFilters.city = filters.city;
      }

      // Only apply verified filter if user has selected it
      if (filters.verified !== undefined) {
        searchFilters.verified = filters.verified;
      }

      // Only apply sort if user has selected something other than default
      if (filters.sortBy && filters.sortBy !== 'date_desc') {
        searchFilters.sortBy = filters.sortBy;
      }

      const response = await ListingsService.getListings(searchFilters, pagination);

      if (response.success) {
        if (pagination.page === 1) {
          setListings(response.data);
        } else {
          setListings(prev => [...prev, ...response.data]);
        }
        setTotalCount(response.total);
      } else {
        setError(response.message || 'Failed to load listings');
      }
    } catch (err) {
      setError('An error occurred while loading listings');
      console.error('Error loading listings:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filters, pagination]);

  const loadFavorites = useCallback(async () => {
    if (!user) return;
    try {
      const response = await FavoritesService.getUserFavorites(user.id);
      if (response.success) {
        setUserFavorites(response.data.map(fav => fav.listing_id || (fav as any).listingId));
      }
    } catch (err) {
      console.error('Error loading favorites:', err);
    }
  }, [user]);

  useEffect(() => {
    loadListings();
    loadFavorites();
  }, [loadListings, loadFavorites]);

  // Listen for listing deletion events from other dashboards
  useEffect(() => {
    const handleListingDeleted = (event: CustomEvent) => {
      console.log('Buy dashboard received listing deletion event:', event.detail);
      // Refresh listings to remove the deleted item
      loadListings();
    };

    window.addEventListener('listingDeleted', handleListingDeleted as EventListener);

    return () => {
      window.removeEventListener('listingDeleted', handleListingDeleted as EventListener);
    };
  }, [loadListings]);



  const handleCategoryChange = (category: string) => {
    setFilters({
      ...filters,
      category: category === 'all' ? undefined : category,
    });
    setPagination({ ...pagination, page: 1 });
  };

  const loadMore = () => {
    setPagination({ ...pagination, page: pagination.page + 1 });
  };

  const toggleFavorite = async (listingId: string) => {
    if (!user) {
      toast.error('Please login to add favorites');
      return;
    }

    try {
      console.log('Toggling favorite:', listingId);
      const isFav = userFavorites.includes(listingId);

      if (isFav) {
        const res = await FavoritesService.removeFromFavorites(user.id, listingId);
        if (res.success) {
          setUserFavorites(prev => prev.filter(id => id !== listingId));
          toast.success('Removed from favorites');
        } else {
          console.error('Remove favorite failed:', res);
          toast.error(res.message || 'Failed to remove from favorites');
        }
      } else {
        const res = await FavoritesService.addToFavorites(user.id, listingId);
        if (res.success) {
          setUserFavorites(prev => [...prev, listingId]);
          toast.success('Added to favorites');
        } else {
          console.error('Add favorite failed:', res);
          toast.error(res.message || 'Failed to add to favorites');
        }
      }
    } catch (err) {
      console.error('Toggle favorite error:', err);
      toast.error('Failed to update favorites');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Tabs */}
        <div className="flex space-x-1 mb-8 bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm overflow-x-auto border dark:border-gray-700">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.id)}
              className={`flex-shrink-0 flex items-center justify-center px-4 py-3 rounded-md text-sm font-medium transition-colors ${(filters.category === category.id) || (category.id === 'all' && !filters.category)
                ? 'bg-[#0B132B] dark:bg-blue-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
            >
              <span className="mr-2">{category.icon}</span>
              {category.name}
            </button>
          ))}
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading && listings.length === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 animate-pulse border dark:border-gray-700">
                <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        )}

        {/* Listings Grid */}
        {!loading && listings.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {listings.map((listing, index) => (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="group hover:shadow-xl transition-all duration-300 overflow-hidden dark:bg-gray-800 dark:border-gray-700">
                  <div className="relative">
                    <img
                      src={getMediaUrl(listing.images[0]?.url)}
                      alt={listing.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 left-4">
                      <Badge variant="gold" className="flex items-center gap-1">
                        {getCategoryIcon(listing.category)}
                        {listing.category}
                      </Badge>
                    </div>
                    <div className="absolute top-4 right-4">
                      <Badge variant={listing.type === 'sale' ? 'default' : 'secondary'}>
                        {listing.type}
                      </Badge>
                    </div>
                    {listing.verified && (
                      <div className="absolute bottom-4 right-4">
                        <Badge variant="success" className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          Verified
                        </Badge>
                      </div>
                    )}
                  </div>

                  <CardHeader>
                    <CardTitle className="line-clamp-2">{listing.title}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {listing.location.city}, {listing.location.subcity}
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-2xl font-bold text-[#0B132B] dark:text-white">
                        {formatPrice(listing.price, listing.currency)}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                        <Eye className="h-4 w-4" />
                        {listing.views}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                      <span>{formatRelativeTime(listing.created_at)}</span>
                    </div>

                    <div className="flex gap-2">
                      <Button asChild className="flex-1">
                        <Link to={`/listing/${listing.id}`}>
                          View Details
                        </Link>
                      </Button>
                      <Button
                        variant={userFavorites.includes(listing.id) ? "default" : "outline"}
                        size="icon"
                        onClick={() => toggleFavorite(listing.id)}
                        className={userFavorites.includes(listing.id) ? "bg-red-500 hover:bg-red-600 text-white" : "text-gray-500"}
                      >
                        <Heart className={`h-4 w-4 ${userFavorites.includes(listing.id) ? "fill-current" : ""}`} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && listings.length === 0 && !error && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm || Object.entries(filters).some(([key, value]) => key !== 'type' && value !== undefined && value !== 'all' && value !== '')
                ? 'No properties found'
                : 'No properties available for sale yet'
              }
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchTerm || Object.entries(filters).some(([key, value]) => key !== 'type' && value !== undefined && value !== 'all' && value !== '')
                ? 'Try adjusting your search criteria or browse all categories.'
                : 'Be the first to list your property for sale! Create a listing to get started.'
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {(searchTerm || Object.values(filters).some(filter => filter !== undefined && filter !== 'all' && filter !== '')) && (
                <Button variant="outline" onClick={() => {
                  setFilters({
                    category: undefined,
                    type: 'sale',
                    minPrice: undefined,
                    maxPrice: undefined,
                    city: undefined,
                    verified: undefined,
                    sortBy: 'date_desc',
                  });
                  setSearchParams({});
                  setPagination({ page: 1, limit: 12 });
                }}>
                  Clear Filters
                </Button>
              )}
              {user && (
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => window.location.href = '/sell'}
                >
                  Create Sale Listing
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Load More */}
        {!loading && listings.length > 0 && listings.length < totalCount && (
          <div className="text-center mt-8">
            <Button
              variant="outline"
              onClick={loadMore}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                'Load More Properties'
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Buy;