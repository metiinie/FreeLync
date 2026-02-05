import React from 'react';
import PageLayout from '../components/PageLayout';
import { Shield, Lock, Eye, FileText, Bell, Globe } from 'lucide-react';

const Privacy = () => {
  const sections = [
    {
      icon: Shield,
      title: 'Information We Collect',
      content: [
        'Personal identification information (Name, email address, phone number, etc.)',
        'Verification documents for sellers (IDs, property deeds, vehicle titles)',
        'Payment information processed through our secure partners',
        'Device and usage data when you browse our platform'
      ]
    },
    {
      icon: Lock,
      title: 'How We Protect Your Data',
      content: [
        'Industry-standard encryption for all data in transit (SSL/TLS)',
        'Regular security audits and vulnerability assessments',
        'Strict access controls for our administration team',
        'Secure escrow storage for financial transactions'
      ]
    },
    {
      icon: Eye,
      title: 'How We Use Your Information',
      content: [
        'To verify the authenticity of listings and users',
        'To process and secure your financial transactions',
        'To improve our platform and user experience',
        'To communicate important updates and security alerts'
      ]
    }
  ];

  return (
    <PageLayout
      title="Privacy Policy"
      description="Your privacy is our priority. Learn how we handle your data with care."
      maxWidth="4xl"
    >
      <div className="space-y-12 py-8">
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 text-blue-800 flex items-start space-x-4">
          <Bell className="w-6 h-6 shrink-0 mt-1" />
          <p className="text-sm leading-relaxed">
            <strong>Last Updated: February 5, 2026.</strong> We regularly review and update our privacy policy to stay compliant with global data protection standards and to better protect our community.
          </p>
        </div>

        {sections.map((section, index) => (
          <section key={index} className="space-y-4">
            <div className="flex items-center space-x-3 text-gray-900 border-b border-gray-100 pb-2">
              <section.icon className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold">{section.title}</h2>
            </div>
            <ul className="space-y-3">
              {section.content.map((item, i) => (
                <li key={i} className="flex items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 mr-3 shrink-0" />
                  <span className="text-gray-600 leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <div className="prose prose-blue max-w-none text-gray-600 space-y-6">
          <section className="space-y-4">
            <div className="flex items-center space-x-3 text-gray-900 border-b border-gray-100 pb-2">
              <Globe className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold">Third-Party Disclosure</h2>
            </div>
            <p className="leading-relaxed">
              We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties except for verified payment gateways (like Telebirr) and essential service providers who assist us in operating our platform, so long as those parties agree to keep this information confidential.
            </p>
          </section>

          <section className="space-y-4">
            <div className="flex items-center space-x-3 text-gray-900 border-b border-gray-100 pb-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold">Your Rights</h2>
            </div>
            <p className="leading-relaxed">
              You have the right to access, correct, or delete your personal data at any time through your profile settings. For complete account deletion or data portability requests, please contact our support team at <a href="mailto:abumahilkerim@gmail.com" className="text-blue-600 hover:underline">abumahilkerim@gmail.com</a>.
            </p>
          </section>
        </div>

        <div className="pt-8 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-400">
            By using FreeLync, you consent to our Privacy Policy and agree to its terms.
          </p>
        </div>
      </div>
    </PageLayout>
  );
};

export default Privacy;

