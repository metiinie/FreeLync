import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, List, BarChart3, Settings, Eye, Edit, Trash2, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import ListingWizard from '../components/ListingWizard';
import { ListingsService } from '../services/listings';
import { Listing } from '../types';

const Sell: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showWizard, setShowWizard] = useState(false);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    views: 0
  });

  const calculateStats = (userListings: Listing[]) => {
    const total = userListings.length;
    const active = userListings.filter(l => l.status === 'approved').length;
    const pending = userListings.filter(l => l.status === 'pending').length;
    const views = userListings.reduce((sum, l) => sum + (l.views || 0), 0);

    setStats({ total, active, pending, views });
  };

  const loadListings = async () => {
    try {
      setLoading(true);
      const response = await ListingsService.getUserListings(user?.id || '');
      if (response.success) {
        setListings(response.data);
        calculateStats(response.data);
      }
    } catch (error) {
      console.error('Error loading listings:', error);
      toast.error('Failed to load your listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/sell' } });
      return;
    }
    if (!showWizard) {
      loadListings();
    }
  }, [isAuthenticated, navigate, showWizard]);

  const handleListingComplete = async (listingData: any) => {
    try {
      const response = await ListingsService.createListing(listingData);
      if (response.success) {
        toast.success('Listing created successfully! It will be reviewed within 24 hours.');
        setShowWizard(false);
        loadListings();
      } else {
        toast.error(response.message || 'Failed to create listing');
      }
    } catch (error) {
      console.error('Error creating listing:', error);
      toast.error('Failed to create listing. Please try again.');
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    if (!confirm('Are you sure you want to delete this listing? This action cannot be undone.')) return;

    setLoading(true);
    try {
      const response = await ListingsService.deleteListing(listingId);
      if (response.success) {
        toast.success('Listing deleted successfully');
        const updatedListings = listings.filter(listing => listing.id !== listingId);
        setListings(updatedListings);
        calculateStats(updatedListings);

        window.dispatchEvent(new CustomEvent('listingDeleted', {
          detail: { listingId, deletedAt: new Date().toISOString() }
        }));
      } else {
        toast.error(response.message || 'Failed to delete listing');
        await loadListings();
      }
    } catch (error) {
      console.error('Error during delete process:', error);
      toast.error('Failed to delete listing. Please try again.');
      await loadListings();
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  if (showWizard) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 backdrop-blur-md bg-white/70 dark:bg-gray-900/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Listing</h1>
              <Button
                variant="outline"
                onClick={() => setShowWizard(false)}
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
        <ListingWizard
          onComplete={handleListingComplete}
          onCancel={() => setShowWizard(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 backdrop-blur-md bg-white/70 dark:bg-gray-900/70 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Sell Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your property listings</p>
            </div>
            <Button
              onClick={() => setShowWizard(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Listing
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <List className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Listings</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Eye className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Views</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.views}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center dark:text-white">
              <List className="w-5 h-5 mr-2" />
              My Listings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-12">
                <List className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No listings yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Create your first listing to get started</p>
                <Button
                  onClick={() => setShowWizard(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Listing
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {listings.map((listing) => (
                  <motion.div
                    key={listing.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow bg-white/50 dark:bg-gray-900/50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{listing.title}</h3>
                          {getStatusBadge(listing.status)}
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{listing.description}</p>
                        <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                          <span className="font-medium text-green-600 dark:text-green-400">
                            {listing.currency} {listing.price?.toLocaleString()}
                            {listing.type === 'rent' && listing.rent_period && ` / ${listing.rent_period}`}
                          </span>
                          <span className="flex items-center">
                            <Eye className="w-4 h-4 mr-1" />
                            {listing.views || 0} views
                          </span>
                          <span>Created {new Date(listing.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/listing/${listing.id}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {listing.status === 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/sell/edit/${listing.id}`)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteListing(listing.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Sell;
