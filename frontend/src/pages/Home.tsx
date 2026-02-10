import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home as HomeIcon,
  Car,
  Building,
  ShoppingCart,
  Heart,
  Shield,
  CheckCircle,
  TrendingUp,
  Users,
  Award,
  ArrowRight,
  Search,
  MapPin,
  Calendar,
  Eye
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { ListingsService } from '../services/listings';
import { api, endpoints, getMediaUrl } from '../services/api';
import { Listing, User as UserType } from '../types';
import { formatPrice, formatRelativeTime, getCategoryIcon } from '../lib/utils';
import logoImage from '../components/Images/Logo.png';
import { useAuth } from '../contexts/AuthContext';

const Home: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [featuredListings, setFeaturedListings] = useState<Listing[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalListings: 0,
    totalTransactions: 0,
    totalValue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeaturedListings();
    loadStats();

    const handleListingUpdate = () => {
      loadFeaturedListings();
      loadStats();
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'listing_last_update') {
        handleListingUpdate();
      }
    };

    window.addEventListener('listingCreated', handleListingUpdate);
    window.addEventListener('listingDeleted', handleListingUpdate);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('listingCreated', handleListingUpdate);
      window.removeEventListener('listingDeleted', handleListingUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const loadFeaturedListings = async () => {
    try {
      const result = await ListingsService.getFeaturedListings(6);
      if (result.success) {
        setFeaturedListings(result.data);
      }
    } catch (error) {
      console.error('Failed to load featured listings:', error);
    }
  };

  const loadStats = async () => {
    try {
      // Mock stats for now or implement /stats endpoint on backend
      // Using generic counts for MVP until stats endpoint available
      // Or separate calls
      const [usersRes, listingsRes, transactionsRes] = await Promise.all([
        api.get(endpoints.users.list, { params: { limit: 1 } }).catch(() => ({ data: { total: 120 } })),
        api.get(endpoints.listings.list, { params: { limit: 1 } }).catch(() => ({ data: { total: 45 } })),
        api.get(endpoints.transactions.list, { params: { status: 'completed', limit: 1 } }).catch(() => ({ data: { total: 15 } })),
      ]);

      setStats({
        totalUsers: (usersRes.data as any).total || 120,
        totalListings: (listingsRes.data as any).total || 45,
        totalTransactions: (transactionsRes.data as any).total || 15,
        totalValue: 15400000, // Mock value as calculating sum requires aggregation on backend
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
      },
    },
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-900 transition-colors duration-300">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="mb-8">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="inline-flex items-center justify-center mb-6"
              >
                <img
                  src={logoImage}
                  alt="FreeLync"
                  className="w-32 h-32 object-contain"
                />
              </motion.div>

              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                Where Trust Meets Trade
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
                FreeLync is your secure digital brokerage platform. Buy, rent, or sell
                properties and vehicles with confidence through our escrow-based system
                managed by verified admins.
              </p>
            </div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
            >
              <Button asChild size="xl" variant="default" className="group">
                <Link to="/buy">
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  BUY
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>

              <Button asChild size="xl" variant="default" className="group">
                <Link to="/rent">
                  <HomeIcon className="mr-2 h-5 w-5" />
                  RENT
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>

              <Button asChild size="xl" variant="default" className="group">
                <Link to="/sell">
                  <Building className="mr-2 h-5 w-5" />
                  SELL
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </motion.div>

            {/* Removed Quick Search as it's moving to the header */}
          </motion.div>
        </div>

        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-20 h-20 bg-[#F5B700]/20 rounded-full animate-pulse" />
          <div className="absolute top-40 right-20 w-16 h-16 bg-[#0B132B]/20 rounded-full animate-pulse delay-1000" />
          <div className="absolute bottom-20 left-20 w-24 h-24 bg-blue-200/20 rounded-full animate-pulse delay-2000" />
        </div>
      </div>

      {/* Stats Section Removed */}


      {/* Featured Listings */}
      <div className="py-20 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Featured Listings
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
              Discover the most popular and verified listings on our platform
            </p>
            <Button asChild size="lg">
              <Link to="/buy">
                <Search className="mr-2 h-4 w-4" />
                Browse All Listings
              </Link>
            </Button>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {featuredListings.map((listing) => (
              <motion.div key={listing.id} variants={itemVariants}>
                <Card className="group hover:shadow-glow transition-transform duration-300 overflow-hidden hover:-translate-y-1">
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
                          <CheckCircle className="h-3 w-3" />
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
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatRelativeTime(listing.created_at)}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Button asChild className="flex-1">
                        <Link to={`/listing/${listing.id}`}>
                          View Details
                        </Link>
                      </Button>
                      <Button variant="outline" size="icon">
                        <Heart className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mt-12"
          >
            <Button asChild size="lg" variant="outline">
              <Link to="/buy">
                View All Listings
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white dark:bg-gray-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose FreeLync?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Experience the future of secure digital trading with our innovative platform
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            <motion.div variants={itemVariants}>
              <Card className="text-center p-6 hover:shadow-lg transition-shadow duration-300 h-full">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Secure Escrow</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Your funds are held securely until the transaction is completed and verified by our admin team.
                </p>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="text-center p-6 hover:shadow-lg transition-shadow duration-300 h-full">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Verified Users</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  All users and listings go through our verification process to ensure authenticity and quality.
                </p>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="text-center p-6 hover:shadow-lg transition-shadow duration-300 h-full">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Car className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Multiple Categories</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Buy, rent, or sell cars, houses, land, and commercial properties all in one platform.
                </p>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-brand-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Start Trading?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of verified users who trust FreeLync for their buying, renting, and selling needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" variant="glass" className="text-foreground">
                <Link to={isAuthenticated ? "/buy" : "/register"}>
                  Get Started Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="default">
                <Link to="/about">
                  Learn More
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Home;
