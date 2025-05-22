'use client';

import { useState, useEffect } from 'react';
import { BN } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { OptionsDeXClient, formatTokenAmount, formatOptionType, formatTimestamp } from '../utils/program';

interface OptionsMarketplaceProps {
  client: OptionsDeXClient;
}

export default function OptionsMarketplace({ client }: OptionsMarketplaceProps) {
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form states for creating options
  const [optionType, setOptionType] = useState<'call' | 'put'>('call');
  const [strikePrice, setStrikePrice] = useState('');
  const [amount, setAmount] = useState('');
  const [premium, setPremium] = useState('');
  const [expirationDays, setExpirationDays] = useState('7');

  const handleCreateOption = async () => {
    if (!strikePrice || !amount || !premium) return;

    setLoading(true);
    try {
      const timestamp = new BN(Date.now());
      const expiration = new BN(Date.now() + parseInt(expirationDays) * 24 * 60 * 60 * 1000);
      
      // This would need actual mint addresses and token accounts
      const tx = await client.writeOption({
        timestamp,
        optionType: optionType === 'call' ? { call: {} } : { put: {} },
        strikePrice: new BN(parseFloat(strikePrice) * 1_000_000),
        expirationTimestamp: expiration,
        amount: new BN(parseFloat(amount) * 1_000_000),
        premiumPerContract: new BN(parseFloat(premium) * 1_000_000),
        underlyingMint: new PublicKey('So11111111111111111111111111111111111111112'), // SOL mint
        quoteMint: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'), // USDC mint
        writerTokenAccount: new PublicKey('11111111111111111111111111111111'), // Placeholder
        writerQuoteAccount: new PublicKey('11111111111111111111111111111111'), // Placeholder
        optionsMarket: new PublicKey('11111111111111111111111111111111'), // Placeholder
      });

      console.log('Option created:', tx);
      setShowCreateModal(false);
      // Reset form
      setStrikePrice('');
      setAmount('');
      setPremium('');
    } catch (error) {
      console.error('Error creating option:', error);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-8 fade-in-up">
      {/* Header */}
      <div className="flex justify-between items-center slide-in-left">
        <div>
          <h2 className="text-4xl font-black glow-text mb-2">Options Marketplace</h2>
          <p className="text-gray-300 text-lg">Trade call and put options with institutional-grade tools</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary interactive-hover"
        >
          <span className="flex items-center space-x-2">
            <span className="text-2xl">✨</span>
            <span className="font-bold">Create Option</span>
          </span>
        </button>
      </div>

      {/* Market Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 fade-in-up delay-200">
        <div className="stat-card-glow text-center">
          <div className="text-3xl font-black glow-text-emerald">0</div>
          <div className="text-sm text-gray-300 font-semibold">Active Options</div>
        </div>
        <div className="stat-card-glow text-center">
          <div className="text-3xl font-black glow-text-purple">$7.5M</div>
          <div className="text-sm text-gray-300 font-semibold">Total Volume</div>
        </div>
        <div className="stat-card-glow text-center">
          <div className="text-3xl font-black glow-text-emerald">42%</div>
          <div className="text-sm text-gray-300 font-semibold">Avg. IV</div>
        </div>
        <div className="stat-card-glow text-center">
          <div className="text-3xl font-black glow-text-purple">150</div>
          <div className="text-sm text-gray-300 font-semibold">Total Contracts</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Available Options */}
        <div className="xl:col-span-2">
          <div className="card fade-in-up delay-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold glow-text-purple">Available Options</h3>
              <div className="glass rounded-xl px-4 py-2">
                <span className="text-emerald-400 font-semibold">🟢 Market Open</span>
              </div>
            </div>
            
            {/* Empty state with style */}
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-purple-500/20 to-emerald-500/20 flex items-center justify-center text-4xl border border-white/10">
                📈
              </div>
              <h4 className="text-2xl font-bold text-gray-200 mb-4">No Options Available</h4>
              <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">
                Be the first to create an option contract and start earning premiums!
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-success interactive-hover"
              >
                <span className="flex items-center space-x-2">
                  <span className="text-xl">🚀</span>
                  <span className="font-bold">Create First Option</span>
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Market Analytics */}
        <div className="space-y-6">
          <div className="card fade-in-up delay-400">
            <h3 className="text-xl font-bold glow-text-emerald mb-6">Market Analytics</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 glass rounded-xl">
                <span className="text-gray-300">SOL Price</span>
                <span className="text-emerald-400 font-bold">$98.45</span>
              </div>
              <div className="flex justify-between items-center p-3 glass rounded-xl">
                <span className="text-gray-300">24h Volume</span>
                <span className="text-purple-400 font-bold">$2.3M</span>
              </div>
              <div className="flex justify-between items-center p-3 glass rounded-xl">
                <span className="text-gray-300">Open Interest</span>
                <span className="text-emerald-400 font-bold">$456K</span>
              </div>
              <div className="flex justify-between items-center p-3 glass rounded-xl">
                <span className="text-gray-300">Volatility</span>
                <span className="text-purple-400 font-bold">42.3%</span>
              </div>
            </div>
          </div>

          <div className="card fade-in-up delay-500">
            <h3 className="text-xl font-bold glow-text-purple mb-6">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full glass rounded-xl p-4 text-left hover:bg-white/10 transition-all duration-300 interactive-hover"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-xl">
                    📝
                  </div>
                  <div>
                    <div className="font-semibold text-gray-200">Write Call</div>
                    <div className="text-sm text-gray-400">Earn premium income</div>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full glass rounded-xl p-4 text-left hover:bg-white/10 transition-all duration-300 interactive-hover"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-xl">
                    📉
                  </div>
                  <div>
                    <div className="font-semibold text-gray-200">Write Put</div>
                    <div className="text-sm text-gray-400">Profit from range-bound markets</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Create Option Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-dark-card rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Create New Option</h3>
            
            <div className="space-y-4">
              {/* Option Type */}
              <div>
                <label className="block text-sm font-medium mb-2">Option Type</label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setOptionType('call')}
                    className={`flex-1 py-2 px-4 rounded ${
                      optionType === 'call' ? 'bg-solana-green text-black' : 'bg-gray-600'
                    }`}
                  >
                    Call
                  </button>
                  <button
                    onClick={() => setOptionType('put')}
                    className={`flex-1 py-2 px-4 rounded ${
                      optionType === 'put' ? 'bg-red-500 text-white' : 'bg-gray-600'
                    }`}
                  >
                    Put
                  </button>
                </div>
              </div>

              {/* Strike Price */}
              <div>
                <label className="block text-sm font-medium mb-2">Strike Price (USDC)</label>
                <input
                  type="number"
                  value={strikePrice}
                  onChange={(e) => setStrikePrice(e.target.value)}
                  className="input-field w-full"
                  placeholder="100.00"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium mb-2">Amount (SOL)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input-field w-full"
                  placeholder="1.0"
                />
              </div>

              {/* Premium */}
              <div>
                <label className="block text-sm font-medium mb-2">Premium per Contract (USDC)</label>
                <input
                  type="number"
                  value={premium}
                  onChange={(e) => setPremium(e.target.value)}
                  className="input-field w-full"
                  placeholder="5.0"
                />
              </div>

              {/* Expiration */}
              <div>
                <label className="block text-sm font-medium mb-2">Expiration (Days)</label>
                <select
                  value={expirationDays}
                  onChange={(e) => setExpirationDays(e.target.value)}
                  className="input-field w-full"
                >
                  <option value="1">1 Day</option>
                  <option value="7">1 Week</option>
                  <option value="30">1 Month</option>
                  <option value="90">3 Months</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateOption}
                disabled={loading || !strikePrice || !amount || !premium}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Option'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 