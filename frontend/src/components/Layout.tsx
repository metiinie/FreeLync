import { Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './Header';
import Footer from './Footer';
import MobileNav from './MobileNav';

const Layout = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-900 transition-colors duration-300 flex flex-col">
      <Header onMenuClick={() => { }} />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
      <div className="lg:hidden">
        <MobileNav />
      </div>
    </div>
  );
};

export default Layout;
