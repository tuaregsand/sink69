'use client';

import { useState, useEffect } from 'react';
import { OptionsDeXClient, formatTokenAmount, formatOptionType, formatTimestamp } from '../utils/program';

interface UserPortfolioProps {
  client: OptionsDeXClient;
}

export default function UserPortfolio({ client }: UserPortfolioProps) {
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPositions = async () => {
      try {
        // In a real implementation, you would fetch the user's positions
        // For now, we'll show an empty state
        setPositions([]);
      } catch (error) {
        console.error('Error fetching positions:', error);
      }
      setLoading(false);
    };

    fetchPositions();
  }, [client]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-400">Loading your portfolio...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Your Portfolio</h2>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Total Value</h3>
          <div className="text-2xl font-bold text-solana-green">$0</div>
          <div className="text-xs text-gray-400 mt-1">Portfolio value</div>
        </div>

        <div className="card">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Open Positions</h3>
          <div className="text-2xl font-bold text-solana-purple">0</div>
          <div className="text-xs text-gray-400 mt-1">Active contracts</div>
        </div>

        <div className="card">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Total P&L</h3>
          <div className="text-2xl font-bold text-gray-400">$0</div>
          <div className="text-xs text-gray-400 mt-1">Unrealized gains</div>
        </div>

        <div className="card">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Premium Paid</h3>
          <div className="text-2xl font-bold text-gray-400">$0</div>
          <div className="text-xs text-gray-400 mt-1">Total premiums</div>
        </div>
      </div>

      {/* Active Positions */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Active Positions</h3>
        
        {positions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">No positions yet</div>
            <p className="text-sm text-gray-500 mb-6">
              Start trading options to see your positions here
            </p>
            <button className="btn-primary">
              Browse Options
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 text-sm font-medium text-gray-400">Type</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-400">Strike</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-400">Expiry</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-400">Size</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-400">Premium</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-400">P&L</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* Position rows would go here */}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Trading History */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Trading History</h3>
        
        <div className="text-center py-12">
          <div className="text-gray-400 mb-2">No trading history</div>
          <p className="text-sm text-gray-500">
            Your completed trades will appear here
          </p>
        </div>
      </div>

      {/* Risk Metrics */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Risk Overview</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-gray-400 mb-1">Max Risk</div>
            <div className="text-xl font-bold">$0</div>
          </div>
          
          <div>
            <div className="text-sm text-gray-400 mb-1">Delta Exposure</div>
            <div className="text-xl font-bold">0</div>
          </div>
          
          <div>
            <div className="text-sm text-gray-400 mb-1">Theta Decay</div>
            <div className="text-xl font-bold">$0/day</div>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
          <div className="text-sm font-medium text-blue-400">💡 Portfolio Tip</div>
          <div className="text-xs text-gray-400 mt-1">
            Diversify your options portfolio across different strikes and expiration dates to manage risk effectively.
          </div>
        </div>
      </div>
    </div>
  );
} 