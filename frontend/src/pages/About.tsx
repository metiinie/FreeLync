import React from 'react';
import PageLayout from '../components/PageLayout';
import { motion } from 'framer-motion';
import { Shield, Users, Target, Zap, CheckCircle } from 'lucide-react';

const About = () => {
  const coreValues = [
    {
      title: 'Trust & Security',
      description: 'Our escrow-based payment system ensures that funds are protected until the trade is verified and completed.',
      icon: Shield,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Customer Centric',
      description: 'We put our users first, providing a seamless experience for buyers, renters, and sellers alike.',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Integrity',
      description: 'Transparency is at the heart of FreeLync. Every listing is verified by our admin team before appearing on the platform.',
      icon: Target,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Efficiency',
      description: 'We leverage modern technology to make property and vehicle trading faster and more convenient than ever.',
      icon: Zap,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100'
    }
  ];

  return (
    <PageLayout
      title="About FreeLync"
      description="Learn more about our mission to revolutionize digital brokerage through trust and transparency."
      maxWidth="7xl"
    >
      <div className="space-y-16 py-8">
        {/* Mission & Vision Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h2 className="text-3xl font-bold text-gray-900 border-l-4 border-blue-600 pl-4">
              Our Mission
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              At FreeLync, our mission is to eliminate the uncertainty and risks often associated with high-value digital trades in property and vehicles. We provide a decentralized-feeling but centrally-secured marketplace where trust is built into every transaction through our innovative escrow system.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              We empower individuals to trade without the need for traditional, often expensive middlemen, while maintaining the highest standards of security.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-8 text-white shadow-lg"
          >
            <h2 className="text-2xl font-bold mb-4">Our Vision</h2>
            <p className="text-lg opacity-90 leading-relaxed">
              To be the most trusted global digital brokerage platform, where anyone can buy, sell, or rent properties and vehicles with absolute peace of mind, knowing their investments and information are fully protected by state-of-the-art escrow technology and human verification.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-blue-200" />
                <span>100% Verified</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-blue-200" />
                <span>Secure Escrow</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-blue-200" />
                <span>Expert Support</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-blue-200" />
                <span>Transparent Fees</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Core Values Section */}
        <div>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Core Values</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              The principles that guide our decisions and shape the way we serve our community every day.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {coreValues.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className={`${value.bgColor} ${value.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                  <value.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Why FreeLync Section */}
        <div className="bg-gray-50 rounded-2xl p-8 md:p-12 border border-gray-100">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Why we started FreeLync</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                The digital marketplace for high-stakes items like real estate and luxury vehicles has long been plagued by scams, hidden fees, and unreliable brokers. We saw an opportunity to bring technology and professional oversight together.
              </p>
              <p>
                By creating a platform where payments are held in escrow and transactions are verified by dedicated admins, we've created a "Middleman as a Service" that works for the user, not against them. FreeLync is the bridge between the freedom of digital trading and the security of professional brokerage.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default About;


