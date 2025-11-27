import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Transfer from './pages/Transfer';
import Recharge from './pages/Recharge';
import RechargeHistory from './pages/RechargeHistory';
import TransactionHistory from './pages/TransactionHistory';
import ESign from './pages/ESign';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-white">
        <Toaster 
          position="top-right"
          toastOptions={{
            style: {
              background: '#ffffff',
              color: '#374151',
              borderRadius: '0.5rem',
              border: '1px solid #e5e7eb',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
            },
          }}
        />
        <Navbar />
        <main className="container mx-auto px-4 py-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/transfer" element={<Transfer />} />
            <Route path="/recharge" element={<Recharge />} />
            <Route path="/recharge-history" element={<RechargeHistory />} />
            <Route path="/transaction-history" element={<TransactionHistory />} />
            <Route path="/esign" element={<ESign />} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}

export default App; 