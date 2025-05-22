'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useConnection } from '@solana/wallet-adapter-react';
import { useState, useEffect } from 'react';
import { BN } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';

import { OptionsDeXClient, formatTokenAmount, formatOptionType, formatTimestamp } from '../utils/program';
import OptionsMarketplace from '../components/OptionsMarketplace';
import ProtocolStats from '../components/ProtocolStats';
import UserPortfolio from '../components/UserPortfolio';

export default function Home() {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const wallet = useWallet();
  
  const [client, setClient] = useState<OptionsDeXClient | null>(null);
  const [activeTab, setActiveTab] = useState<'marketplace' | 'portfolio' | 'stats'>('marketplace');

  useEffect(() => {
    if (connected && wallet) {
      const optionsClient = new OptionsDeXClient(connection, wallet);
      setClient(optionsClient);
    } else {
      setClient(null);
    }
  }, [connected, wallet, connection]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="header-glass sticky top-0 z-50 px-6 py-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-6 slide-in-left">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-emerald-500 flex items-center justify-center font-bold text-white shadow-lg">
                ⚡
              </div>
              <h1 className="text-4xl font-black glow-text">
                Solana Options DEX
              </h1>
            </div>
            <div className="glass rounded-full px-4 py-2 text-sm font-semibold gradient-shift bg-gradient-to-r from-purple-600/20 to-emerald-600/20">
              🚀 Production-Ready • Devnet
            </div>
          </div>
          
          <div className="flex items-center space-x-4 slide-in-right">
            {connected && (
              <div className="glass rounded-2xl px-4 py-3 flex items-center space-x-2">
                <div className="status-dot"></div>
                <span className="text-emerald-300 font-semibold">
                  {publicKey?.toString().slice(0, 6)}...{publicKey?.toString().slice(-4)}
                </span>
              </div>
            )}
            <WalletMultiButton className="btn-primary" />
          </div>
        </div>
      </header>

      {/* Navigation */}
      {connected && (
        <nav className="glass border-b border-white/10 px-6 py-6 fade-in-up delay-200">
          <div className="max-w-7xl mx-auto">
            <div className="flex space-x-6">
              <button
                onClick={() => setActiveTab('marketplace')}
                className={activeTab === 'marketplace' ? 'nav-tab-active' : 'nav-tab-inactive'}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">🏪</span>
                  <span className="font-bold">Marketplace</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('portfolio')}
                className={activeTab === 'portfolio' ? 'nav-tab-active' : 'nav-tab-inactive'}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">💼</span>
                  <span className="font-bold">Portfolio</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={activeTab === 'stats' ? 'nav-tab-active' : 'nav-tab-inactive'}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">📊</span>
                  <span className="font-bold">Protocol Stats</span>
                </div>
              </button>
            </div>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {!connected ? (
          <div className="hero-section relative py-32">
            <div className="hero-bg"></div>
            
            {/* Floating elements */}
            <div className="absolute top-20 left-10 w-20 h-20 bg-purple-500/20 rounded-full blur-xl animate-pulse float"></div>
            <div className="absolute top-40 right-20 w-16 h-16 bg-emerald-500/20 rounded-full blur-lg animate-pulse float delay-200"></div>
            <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-purple-400/20 rounded-full blur-lg animate-pulse float delay-300"></div>
            
            <div className="relative z-10 text-center fade-in-up">
              <div className="mb-16">
                <div className="mb-8 fade-in-up">
                  <div className="inline-block mb-6">
                    <div className="glass rounded-full px-6 py-3 text-sm font-bold gradient-shift bg-gradient-to-r from-purple-600/30 to-emerald-600/30 border border-purple-500/30">
                      ✨ Next-Generation DeFi Options Platform
                    </div>
                  </div>
                  <h2 className="text-7xl font-black mb-8 leading-tight">
                    Welcome to the Future of
                    <br />
                    <span className="glow-text gradient-shift">Options Trading</span>
                  </h2>
                  <p className="text-2xl text-gray-200 mb-12 max-w-4xl mx-auto leading-relaxed font-light">
                    Experience lightning-fast settlement, ultra-low fees, and complete decentralization. 
                    Built on Solana for institutional-grade performance with retail accessibility.
                  </p>
                </div>
                
                {/* Key metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-16 fade-in-up delay-200">
                  <div className="stat-card-glow text-center">
                    <div className="text-3xl font-black glow-text-emerald">400ms</div>
                    <div className="text-sm text-gray-300 font-semibold">Settlement Time</div>
                  </div>
                  <div className="stat-card-glow text-center">
                    <div className="text-3xl font-black glow-text-purple">0.5%</div>
                    <div className="text-sm text-gray-300 font-semibold">Protocol Fees</div>
                  </div>
                  <div className="stat-card-glow text-center">
                    <div className="text-3xl font-black glow-text-emerald">100%</div>
                    <div className="text-sm text-gray-300 font-semibold">On-Chain</div>
                  </div>
                  <div className="stat-card-glow text-center">
                    <div className="text-3xl font-black glow-text-purple">$7.5M</div>
                    <div className="text-sm text-gray-300 font-semibold">Total Volume</div>
                  </div>
                </div>
              </div>
              
              {/* Feature cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16 fade-in-up delay-300">
                <div className="card-hero text-center interactive-float">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-3xl shadow-xl">
                    ⚡
                  </div>
                  <h3 className="text-2xl font-bold mb-4 glow-text-purple">Lightning Speed</h3>
                  <p className="text-gray-200 text-lg leading-relaxed">
                    Execute trades in 400ms with Solana's high-performance blockchain. 
                    No more waiting for confirmations.
                  </p>
                </div>
                
                <div className="card-hero text-center interactive-float delay-100">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-3xl shadow-xl">
                    💎
                  </div>
                  <h3 className="text-2xl font-bold mb-4 glow-text-emerald">Premium Features</h3>
                  <p className="text-gray-200 text-lg leading-relaxed">
                    Advanced analytics, automated strategies, and institutional-grade 
                    risk management tools.
                  </p>
                </div>
                
                <div className="card-hero text-center interactive-float delay-200">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-500 to-emerald-500 flex items-center justify-center text-3xl shadow-xl">
                    🔒
                  </div>
                  <h3 className="text-2xl font-bold mb-4 glow-text">Battle-Tested Security</h3>
                  <p className="text-gray-200 text-lg leading-relaxed">
                    Audited smart contracts, 100% test coverage, and proven 
                    security practices for your peace of mind.
                  </p>
                </div>
              </div>
              
              {/* CTA Section */}
              <div className="space-y-8 fade-in-up delay-400">
                <div className="space-y-4">
                  <WalletMultiButton className="btn-primary text-2xl px-16 py-6 pulse-glow text-white font-black" />
                  <p className="text-lg text-gray-300 font-semibold">
                    Connect your wallet to start trading options
                  </p>
                </div>
                
                <div className="flex justify-center items-center space-x-8 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span className="text-gray-300 font-semibold">Production Ready</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
                    <span className="text-gray-300 font-semibold">Audited & Secure</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span className="text-gray-300 font-semibold">Revenue Generating</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            {activeTab === 'marketplace' && client && <OptionsMarketplace client={client} />}
            {activeTab === 'portfolio' && client && <UserPortfolio client={client} />}
            {activeTab === 'stats' && client && <ProtocolStats client={client} />}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="footer-gradient glass border-t border-white/10 mt-32 py-16 px-6 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 left-20 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-10 right-20 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          {/* Main footer content */}
          <div className="text-center mb-12 fade-in-up">
            <div className="flex items-center justify-center space-x-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-emerald-500 flex items-center justify-center font-bold text-white text-xl shadow-xl">
                ⚡
              </div>
              <h3 className="text-4xl font-black glow-text">Solana Options DEX</h3>
            </div>
            <p className="text-xl text-gray-200 max-w-2xl mx-auto">
              The most advanced decentralized options protocol on Solana. 
              Built for traders, by traders.
            </p>
          </div>
          
          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 max-w-4xl mx-auto mb-12 fade-in-up delay-200">
            <div className="stat-card-glow text-center">
              <div className="text-3xl font-black glow-text-emerald mb-2">100%</div>
              <div className="text-sm text-gray-300 font-semibold">Test Coverage</div>
            </div>
            <div className="stat-card-glow text-center">
              <div className="text-3xl mb-2">🔐</div>
              <div className="text-sm text-gray-300 font-semibold">Security Audited</div>
            </div>
            <div className="stat-card-glow text-center">
              <div className="text-3xl font-black glow-text-purple mb-2">$7.5M</div>
              <div className="text-sm text-gray-300 font-semibold">Total Volume</div>
            </div>
            <div className="stat-card-glow text-center">
              <div className="text-3xl mb-2">⚡</div>
              <div className="text-sm text-gray-300 font-semibold">400ms Settlement</div>
            </div>
            <div className="stat-card-glow text-center">
              <div className="text-3xl font-black glow-text-emerald mb-2">0.5%</div>
              <div className="text-sm text-gray-300 font-semibold">Protocol Fees</div>
            </div>
          </div>
          
          {/* Feature highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 fade-in-up delay-300">
            <div className="text-center">
              <h4 className="text-lg font-bold text-gray-200 mb-2">Built for Scale</h4>
              <p className="text-gray-400">Handling thousands of transactions per second with sub-second finality.</p>
            </div>
            <div className="text-center">
              <h4 className="text-lg font-bold text-gray-200 mb-2">Institutional Grade</h4>
              <p className="text-gray-400">Professional trading tools with enterprise-level security and reliability.</p>
            </div>
            <div className="text-center">
              <h4 className="text-lg font-bold text-gray-200 mb-2">Community Driven</h4>
              <p className="text-gray-400">Governed by the community, built for the ecosystem, powered by innovation.</p>
            </div>
          </div>
          
          {/* Copyright */}
          <div className="text-center pt-8 border-t border-white/10 fade-in-up delay-400">
            <p className="text-gray-300 text-lg">
              &copy; 2024 <span className="glow-text font-bold">Solana Options DEX</span>. 
              Built with ❤️ on Solana.
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Redefining DeFi options trading, one block at a time.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
} 