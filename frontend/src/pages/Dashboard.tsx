import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  ShoppingBag,
  Key,
  Tag,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Heart,
  Search,
  ArrowUpRight,
  Filter,
  Shield,
  PlusCircle
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { api, endpoints } from '../services/api';
import { formatPrice } from '../lib/utils';

const Dashboard = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const view = searchParams.get('view') || 'overview';

  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<any[]>([]);
  const [stats, setStats] = useState({
    activeEscrows: 0,
    completedDeals: 0,
    totalSpent: 0,
    savedItems: 0
  });

  useEffect(() => {
    if (view === 'sell') {
      navigate('/sell');
      return;
    }
    loadDashboardData();
  }, [view]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // In a real app, we would fetch specialized data based on the view
      // For now, let's simulate some data
      await new Promise(resolve => setTimeout(resolve, 800));

      setStats({
        activeEscrows: view === 'buy' ? 2 : (view === 'rent' ? 1 : 3),
        completedDeals: view === 'buy' ? 5 : (view === 'rent' ? 3 : 8),
        totalSpent: view === 'buy' ? 4500000 : (view === 'rent' ? 25000 : 4525000),
        savedItems: view === 'buy' ? 12 : (view === 'rent' ? 8 : 20)
      });

      setActivities([
        { id: 1, title: '2022 Toyota Corolla', type: 'buy', status: 'escrow', date: '2026-02-05', price: 1200000 },
        { id: 2, title: 'Modern Apartment in Bole', type: 'rent', status: 'completed', date: '2026-01-28', price: 15000 },
        { id: 3, title: 'Prime Land in Summit', type: 'buy', status: 'pending', date: '2026-02-01', price: 3500000 },
      ].filter(a => view === 'overview' || a.type === view));

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'escrow': return <Clock className="w-4 h-4 text-amber-500" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending': return <AlertCircle className="w-4 h-4 text-blue-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Escrows', value: stats.activeEscrows, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: 'Completed Deals', value: stats.completedDeals, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
          { label: 'Total Value', value: formatPrice(stats.totalSpent), icon: ShoppingBag, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Saved Items', value: stats.savedItems, icon: Heart, color: 'text-red-500', bg: 'bg-red-500/10' },
        ].map((stat, idx) => (
          <motion.div key={idx} variants={itemVariants}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bg}`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Track your latest moves in the market</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-primary">View All</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 rounded-xl border border-border/60 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-lg ${activity.type === 'buy' ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'}`}>
                        {activity.type === 'buy' ? <ShoppingBag className="w-5 h-5" /> : <Key className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-medium">{activity.title}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-muted-foreground">{new Date(activity.date).toLocaleDateString()}</span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs font-semibold">{formatPrice(activity.price)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge variant="outline" className="flex items-center gap-1">
                        {getStatusIcon(activity.status)}
                        {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                      </Badge>
                      <button className="p-1 hover:bg-muted rounded-md transition-colors">
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                ))}
                {activities.length === 0 && (
                  <div className="text-center py-8">
                    <Search className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-20" />
                    <p className="text-muted-foreground">No recent activity found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Tips */}
        <div className="space-y-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-between" onClick={() => navigate('/buy')}>
                Find Properties <ArrowUpRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" className="w-full justify-between" onClick={() => navigate('/sell')}>
                Create Listing <PlusCircle className="w-4 h-4" />
              </Button>
              <Button variant="outline" className="w-full justify-between" onClick={() => navigate('/profile?tab=settings')}>
                Secure Account <Shield className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Trading Safety</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Always use our <span className="text-primary font-medium">Escrow System</span> for large transactions. Never share your password or sensitive financial details off-platform.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-900 transition-colors duration-300 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
              {view === 'overview' ? 'Dashboard' : `${view.charAt(0).toUpperCase() + view.slice(1)} Dashboard`}
              {view !== 'overview' && <Badge variant="secondary" className="text-sm font-medium">{view}</Badge>}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
              Welcome back, <span className="text-primary font-semibold">{user?.full_name || 'User'}</span>! Here's what's happening.
            </p>
          </motion.div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="lg" className="rounded-xl" onClick={() => navigate('/buy')}>
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button size="lg" className="rounded-xl shadow-lg shadow-primary/20" onClick={() => navigate('/buy')}>
              Browse Market
            </Button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-20"
            >
              <div className="relative">
                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-primary/10 border-b-primary rounded-full animate-spin-slow"></div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={view}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
            >
              {renderOverview()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Dashboard;

