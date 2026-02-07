import React, { useState } from 'react';
import PageLayout from '../components/PageLayout';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, MessageCircle, Twitter, Facebook, Instagram, Linkedin } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    toast.success('Message sent successfully! We will get back to you soon.');
    setFormData({ name: '', email: '', subject: '', message: '' });
    setIsSubmitting(false);
  };

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email Us',
      content: 'abumahilkerim@gmail.com',
      description: 'Our team will respond as soon as possible.',
      href: 'mailto:abumahilkerim@gmail.com'
    },
    {
      icon: Phone,
      title: 'Call Us',
      content: '+251 9118982161',
      description: 'Mon-Fri from 2am to 6am & 8am to 6pm.',
      href: 'tel:+2519118982161'
    },
    {
      icon: MapPin,
      title: 'Visit Us',
      content: 'Addis Ababa, Ethiopia',
      description: 'Come say hello at our headquarters.',
      href: 'https://maps.google.com'
    }
  ];

  const socialLinks = [
    { icon: Facebook, href: '#', name: 'Facebook' },
    { icon: Twitter, href: 'https://twitter.com/metinie1', name: 'Twitter' },
    { icon: Instagram, href: 'https://www.instagram.com/metinie11/', name: 'Instagram' },
    { icon: Linkedin, href: '#', name: 'Linkedin' }
  ];

  return (
    <PageLayout
      title="Contact Us"
      description="Have questions? We're here to help you navigate your journey with FreeLync."
      maxWidth="7xl"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 py-8">
        {/* Contact Info Column */}
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Get in Touch</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Whether you're a buyer, seller, or just curious about our platform, we'd love to hear from you.
              Our dedicated support team is ready to assist you.
            </p>
          </div>

          <div className="space-y-6">
            {contactInfo.map((item, index) => (
              <motion.a
                key={item.title}
                href={item.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg mr-4 group-hover:bg-blue-600 transition-colors">
                  <item.icon className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                  <p className="text-blue-600 dark:text-blue-400 font-medium">{item.content}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{item.description}</p>
                </div>
              </motion.a>
            ))}
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Follow Us</h3>
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                  aria-label={social.name}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Contact Form Column */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xl"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Send us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                  <Input
                    required
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-gray-800 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                  <Input
                    required
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-gray-800 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Subject</label>
                <Input
                  required
                  placeholder="How can we help you?"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-gray-800 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Message</label>
                <textarea
                  required
                  rows={6}
                  placeholder="Tell us more about your inquiry..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-none"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-6 rounded-xl btn-gradient flex items-center justify-center space-x-2 text-lg font-bold"
              >
                {isSubmitting ? (
                  <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Send Message</span>
                  </>
                )}
              </Button>
            </form>
          </motion.div>
        </div>
      </div>

      {/* FAQ CTA */}
      <div className="mt-16 bg-blue-50 dark:bg-gray-800 rounded-2xl p-8 text-center border border-blue-100 dark:border-gray-700">
        <div className="flex items-center justify-center mb-4">
          <MessageCircle className="w-10 h-10 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Check our Help Center</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          You might find the answer you're looking for in our Frequently Asked Questions section.
        </p>
        <Button variant="outline" className="rounded-xl border-blue-200 dark:border-gray-700 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-gray-700" onClick={() => window.location.href = '/faq'}>
          Go to FAQs
        </Button>
      </div>
    </PageLayout>
  );
};

export default Contact;

