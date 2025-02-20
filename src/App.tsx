import { useState } from 'react';
import SubnetCalculator from './components/SubnetCalculator';
import IPv6SubnetCalculator from './components/IPv6SubnetCalculator';

function App() {
  const [mode, setMode] = useState<'ipv4' | 'ipv6'>('ipv4');

  return (
    <div className="min-h-screen bg-gray-100 p-2 sm:p-4 md:p-8">
      <div className="w-full max-w-6xl mx-auto text-center">
        <div className="mb-4">
          <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1 mb-4">
            <button
              onClick={() => setMode('ipv4')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === 'ipv4'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              IPv4
            </button>
            <button
              onClick={() => setMode('ipv6')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === 'ipv6'
                  ? 'bg-purple-500 text-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              IPv6
            </button>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-2">
            {mode === 'ipv4' ? 'IPv4' : 'IPv6'} Subnet Calculator
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-600">
            Calculate Network Information Including Addresses, Hosts, And Subnet Details
          </p>
        </div>
        <div className="flex items-start justify-center">
          {mode === 'ipv4' ? <SubnetCalculator /> : <IPv6SubnetCalculator />}
        </div>
      </div>
    </div>
  );
}

export default App;