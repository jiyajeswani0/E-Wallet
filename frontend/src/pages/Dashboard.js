import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft, Sparkles, Users, Activity, History, FileText } from 'lucide-react';
import axios from 'axios';

// Set the base URL for axios to point to the backend server
axios.defaults.baseURL = 'http://localhost:8080';

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    balance: 0,
    stats: {
      total_sent: 0,
      total_received: 0,
      total_transactions: 0,
      recent_activity: 0
    },
    recentTransactions: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch all dashboard data in parallel
      const [balanceRes, statsRes, transactionsRes] = await Promise.all([
        axios.get('/v1/customers/balance'),
        axios.get('/v1/customers/dashboard-stats'),
        axios.get('/v1/transfers/recent?limit=5')
      ]);
      
      setDashboardData({
        balance: balanceRes.data.balance,
        stats: statsRes.data,
        recentTransactions: transactionsRes.data.data || []
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Welcome Section */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.first_name}
        </h1>
        <p className="text-sm text-gray-600">
          Here's your wallet overview
        </p>
      </div>

      {/* Balance Card */}
      <div className="premium-card bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold mb-1 text-gray-700">Wallet Balance</h2>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(dashboardData.balance)}</p>
          </div>
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
            <Wallet className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>

      {/* Quick Actions and Statistics */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="premium-card p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link to="/transfer" className="w-full btn-primary flex items-center justify-center space-x-2 py-3">
              <ArrowUpRight className="h-4 w-4" />
              <span>Send Money</span>
            </Link>
            <Link to="/recharge" className="w-full btn-secondary flex items-center justify-center space-x-2 py-3">
              <ArrowDownLeft className="h-4 w-4" />
              <span>Recharge Wallet</span>
            </Link>
            <Link to="/esign" className="w-full btn-secondary flex items-center justify-center space-x-2 py-3">
              <FileText className="h-4 w-4" />
              <span>Digital Signatures</span>
            </Link>
            <Link to="/transaction-history" className="w-full btn-secondary flex items-center justify-center space-x-2 py-3">
              <FileText className="h-4 w-4" />
              <span>Transaction History</span>
            </Link>
            <Link to="/recharge-history" className="w-full btn-secondary flex items-center justify-center space-x-2 py-3">
              <History className="h-4 w-4" />
              <span>Recharge History</span>
            </Link>
          </div>
        </div>

        <div className="premium-card p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Statistics</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 text-sm">Total Sent</span>
              <span className="font-bold text-red-600 text-lg">
                {formatCurrency(dashboardData.stats.total_sent)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 text-sm">Total Received</span>
              <span className="font-bold text-green-600 text-lg">
                {formatCurrency(dashboardData.stats.total_received)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 text-sm">Total Transactions</span>
              <span className="font-bold text-gray-900 text-lg">{dashboardData.stats.total_transactions}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 text-sm">Recent Activity</span>
              <span className="font-bold text-blue-600 text-lg">{dashboardData.stats.recent_activity}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="premium-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Recent Transactions</h3>
          <Link 
            to="/transaction-history"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
          >
            <span>View All</span>
            <TrendingUp className="h-4 w-4" />
          </Link>
        </div>
        {dashboardData.recentTransactions.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm mb-1">No transactions yet</p>
            <p className="text-gray-400 text-xs">Your transaction history will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {dashboardData.recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover-lift">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    transaction.action === 'credit' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {transaction.action === 'credit' ? (
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      {transaction.action === 'credit' ? 'Received from' : 'Sent to'} {transaction.customer}
                    </p>
                    <p className="text-gray-500 text-xs">{transaction.created_at}</p>
                    {transaction.note && (
                      <p className="text-gray-400 text-xs">{transaction.note}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-sm ${
                    transaction.action === 'credit' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.action === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </p>
                  <p className="text-gray-400 text-xs capitalize">{transaction.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 