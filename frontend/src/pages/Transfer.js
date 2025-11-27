import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Send, User, DollarSign, MessageSquare, Search, FileText } from 'lucide-react';
import axios from 'axios';

// Set the base URL for axios to point to the backend server
axios.defaults.baseURL = 'http://localhost:8080';

const Transfer = () => {
  const [formData, setFormData] = useState({
    destination: '',
    amount: '',
    description: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });

    // Search for users when destination email changes
    if (e.target.name === 'destination' && e.target.value.length >= 2) {
      searchUsers(e.target.value);
    } else if (e.target.name === 'destination' && e.target.value.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  const searchUsers = async (keyword) => {
    try {
      const response = await axios.get(`/v1/customers/search?keyword=${keyword}`);
      setSearchResults(response.data.users || []);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const selectUser = (user) => {
    setFormData({
      ...formData,
      destination: user.email
    });
    setShowSearchResults(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.destination || !formData.amount || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (amount <= 0 || amount > 5000) {
      toast.error('Amount should be between ₹1 and ₹5000');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('/v1/transfers/send', {
        destination: formData.destination,
        amount: amount,
        description: formData.description || 'Money transfer',
        password: formData.password
      });

      toast.success(response.data.message || 'Transfer successful!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Transfer error:', error);
      toast.error(error.response?.data?.message || 'Transfer failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Send className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Send Money</h2>
          <p className="text-base text-gray-600">
            Transfer money to another user
          </p>
        </div>

        <div className="premium-card p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-2">
                Recipient Email
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  id="destination"
                  name="destination"
                  type="email"
                  required
                  value={formData.destination}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="Enter recipient's email"
                />
                {showSearchResults && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 mt-1">
                    {searchResults.map((user) => (
                      <div
                        key={user.id}
                        onClick={() => selectUser(user)}
                        className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

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
                  max="5000"
                  step="0.01"
                  required
                  value={formData.amount}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="Enter amount (max ₹5000)"
                />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  id="description"
                  name="description"
                  type="text"
                  value={formData.description}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="Add a note (optional)"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Your Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Enter your password to confirm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2 font-medium"
            >
              {loading ? 'Processing...' : 'Send Money'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <p className="text-gray-500 text-sm">
              Maximum transfer amount: ₹5000
            </p>
            <Link
              to="/transaction-history"
              className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors duration-200"
            >
              <FileText className="h-4 w-4" />
              <span>View Transaction History</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Transfer; 