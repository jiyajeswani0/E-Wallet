import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { CreditCard, DollarSign, Zap, History } from 'lucide-react';
import axios from 'axios';

// Set the base URL for axios to point to the backend server
axios.defaults.baseURL = 'http://localhost:8080';

const Recharge = () => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);

    try {
      // Create Razorpay order
      const orderResponse = await axios.post('/v1/payments/create-order', {
        amount: parseFloat(amount)
      });

      const { order_id, amount: orderAmount } = orderResponse.data;

      // Initialize Razorpay
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_0DqsVb6cb8KC42', // Replace with your Razorpay key
        amount: orderAmount * 100, // Razorpay expects amount in paise
        currency: 'INR',
        name: 'Digital Wallet',
        description: 'Wallet Recharge',
        order_id: order_id,
        handler: async function (response) {
          try {
            // Verify payment with backend
            const verificationResponse = await axios.post('/v1/payments/verify', {
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature
            });

            if (verificationResponse.data.status === 'captured') {
              toast.success('Wallet recharged successfully!');
              navigate('/dashboard');
            } else {
              toast.error('Payment verification failed. Please contact support.');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            toast.error(error.response?.data?.message || 'Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: 'User',
          email: 'user@example.com',
          contact: '9999999999'
        },
        theme: {
          color: '#2563eb'
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Recharge error:', error);
      toast.error(error.response?.data?.message || 'Failed to create recharge order. Please try again.');
      setLoading(false);
    }
  };

  const quickAmounts = [100, 200, 500, 1000, 2000, 5000];

  return (
    <div className="min-h-screen flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <CreditCard className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Recharge Wallet</h2>
          <p className="text-base text-gray-600">
            Add money to your wallet using secure payment
          </p>
        </div>

        <div className="premium-card p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                Amount (₹)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  id="amount"
                  name="amount"
                  type="number"
                  min="1"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input-field pl-10"
                  placeholder="Enter amount"
                />
              </div>
            </div>

            {/* Quick Amount Buttons */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Quick Amounts
              </label>
              <div className="grid grid-cols-3 gap-2">
                {quickAmounts.map((quickAmount) => (
                  <button
                    key={quickAmount}
                    type="button"
                    onClick={() => setAmount(quickAmount.toString())}
                    className="py-2 px-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 text-sm hover:bg-gray-200 transition-colors duration-200"
                  >
                    ₹{quickAmount}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-accent w-full py-2 font-medium flex items-center justify-center space-x-2"
            >
              <Zap className="h-4 w-4" />
              <span>{loading ? 'Processing...' : 'Recharge Now'}</span>
            </button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <p className="text-gray-500 text-sm">
              Secure payment powered by Razorpay
            </p>
            <Link
              to="/recharge-history"
              className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors duration-200"
            >
              <History className="h-4 w-4" />
              <span>View Recharge History</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Recharge; 