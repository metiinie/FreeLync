import React, { useState, useEffect, useCallback } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Shield,
  BarChart3,
  Settings,
  Bell,
  RefreshCw
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ListingsService } from '../services/listings';
import { TransactionsService } from '../services/transactions';
import { UsersService } from '../services/users';
import { Listing, User } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import AdminStatsSimple from '../components/AdminStatsSimple';
import UserManagement from '../components/UserManagement';
import ListingStatusManagement from '../components/ListingStatusManagement';
import VerifyListings from '../components/VerifyListings';
import AdminDebug from '../components/AdminDebug';
import EscrowManagement from '../components/EscrowManagement';
import CommissionTracking from '../components/CommissionTracking';
import ErrorBoundary from '../components/ErrorBoundary';

// Admin-specific interfaces - matches AdminStatsSimple interface
interface AdminStats {
  users?: {
    total: number;
    verified: number;
    active: number;
  };
  listings?: {
    total: number;
    averagePrice: number;
  };
  transactions?: {
    total: number;
    totalVolume: number;
    totalCommissions: number;
  };
}

const AdminPanelContents: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'dashboard');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats>({});
  const [users, setUsers] = useState<User[]>([]);
  const [pendingListings, setPendingListings] = useState<Listing[]>([]);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'verify-listings', label: 'Verify Listings', icon: ShoppingBag },
    { id: 'listing-status', label: 'Listing Status', icon: Shield },
    { id: 'manage-users', label: 'Manage Users', icon: Users },
    { id: 'debug', label: 'Debug', icon: AlertTriangle },
    { id: 'manage-escrow', label: 'Manage Escrow', icon: Shield },
    { id: 'commission-tracking', label: 'Commission Tracking', icon: DollarSign },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const loadDashboardData = async () => {
    try {
      const [listingsStats, transactionsStats, usersStats] = await Promise.all([
        ListingsService.getListingStats().catch(() => ({ success: true, data: null })),
        TransactionsService.getTransactionStats().catch(() => ({ success: true, data: null })),
        UsersService.getUserStats().catch(() => ({ success: true, data: null })),
      ]);

      setStats({
        listings: listingsStats.success && listingsStats.data ? listingsStats.data as AdminStats['listings'] : undefined,
        transactions: transactionsStats.success && transactionsStats.data ? transactionsStats.data as AdminStats['transactions'] : undefined,
        users: usersStats.success && usersStats.data ? usersStats.data as AdminStats['users'] : undefined,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setStats({
        listings: undefined,
        transactions: undefined,
        users: undefined,
      });
    }
  };

  const loadPendingListings = async () => {
    try {
      // Get all listings for admin (including pending)
      const response = await ListingsService.getAllListingsForAdmin({}, { page: 1, limit: 100 });
      if (response.success) {
        setPendingListings(response.data);
      } else {
        setPendingListings([]);
      }
    } catch (error) {
      console.error('Error loading listings:', error);
      setPendingListings([]);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await UsersService.getAllUsers({ page: 1, limit: 50 });
      if (response.success) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
    }
  };

  const loadData = useCallback(async () => {
    if (!user || user.role !== 'admin') return;

    try {
      setLoading(true);
      await Promise.all([
        loadDashboardData(),
        loadPendingListings(),
        loadUsers()
      ]);
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadData();
    }
  }, [activeTab, user, loadData]);

  useEffect(() => {
    const handleListingDeleted = () => {
      loadPendingListings();
    };

    window.addEventListener('listingDeleted', handleListingDeleted as EventListener);
    return () => {
      window.removeEventListener('listingDeleted', handleListingDeleted as EventListener);
    };
  }, []);

  const handleVerifyUser = async (userId: string) => {
    try {
      const response = await UsersService.verifyUser(userId);
      if (response.success) {
        toast.success('User verified successfully');
        await loadUsers();
      }
    } catch (error) {
      toast.error('Failed to verify user');
    }
  };

  const handleSuspendUser = async (userId: string) => {
    try {
      const response = await UsersService.suspendUser(userId);
      if (response.success) {
        toast.success('User suspended successfully');
        await loadUsers();
      }
    } catch (error) {
      toast.error('Failed to suspend user');
    }
  };

  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    try {
      const response = await UsersService.updateUser(userId, updates);
      if (response.success) {
        toast.success('User updated successfully');
        await loadUsers();
      }
    } catch (error) {
      toast.error('Failed to update user');
    }
  };

  const handleApproveListing = async (listingId: string) => {
    try {
      const response = await ListingsService.updateListingStatus(listingId, 'approved', 'Approved by administrator');
      if (response.success) {
        toast.success('Listing approved successfully');
        await loadPendingListings();
      }
    } catch (error) {
      toast.error('Failed to approve listing');
    }
  };

  const handleRejectListing = async (listingId: string) => {
    try {
      const response = await ListingsService.updateListingStatus(listingId, 'rejected', 'Rejected by administrator');
      if (response.success) {
        toast.success('Listing rejected successfully');
        await loadPendingListings();
      }
    } catch (error) {
      toast.error('Failed to reject listing');
    }
  };

  const handleActivateListing = async (listingId: string) => {
    try {
      const response = await ListingsService.updateListing(listingId, { is_active: true });
      if (response.success) {
        toast.success('Listing activated successfully');
        await loadPendingListings();
      }
    } catch (error) {
      toast.error('Failed to activate listing');
    }
  };

  const handleDeactivateListing = async (listingId: string) => {
    try {
      const response = await ListingsService.updateListing(listingId, { is_active: false });
      if (response.success) {
        toast.success('Listing deactivated successfully');
        await loadPendingListings();
      }
    } catch (error) {
      toast.error('Failed to deactivate listing');
    }
  };

  const handleUpdateListing = async (listingId: string, updates: Partial<Listing>) => {
    try {
      const response = await ListingsService.updateListing(listingId, updates);
      if (response.success) {
        toast.success('Listing updated successfully');
        await loadPendingListings();
      }
    } catch (error) {
      toast.error('Failed to update listing');
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    if (!confirm('Are you sure you want to delete this listing? This action cannot be undone.')) return;
    try {
      const response = await ListingsService.deleteListing(listingId);
      if (response.success) {
        toast.success('Listing deleted successfully');
        setPendingListings(prev => prev.filter(l => l.id !== listingId));
      }
    } catch (error) {
      toast.error('Failed to delete listing');
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    await loadData();
    toast.success('Data refreshed');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'sold': return 'bg-blue-100 text-blue-800';
      case 'rented': return 'bg-purple-100 text-purple-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatusText = (status: string) => status.charAt(0).toUpperCase() + status.slice(1);

  const renderDashboard = () => (
    <div className="space-y-6">
      <AdminStatsSimple stats={stats} loading={loading} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShoppingBag className="h-5 w-5 mr-2" />
              Recent Listings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingListings.length > 0 ? (
                pendingListings.slice(0, 5).map((listing) => (
                  <div key={listing.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <img
                        src={listing.images?.[0]?.url || '/placeholder-image.jpg'}
                        alt={listing.title}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                      <div>
                        <p className="font-medium text-sm">{listing.title}</p>
                        <p className="text-xs text-gray-600">{listing.location?.city || 'Unknown'}</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(listing.status)}>
                      {formatStatusText(listing.status)}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No pending listings</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Recent Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.length > 0 ? (
                users.slice(0, 5).map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-gray-500" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{u.full_name}</p>
                        <p className="text-xs text-gray-600">{u.email}</p>
                      </div>
                    </div>
                    <Badge className={u.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                      {u.verified ? 'Verified' : 'Pending'}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No users found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'verify-listings': return (
        <VerifyListings
          listings={pendingListings.filter(l => l.status === 'pending')}
          loading={loading}
          onApproveListing={handleApproveListing}
          onRejectListing={handleRejectListing}
          onDeleteListing={handleDeleteListing}
          onRefresh={handleRefresh}
        />
      );
      case 'listing-status': return (
        <ListingStatusManagement
          listings={pendingListings}
          loading={loading}
          onApproveListing={handleApproveListing}
          onRejectListing={handleRejectListing}
          onActivateListing={handleActivateListing}
          onDeactivateListing={handleDeactivateListing}
          onRefresh={handleRefresh}
          onUpdateListing={handleUpdateListing}
        />
      );
      case 'manage-users': return (
        <UserManagement
          users={users}
          loading={loading}
          onVerifyUser={handleVerifyUser}
          onSuspendUser={handleSuspendUser}
          onRefresh={handleRefresh}
          onUpdateUser={handleUpdateUser}
        />
      );
      case 'debug': return <AdminDebug listings={pendingListings} users={users} stats={stats} loading={loading} />;
      case 'manage-escrow': return <EscrowManagement loading={loading} />;
      case 'commission-tracking': return <CommissionTracking loading={loading} />;
      default: return (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {tabs.find(t => t.id === activeTab)?.label}
          </h3>
          <p className="text-gray-600">This section is under development.</p>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
              <p className="text-gray-600">Manage your FreeLync platform</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={handleRefresh} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                      ? 'border-[#0B132B] text-[#0B132B]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderTabContent()}
        </motion.div>
      </div>
    </div>
  );
};

const AdminPanel = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <ErrorBoundary>
      <AdminPanelContents />
    </ErrorBoundary>
  );
};

export default AdminPanel;
