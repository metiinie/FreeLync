import React from 'react';
import PageLayout from '../components/PageLayout';
import { Gavel, AlertCircle, RefreshCcw, UserCheck, CreditCard, Ban } from 'lucide-react';

const Terms = () => {
  const sections = [
    {
      icon: UserCheck,
      title: '1. Platform Use & Account',
      content: 'By using FreeLync, you certify that you are at least 18 years of age. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.'
    },
    {
      icon: Gavel,
      title: '2. Listing & Verification',
      content: 'All sellers must provide accurate, up-to-date, and truthful information regarding their listings. FreeLync reserves the right to verify, approve, or reject any listing at its sole discretion if it violates our quality standards or legal requirements.'
    },
    {
      icon: CreditCard,
      title: '3. Escrow Services',
      content: 'FreeLync acts as a secure intermediary for financial transactions. Funds are held in a secure escrow account and are only released upon successful completion of the agreed-upon conditions and verification of asset transfer.'
    },
    {
      icon: RefreshCcw,
      title: '4. Fees & Payments',
      content: 'Service fees are charged for the use of FreeLync’s escrow and verification services. These fees are non-refundable once a transaction has reached the escrow stage, as they cover the operational costs of security and verification.'
    },
    {
      icon: AlertCircle,
      title: '5. Limitation of Liability',
      content: 'While FreeLync provides verification services, users are encouraged to perform their own due diligence. FreeLync is not liable for indirect, incidental, or consequential damages resulting from the use of our platform.'
    },
    {
      icon: Ban,
      title: '6. Prohibited Activities',
      content: 'Users are prohibited from engaging in fraudulent activities, circumventing our payment systems, posting misleading content, or using the platform for any illegal purposes according to the laws of Ethiopia.'
    }
  ];

  return (
    <PageLayout
      title="Terms of Service"
      description="Please read these terms carefully before using the FreeLync platform."
      maxWidth="4xl"
    >
      <div className="space-y-12 py-8">
        <div className="prose prose-blue max-w-none text-gray-600">
          <p className="text-lg leading-relaxed mb-8">
            Welcome to FreeLync. These Terms of Service ("Terms") govern your access to and use of our website, services, and applications. By accessing FreeLync, you agree to be bound by these Terms.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {sections.map((section, index) => (
              <div key={index} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                <div className="flex items-center space-x-3 text-blue-600">
                  <section.icon className="w-5 h-5 flex-shrink-0" />
                  <h3 className="font-bold text-gray-900">{section.title}</h3>
                </div>
                <p className="text-sm leading-relaxed text-gray-600">
                  {section.content}
                </p>
              </div>
            ))}
          </div>

          <section className="mt-12 p-8 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-amber-500" />
              Governing Law
            </h2>
            <p className="text-sm leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the Federal Democratic Republic of Ethiopia. Any disputes arising from these Terms or use of the platform shall be subject to the exclusive jurisdiction of the courts of Addis Ababa.
            </p>
          </section>

          <div className="mt-12 space-y-4 text-center">
            <h2 className="text-xl font-bold text-gray-900">Questions about our Terms?</h2>
            <p className="text-gray-600">
              If you have any questions or require clarification regarding these terms, please contact our legal team.
            </p>
            <a
              href="mailto:abumahilkerim@gmail.com"
              className="inline-block px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
            >
              Contact Legal Support
            </a>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            © 2026 FreeLync Digital Brokerage. All rights reserved.
            Unauthorized use of our platform or its content may yield legal action.
          </p>
        </div>
      </div>
    </PageLayout>
  );
};

export default Terms;


