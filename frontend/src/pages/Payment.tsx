import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Shield,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  DollarSign,
  User,
  MapPin,
  Calendar,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ListingsService } from '@/services/listings';
import { TransactionsService } from '@/services/transactions';
import { NotificationsService } from '@/services/notifications';
import { PaymentService } from '@/services/payment';
import { Listing } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice, formatRelativeTime } from '@/lib/utils';
import { toast } from 'sonner';

const Payment: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const paymentMethods = [
    {
      id: 'chapa',
      name: 'Chapa',
      icon: '💳',
      description: 'Pay with cards and mobile money',
      available: true,
    },
    {
      id: 'telebirr',
      name: 'Telebirr',
      icon: '📱',
      description: 'Pay with your Telebirr account (App/USSD)',
      available: true,
    },
    {
      id: 'bibit',
      name: 'Bibit',
      icon: '💳',
      description: 'Pay with VISA/MasterCard',
      available: true,
    },
  ];

  useEffect(() => {
    if (id) {
      loadListing();
    }
  }, [id]);

  const loadListing = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const response = await ListingsService.getListingById(id);

      if (response.success && response.data) {
        setListing(response.data);
      } else {
        setError(response.message || 'Listing not found');
      }
    } catch (err) {
      setError('Failed to load listing');
      console.error('Error loading listing:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedPaymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    if (!listing || !user) {
      toast.error('Missing required information');
      return;
    }

    try {
      setProcessing(true);

      // Create transaction
      const transactionData = {
        listing_id: listing.id,
        buyer_id: user.id,
        seller_id: listing.owner_id,
        amount: listing.price,
        currency: listing.currency,
        payment_method: selectedPaymentMethod as 'telebirr' | 'chapa' | 'bibit',
        status: 'pending' as const,
      };

      const transactionResponse = await TransactionsService.createTransaction(transactionData);

      if (transactionResponse.success && transactionResponse.data) {
        // Initialize payment with the selected gateway
        const paymentResult = await PaymentService.initializePayment(
          selectedPaymentMethod as 'chapa' | 'telebirr' | 'bibit',
          transactionResponse.data.id,
          listing.id,
          listing.price,
          listing.currency,
          user.email,
          user.phone,
          user.full_name
        );

        if (paymentResult.success && paymentResult.checkoutUrl) {
          // Redirect to payment gateway
          window.location.href = paymentResult.checkoutUrl;
        } else {
          toast.error(paymentResult.message || 'Failed to initialize payment');
          setProcessing(false);
        }
      } else {
        throw new Error(transactionResponse.message || 'Failed to create transaction');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error instanceof Error ? error.message : 'Payment failed');
      setProcessing(false);
    }
  };

  const calculateCommission = (amount: number) => {
    return amount * 0.02; // 2% commission
  };

  const calculateTotal = (amount: number) => {
    return amount + calculateCommission(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Payment Error</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error || 'Unable to load payment details.'}</p>
          <Button onClick={() => navigate('/')}>
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const commission = calculateCommission(listing.price);
  const total = calculateTotal(listing.price);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Complete Your Purchase</h1>
          <p className="text-gray-600 dark:text-gray-400">Secure payment through FreeLync's escrow system</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Payment Details */}
          <div className="space-y-6">
            {/* Listing Summary */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg dark:text-white">Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <img
                      src={listing.images[0]?.url || '/placeholder-image.jpg'}
                      alt={listing.title}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-1">{listing.title}</h3>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>{listing.location.city}, {listing.location.subcity}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>Posted {formatRelativeTime(listing.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t dark:border-gray-700 pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600 dark:text-gray-400">Item Price</span>
                      <span className="font-medium dark:text-gray-200">{formatPrice(listing.price, listing.currency)}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600 dark:text-gray-400">Service Fee (2%)</span>
                      <span className="font-medium dark:text-gray-200">{formatPrice(commission, listing.currency)}</span>
                    </div>
                    <div className="flex justify-between items-center text-lg font-bold border-t dark:border-gray-700 pt-2">
                      <span className="dark:text-white">Total</span>
                      <span className="text-[#0B132B] dark:text-white">{formatPrice(total, listing.currency)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg dark:text-white">Select Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${selectedPaymentMethod === method.id
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        } ${!method.available ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => method.available && setSelectedPaymentMethod(method.id)}
                    >
                      <div className="flex items-center">
                        <div className="text-2xl mr-3">{method.icon}</div>
                        <div className="flex-1">
                          <div className="font-medium dark:text-white">{method.name}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{method.description}</div>
                        </div>
                        {selectedPaymentMethod === method.id && (
                          <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Payment Button */}
            <Button
              onClick={handlePayment}
              disabled={!selectedPaymentMethod || processing}
              className="w-full"
              size="lg"
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing Payment...
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Pay {formatPrice(total, listing.currency)}
                </>
              )}
            </Button>
          </div>

          {/* Escrow Information */}
          <div className="space-y-6">
            {/* Escrow Protection */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg flex items-center dark:text-white">
                  <Shield className="h-5 w-5 mr-2 text-green-500" />
                  Escrow Protection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                    <div>
                      <div className="font-medium dark:text-white">Secure Payment</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Your payment is held securely until you confirm receipt
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                    <div>
                      <div className="font-medium dark:text-white">Buyer Protection</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Full refund if item doesn't match description
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                    <div>
                      <div className="font-medium dark:text-white">Dispute Resolution</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Our team will help resolve any issues
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* How It Works */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg dark:text-white">How Escrow Works</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                      1
                    </div>
                    <div>
                      <div className="font-medium dark:text-white">Make Payment</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Your payment is securely held in escrow
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                      2
                    </div>
                    <div>
                      <div className="font-medium dark:text-white">Receive Item</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Seller delivers the item to you
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                      3
                    </div>
                    <div>
                      <div className="font-medium dark:text-white">Confirm & Release</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Confirm receipt to release payment to seller
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Seller Information */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg dark:text-white">Seller Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mr-3">
                    {listing.owner?.avatar_url ? (
                      <img
                        src={listing.owner.avatar_url}
                        alt={listing.owner.full_name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium dark:text-white">{listing.owner?.full_name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {listing.owner?.verified ? 'Verified Seller' : 'Unverified Seller'}
                    </div>
                  </div>
                </div>

                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center mb-1">
                    <Star className="h-4 w-4 text-yellow-400 mr-1" />
                    <span className="dark:text-gray-300">{listing.owner?.rating?.average?.toFixed(1) || '0.0'} ({listing.owner?.rating?.count || 0} reviews)</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span className="dark:text-gray-300">Member since {new Date(listing.owner?.created_at || '').getFullYear()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
