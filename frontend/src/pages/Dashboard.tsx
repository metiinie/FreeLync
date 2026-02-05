import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-xl border border-border/60 bg-white/70 backdrop-blur-md shadow-soft p-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Dashboard
          </h1>
          <p className="text-gray-600">
            Welcome to your dashboard, {user?.full_name || user?.name}! Here you can manage your listings, 
            transactions, and account settings.
          </p>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <motion.div whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }} className="rounded-xl border border-border/60 bg-white/60 backdrop-blur-md shadow-soft p-4">
              <div className="text-sm text-muted-foreground">Listings</div>
              <div className="mt-1 text-2xl font-semibold text-foreground">Your items</div>
            </motion.div>
            <motion.div whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }} className="rounded-xl border border-border/60 bg-white/60 backdrop-blur-md shadow-soft p-4">
              <div className="text-sm text-muted-foreground">Transactions</div>
              <div className="mt-1 text-2xl font-semibold text-foreground">Recent activity</div>
            </motion.div>
            <motion.div whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }} className="rounded-xl border border-border/60 bg-white/60 backdrop-blur-md shadow-soft p-4">
              <div className="text-sm text-muted-foreground">Profile</div>
              <div className="mt-1 text-2xl font-semibold text-foreground">Manage settings</div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
