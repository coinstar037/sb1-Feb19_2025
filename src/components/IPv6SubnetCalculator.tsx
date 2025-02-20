import { useState, useEffect, useMemo } from 'react';
import { calculateIPv6Subnet, isValidIPv6Address, expandIPv6Address } from '../utils/ipv6';
import type { IPv6SubnetResults } from '../utils/ipv6';
import { InformationCircleIcon, ClipboardIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { Tooltip } from 'react-tooltip';
import { generateIPv6CSV, downloadCSV } from '../utils/csvExport';

interface ResultCardProps {
  label: string;
  value: string | undefined;
  tooltipContent: string;
  onCopy?: () => void;
  copied?: boolean;
  color?: 'green' | 'orange' | 'teal' | 'indigo' | 'pink' | 'cyan';
}

function ResultCard({ label, value, tooltipContent, onCopy, copied, color = 'cyan' }: ResultCardProps) {
  const tooltipId = useMemo(() => `tooltip-${label.toLowerCase().replace(/\s+/g, '-')}`, [label]);
  
  const colorClasses = {
    green: 'bg-green-50',
    orange: 'bg-orange-50',
    teal: 'bg-teal-50',
    indigo: 'bg-indigo-50',
    pink: 'bg-pink-50',
    cyan: 'bg-cyan-50'
  };

  const textColors = {
    green: 'text-gray-900',
    orange: 'text-gray-900',
    teal: 'text-gray-900',
    indigo: 'text-gray-900',
    pink: 'text-gray-900',
    cyan: 'text-gray-900'
  };
  
  return (
    <div className={`${colorClasses[color]} p-3 sm:p-4 rounded-md transition-all hover:shadow-md h-full`}>
      <div className="flex items-center gap-2 mb-1">
        <p className="text-xs sm:text-sm font-medium text-gray-500">{label}</p>
        <InformationCircleIcon 
          className="h-4 w-4 text-gray-400 cursor-help"
          data-tooltip-id={tooltipId}
        />
        <Tooltip id={tooltipId} place="top">
          {tooltipContent}
        </Tooltip>
      </div>
      <div className="flex items-center justify-between">
        <p className={`text-sm sm:text-lg font-semibold ${textColors[color]} break-all`}>
          {value || '-'}
        </p>
        {onCopy && (
          <button
            onClick={onCopy}
            className="p-1 hover:bg-gray-200 rounded-md transition-colors ml-2 flex-shrink-0"
            data-tooltip-id={`copy-${label}`}
          >
            <ClipboardIcon className={`h-4 w-4 sm:h-5 sm:w-5 ${copied ? 'text-green-500' : 'text-gray-400'}`} />
            <Tooltip id={`copy-${label}`}>
              {copied ? 'Copied!' : 'Copy to clipboard'}
            </Tooltip>
          </button>
        )}
      </div>
    </div>
  );
}

export default function IPv6SubnetCalculator() {
  const [ipAddress, setIpAddress] = useState('');
  const [prefixLength, setPrefixLength] = useState('');
  const [results, setResults] = useState<IPv6SubnetResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string>('');
  const [exportClicked, setExportClicked] = useState(false);

  useEffect(() => {
    if (ipAddress && prefixLength) {
      if (!isValidIPv6Address(ipAddress)) {
        setError('Invalid IPv6 address format');
        setResults(null);
        return;
      }

      const prefix = parseInt(prefixLength, 10);
      if (isNaN(prefix) || prefix < 0 || prefix > 128) {
        setError('Invalid prefix length (must be between 0 and 128)');
        setResults(null);
        return;
      }

      setError(null);
      const result = calculateIPv6Subnet(ipAddress, prefix);
      if (result) {
        setResults(result);
      } else {
        setError('Error calculating subnet');
      }
    } else {
      setResults(null);
      setError(null);
    }
  }, [ipAddress, prefixLength]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  };

  const handleExportCSV = () => {
    if (results) {
      setExportClicked(true);
      const csv = generateIPv6CSV(results);
      downloadCSV(csv, `ipv6-subnet-calculation-${new Date().toISOString()}.csv`);
      setTimeout(() => setExportClicked(false), 1000);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 md:p-8 w-full">
      <div className="space-y-4 sm:space-y-6">
        {/* Input Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* IPv6 Address Input */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label htmlFor="ipv6Address" className="block text-sm font-medium text-gray-700">
                IPv6 Address
              </label>
              <InformationCircleIcon 
                className="h-4 w-4 text-gray-400 cursor-help"
                data-tooltip-id="ipv6-tooltip"
              />
              <Tooltip id="ipv6-tooltip" place="top">
                Enter an IPv6 address (e.g., 2001:db8::)
              </Tooltip>
            </div>
            <input
              type="text"
              id="ipv6Address"
              placeholder="e.g., 2001:db8::"
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
              className={`w-full rounded-md border ${
                ipAddress && !isValidIPv6Address(ipAddress)
                  ? 'border-red-300 focus:border-red-500'
                  : 'border-gray-300 focus:border-purple-500'
              } px-2 sm:px-4 py-2 focus:ring-1 focus:ring-purple-500 transition-colors text-sm sm:text-base`}
            />
          </div>

          {/* Prefix Length Input */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label htmlFor="prefixLength" className="block text-sm font-medium text-gray-700">
                Prefix Length
              </label>
              <InformationCircleIcon 
                className="h-4 w-4 text-gray-400 cursor-help"
                data-tooltip-id="prefix-tooltip"
              />
              <Tooltip id="prefix-tooltip" place="top">
                Enter the prefix length (0-128) or select from the dropdown
              </Tooltip>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <input
                type="text"
                id="prefixLength"
                placeholder="e.g., 64"
                value={prefixLength}
                onChange={(e) => setPrefixLength(e.target.value)}
                className={`flex-1 rounded-md border ${
                  prefixLength && (isNaN(parseInt(prefixLength, 10)) || parseInt(prefixLength, 10) < 0 || parseInt(prefixLength, 10) > 128)
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-gray-300 focus:border-purple-500'
                } px-2 sm:px-4 py-2 focus:ring-1 focus:ring-purple-500 transition-colors text-sm sm:text-base`}
              />
              <select
                className="min-w-[80px] sm:min-w-[100px] rounded-md border border-gray-300 px-2 sm:px-4 py-2 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 bg-white text-gray-700 text-sm sm:text-base"
                onChange={(e) => setPrefixLength(e.target.value.substring(1))}
                value={prefixLength ? `/${prefixLength}` : ''}
              >
                <option value="">Prefix</option>
                {Array.from({ length: 129 }, (_, i) => (
                  <option key={i} value={`/${i}`}>/{i}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="text-red-600 text-sm font-medium p-4 bg-red-50 rounded-md border border-red-200">
            {error}
          </div>
        )}

        {/* Network Visualization */}
        <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="absolute inset-y-0 left-0 bg-purple-500 transition-all duration-300"
            style={{ 
              width: `${(parseInt(prefixLength || '0', 10) / 128) * 100}%`,
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-900">
            Network Bits: {prefixLength || '0'} / Interface ID Bits: {128 - parseInt(prefixLength || '0', 10)}
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-4">
          <div className="flex items-center">
            <div className="flex-1 text-center">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Network Information</h2>
            </div>
            <button
              onClick={handleExportCSV}
              disabled={!results}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                exportClicked
                  ? 'bg-green-500 text-white transform scale-105'
                  : results
                    ? 'bg-purple-500 text-white hover:bg-purple-600'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Save as CSV
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <ResultCard
              label="Network Address"
              value={results?.networkAddress}
              tooltipContent="The first address in the subnet (network identifier)"
              onCopy={results ? () => copyToClipboard(results.networkAddress, 'network') : undefined}
              copied={copied === 'network'}
              color="green"
            />
            <ResultCard
              label="Last Address"
              value={results?.lastAddress}
              tooltipContent="The last address in the subnet"
              onCopy={results ? () => copyToClipboard(results.lastAddress, 'last') : undefined}
              copied={copied === 'last'}
              color="orange"
            />
            <ResultCard
              label="Expanded Network Address"
              value={results?.networkAddress ? expandIPv6Address(results.networkAddress) : undefined}
              tooltipContent="Full expanded form of the network address"
              onCopy={results ? () => copyToClipboard(expandIPv6Address(results.networkAddress), 'expanded') : undefined}
              copied={copied === 'expanded'}
              color="teal"
            />
            <ResultCard
              label="Total Addresses"
              value={results?.totalAddresses}
              tooltipContent="Total number of addresses in the subnet (2^(128-prefix))"
              color="indigo"
            />
          </div>
        </div>
      </div>
    </div>
  );
}