import React from 'react';
import { Link } from 'react-router-dom';
import {
    Facebook,
    Twitter,
    Instagram,
    Linkedin,
    Mail,
    Phone,
    MapPin,
    ArrowRight
} from 'lucide-react';
import logoImage from './Images/FreeLync__logo.png';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 pt-16 pb-8 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                    {/* Company Info */}
                    <div className="space-y-6">
                        <Link to="/" className="flex items-center space-x-3">
                            <img src={logoImage} alt="FreeLync Logo" className="w-10 h-10 object-contain" />
                            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                                FreeLync
                            </span>
                        </Link>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                            The premier digital brokerage platform for secure property and vehicle trading. Built on trust, powered by escrow.
                        </p>
                        <div className="flex space-x-4">
                            <a href="#" className="p-2 rounded-full bg-gray-50 dark:bg-gray-800 text-gray-400 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                                <Facebook className="w-5 h-5" />
                            </a>
                            <a href="https://twitter.com/metinie1" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-gray-50 dark:bg-gray-800 text-gray-400 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="https://www.instagram.com/metinie11/" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-gray-50 dark:bg-gray-800 text-gray-400 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a href="#" className="p-2 rounded-full bg-gray-50 dark:bg-gray-800 text-gray-400 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                                <Linkedin className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-wider">Marketplace</h3>
                        <ul className="space-y-4">
                            <li>
                                <Link to="/buy" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 transition-colors flex items-center">
                                    <ArrowRight className="w-4 h-4 mr-2" />
                                    Buy Property
                                </Link>
                            </li>
                            <li>
                                <Link to="/rent" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 transition-colors flex items-center">
                                    <ArrowRight className="w-4 h-4 mr-2" />
                                    Rentals
                                </Link>
                            </li>
                            <li>
                                <Link to="/sell" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 transition-colors flex items-center">
                                    <ArrowRight className="w-4 h-4 mr-2" />
                                    Sell Items
                                </Link>
                            </li>
                            <li>
                                <Link to="/dashboard" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 transition-colors flex items-center">
                                    <ArrowRight className="w-4 h-4 mr-2" />
                                    Your Log
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Support Links */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-wider">Support</h3>
                        <ul className="space-y-4">
                            <li>
                                <Link to="/about" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 transition-colors flex items-center">
                                    <ArrowRight className="w-4 h-4 mr-2" />
                                    About Us
                                </Link>
                            </li>
                            <li>
                                <Link to="/contact" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 transition-colors flex items-center">
                                    <ArrowRight className="w-4 h-4 mr-2" />
                                    Contact Us
                                </Link>
                            </li>
                            <li>
                                <Link to="/faq" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 transition-colors flex items-center">
                                    <ArrowRight className="w-4 h-4 mr-2" />
                                    Help & FAQs
                                </Link>
                            </li>
                            <li>
                                <Link to="/privacy" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 transition-colors flex items-center">
                                    <ArrowRight className="w-4 h-4 mr-2" />
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link to="/terms" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 transition-colors flex items-center">
                                    <ArrowRight className="w-4 h-4 mr-2" />
                                    Terms of Service
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact Details */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-wider">Contact</h3>
                        <ul className="space-y-4">
                            <li className="flex items-start">
                                <div className="bg-blue-50 dark:bg-gray-800 p-2 rounded-lg mr-3">
                                    <Mail className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 uppercase">Support Email</p>
                                    <a href="mailto:abumahilkerim@gmail.com" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 font-medium">
                                        abumahilkerim@gmail.com
                                    </a>
                                </div>
                            </li>
                            <li className="flex items-start">
                                <div className="bg-blue-50 dark:bg-gray-800 p-2 rounded-lg mr-3">
                                    <Phone className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 uppercase">Phone Number</p>
                                    <a href="tel:+2519118982161" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 font-medium">
                                        +251 918982161
                                    </a>
                                </div>
                            </li>
                            <li className="flex items-start">
                                <div className="bg-blue-50 dark:bg-gray-800 p-2 rounded-lg mr-3">
                                    <MapPin className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 uppercase">HQ Office</p>
                                    <p className="text-gray-700 dark:text-gray-300 font-medium">
                                        Addis Ababa, Ethiopia
                                    </p>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-gray-100 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 text-sm text-gray-500">
                    <p>© {currentYear} FreeLync Digital Brokerage. All rights reserved.</p>
                    <div className="flex space-x-6">
                        <Link to="/privacy" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-xs">Privacy Policy</Link>
                        <Link to="/terms" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-xs">Terms of Service</Link>
                        <Link to="/faq" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-xs">Cookie Policy</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
