import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Zap, Globe, CreditCard, Sparkles, ArrowRight } from 'lucide-react';

const Home = () => {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center py-16 relative">
        <div className="absolute inset-0 bg-gray-800 rounded-lg blur-2xl opacity-50"></div>
        <div className="relative max-w-4xl mx-auto">
          <div className="mb-6">
            <div className="inline-flex items-center space-x-2 bg-gray-800 rounded-full px-4 py-2 border border-gray-600 mb-6">
              <Sparkles className="h-4 w-4 text-gray-300" />
              <span className="text-gray-300 font-medium text-sm">Premium Digital Wallet</span>
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
            The Future of
            <br />
            <span className="text-gray-300">
              Digital Finance
            </span>
            <br />
            is Here
          </h1>
          
          <p className="text-lg text-gray-400 mb-8 max-w-3xl mx-auto font-light leading-relaxed">
            Experience the next generation of digital payments with our sophisticated, secure, and elegant wallet platform.
          </p>
          
          <div className="flex justify-center space-x-4">
            <Link to="/register" className="btn-primary group">
              <span className="flex items-center space-x-2">
                <span>Get Started</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
            </Link>
            <Link to="/login" className="btn-secondary">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-6">
              Why Choose Our Platform?
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Discover the features that make our digital wallet the most sophisticated and secure platform available
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="premium-card p-6 text-center hover-lift group">
              <div className="w-16 h-16 bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Shield className="h-8 w-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-white mb-3">Bank-Grade Security</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Military-grade encryption with multi-factor authentication and real-time fraud detection
              </p>
            </div>
            
            <div className="premium-card p-6 text-center hover-lift group">
              <div className="w-16 h-16 bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Zap className="h-8 w-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-white mb-3">Lightning Fast</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Instant transfers and real-time balance updates with zero downtime
              </p>
            </div>
            
            <div className="premium-card p-6 text-center hover-lift group">
              <div className="w-16 h-16 bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Globe className="h-8 w-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-white mb-3">Global Reach</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Send money worldwide with competitive rates and instant currency conversion
              </p>
            </div>
            
            <div className="premium-card p-6 text-center hover-lift group">
              <div className="w-16 h-16 bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <CreditCard className="h-8 w-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-white mb-3">Premium Experience</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Sophisticated design with intuitive interface and premium customer support
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="premium-card p-12 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gray-800 rounded-lg opacity-50"></div>
        <div className="relative">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Experience the Future?
          </h2>
          <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto font-light">
            Join millions of users who trust our platform for their digital payments and financial management
          </p>
          <Link to="/register" className="btn-accent inline-flex items-center space-x-2">
            <span>Create Your Account</span>
            <Sparkles className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home; 