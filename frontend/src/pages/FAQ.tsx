import React, { useState } from 'react';
import PageLayout from '../components/PageLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Search, MessageCircle, Shield, ShoppingCart, Home } from 'lucide-react';
import { Input } from '../components/ui/input';

const FAQ = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openIndex, setOpenIndex] = useState<string | null>(null);

  const categories = [
    {
      id: 'general',
      title: 'General',
      icon: Home,
      questions: [
        {
          q: 'What is FreeLync?',
          a: 'FreeLync is a premium digital brokerage platform that enables secure, escrow-protected trading of properties and vehicles. We connect buyers and sellers directly while providing professional verification and financial security.'
        },
        {
          q: 'How does the escrow system work?',
          a: "Once a buyer and seller agree on a price, the buyer transfers funds to FreeLync's secure escrow account. We hold the funds until the transaction is verified and the item is officially transferred. Only then are funds released to the seller."
        },
        {
          q: 'Are there any hidden fees?',
          a: 'No. FreeLync is committed to 100% transparency. Our service fees are clearly stated during the listing process for sellers and at checkout for buyers. There are no surprise brokerage commissions.'
        }
      ]
    },
    {
      id: 'buying',
      title: 'Buying & Renting',
      icon: ShoppingCart,
      questions: [
        {
          q: 'How do I know a listing is real?',
          a: 'Every listing on FreeLync undergoes a rigorous verification process by our admin team before it goes live. We verify property documents, vehicle history, and seller identity to ensure your safety.'
        },
        {
          q: 'Can I inspect the property/vehicle before buying?',
          a: 'Absolutely. We encourage inspections. You can use the "Message" feature to coordinate with the seller for a physical viewing of the item.'
        },
        {
          q: 'What happens if the item is not as described?',
          a: 'If an inspection reveals significant discrepancies not mentioned in the listing, you can raise a dispute before the escrow funds are released. Our support team will mediate the process.'
        }
      ]
    },
    {
      id: 'selling',
      title: 'Selling',
      icon: Shield,
      questions: [
        {
          q: 'How do I list my property or vehicle?',
          a: 'Click on the "Sell" button in your dashboard. You will be guided through a wizard to provide details, upload photos, and submit verification documents. Once our team approves it, your listing will be live.'
        },
        {
          q: 'When do I get paid?',
          a: 'You will receive your funds once the buyer has confirmed the transfer and our system verifies the completion of necessary legal documentation.'
        },
        {
          q: 'How can I make my listing featured?',
          a: 'Featured listings receive higher visibility. You can opt for a featured status during the listing process or upgrade an existing listing from your seller dashboard for a small fee.'
        }
      ]
    }
  ];

  const toggleQuestion = (id: string) => {
    setOpenIndex(openIndex === id ? null : id);
  };

  const filteredCategories = categories.map(cat => ({
    ...cat,
    questions: cat.questions.filter(q =>
      q.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.a.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(cat => cat.questions.length > 0);

  return (
    <PageLayout
      title="Frequently Asked Questions"
      description="Find answers to all your questions about our secure brokerage platform."
      maxWidth="7xl"
    >
      <div className="py-8 space-y-12">
        {/* Search Bar */}
        <div className="max-w-2xl mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search for answers..."
            className="pl-12 py-6 rounded-2xl border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-blue-500 text-lg shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Navigation/Sidebar */}
          <div className="lg:col-span-1 space-y-4 hidden lg:block">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 px-2 uppercase text-xs tracking-widest">Categories</h3>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  const element = document.getElementById(cat.id);
                  element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-white dark:hover:bg-gray-800 hover:shadow-soft transition-all text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
              >
                <cat.icon className="w-5 h-5" />
                <span className="font-medium">{cat.title}</span>
              </button>
            ))}
          </div>

          {/* Question List */}
          <div className="lg:col-span-3 space-y-16">
            {filteredCategories.length > 0 ? (
              filteredCategories.map((category) => (
                <section key={category.id} id={category.id} className="scroll-mt-24">
                  <div className="flex items-center space-x-3 mb-8">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                      <category.icon className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{category.title}</h2>
                  </div>

                  <div className="space-y-4">
                    {category.questions.map((q, idx) => {
                      const qId = `${category.id}-${idx}`;
                      const isOpen = openIndex === qId;
                      return (
                        <div
                          key={qId}
                          className={`border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden transition-all duration-300 ${isOpen ? 'bg-white dark:bg-gray-800 shadow-md border-blue-100 dark:border-blue-900/50' : 'bg-gray-50/50 dark:bg-gray-900/50 hover:bg-white dark:hover:bg-gray-800'}`}
                        >
                          <button
                            onClick={() => toggleQuestion(qId)}
                            className="w-full flex items-center justify-between p-6 text-left"
                          >
                            <span className={`text-lg font-semibold transition-colors ${isOpen ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'}`}>
                              {q.q}
                            </span>
                            {isOpen ? (
                              <Minus className="w-5 h-5 text-blue-600 shrink-0" />
                            ) : (
                              <Plus className="w-5 h-5 text-gray-400 shrink-0" />
                            )}
                          </button>

                          <AnimatePresence>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                              >
                                <div className="px-6 pb-6 text-gray-600 dark:text-gray-400 leading-relaxed border-t border-gray-50 dark:border-gray-700 pt-4">
                                  {q.a}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))
            ) : (
              <div className="text-center py-20">
                <div className="bg-gray-100 dark:bg-gray-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="w-8 h-8 text-gray-400 dark:text-gray-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No matching questions</h3>
                <p className="text-gray-600 dark:text-gray-400">Try searching for different keywords or browse the categories.</p>
              </div>
            )}
          </div>
        </div>

        {/* Support CTA */}
        <div className="bg-brand-gradient rounded-3xl p-12 text-center text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-4">Still have questions?</h2>
            <p className="text-blue-100 mb-8 max-w-2xl mx-auto text-lg">
              Can't find the answer you're looking for? Please chat to our friendly team.
            </p>
            <button
              onClick={() => window.location.href = '/contact'}
              className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold hover:bg-blue-50 transition-colors flex items-center mx-auto"
            >
              <MessageCircle className="w-5 h-5 mr-3" />
              Get in Touch
            </button>
          </div>
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>
      </div>
    </PageLayout>
  );
};

export default FAQ;


