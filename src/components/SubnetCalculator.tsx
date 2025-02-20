import { useState, useEffect, useMemo } from 'react';
import { 
  calculateSubnet, 
  isValidIPAddress, 
  isValidSubnetMask, 
  convertCIDRToMask,
  convertMaskToCIDR,
  determineIPClass, 
  getAllHostAddresses 
} from '../utils/subnet';
import type { SubnetResults } from '../utils/subnet';
import { InformationCircleIcon, ClipboardIcon, ChevronDownIcon, ChevronUpIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { Tooltip } from 'react-tooltip';
import { generateCSV, downloadCSV } from '../utils/csvExport';

interface ResultCardProps {
  label: string;
  value: string | number | undefined;
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
    <div className={`${colorClasses[color]} p-3 sm:p-4 rounded-md transition-all hover:shadow-md`}>
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

export default function SubnetCalculator() {
  const [ipAddress, setIpAddress] = useState('');
  const [subnetMask, setSubnetMask] = useState('');
  const [results, setResults] = useState<SubnetResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ipClass, setIpClass] = useState<string>('');
  const [copied, setCopied] = useState<string>('');
  const [showAllHosts, setShowAllHosts] = useState(false);
  const [hostAddresses, setHostAddresses] = useState<string[]>([]);
  const [exportClicked, setExportClicked] = useState(false);

  useEffect(() => {
    if (ipAddress) {
      if (isValidIPAddress(ipAddress)) {
        setIpClass(determineIPClass(ipAddress));
      } else {
        setIpClass('');
      }
    } else {
      setIpClass('');
    }
  }, [ipAddress]);

  useEffect(() => {
    if (ipAddress && subnetMask) {
      if (!isValidIPAddress(ipAddress)) {
        setError('Invalid IP address format');
        setResults(null);
        return;
      }

      if (!isValidSubnetMask(subnetMask)) {
        setError('Invalid subnet mask format');
        setResults(null);
        return;
      }

      setError(null);
      const result = calculateSubnet(ipAddress, subnetMask);
      if (result) {
        setResults(result);
        if (result.totalHosts <= 1024) {
          setHostAddresses(getAllHostAddresses(result.firstHostIP, result.lastHostIP));
        } else {
          setHostAddresses([]);
        }
      } else {
        setError('Error calculating subnet');
      }
    } else {
      setResults(null);
      setError(null);
      setHostAddresses([]);
    }
  }, [ipAddress, subnetMask]);

  const handleCIDRChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value) {
      const mask = convertCIDRToMask(parseInt(e.target.value.substring(1), 10));
      setSubnetMask(mask);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  };

  const handleExportCSV = () => {
    if (results) {
      setExportClicked(true);
      const csv = generateCSV(results);
      downloadCSV(csv, `subnet-calculation-${new Date().toISOString()}.csv`);
      setTimeout(() => setExportClicked(false), 1000);
    }
  };

  const getClassColor = (ipClass: string) => {
    switch (ipClass) {
      case 'A': return 'bg-green-100 text-green-800';
      case 'B': return 'bg-blue-100 text-blue-800';
      case 'C': return 'bg-purple-100 text-purple-800';
      case 'D': return 'bg-yellow-100 text-yellow-800';
      case 'E': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getHostRange = () => {
    if (!results) return '-';
    return `${results.firstHostIP} - ${results.lastHostIP}`;
  };

  const getMaskBits = () => {
    if (subnetMask) {
      const maskBits = subnetMask.startsWith('/') 
        ? parseInt(subnetMask.substring(1), 10)
        : convertMaskToCIDR(subnetMask);
      return maskBits;
    }
    return 0;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 md:p-8 w-full max-w-[95vw] mx-auto">
      <div className="space-y-6 sm:space-y-8">
        {/* Input Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* IP Address Input */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label htmlFor="ipAddress" className="block text-sm font-medium text-gray-700">
                IP Address
              </label>
              <InformationCircleIcon 
                className="h-4 w-4 text-gray-400 cursor-help"
                data-tooltip-id="ip-tooltip"
              />
              <Tooltip id="ip-tooltip" place="top">
                Enter an IPv4 address (e.g., 192.168.1.0)
              </Tooltip>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <input
                type="text"
                id="ipAddress"
                placeholder="e.g., 192.168.1.0"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                className={`flex-1 rounded-md border ${
                  ipAddress && !isValidIPAddress(ipAddress) 
                    ? 'border-red-300 focus:border-red-500' 
                    : 'border-gray-300 focus:border-blue-500'
                } px-2 sm:px-4 py-2 focus:ring-1 focus:ring-blue-500 transition-colors text-sm sm:text-base`}
              />
              {ipClass && (
                <div className={`${getClassColor(ipClass)} px-2 sm:px-3 py-1 rounded-md font-medium transition-colors text-xs sm:text-sm whitespace-nowrap`}>
                  Class {ipClass}
                </div>
              )}
            </div>
          </div>

          {/* Subnet Mask Input */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label htmlFor="subnetMask" className="block text-sm font-medium text-gray-700">
                Subnet Mask
              </label>
              <InformationCircleIcon 
                className="h-4 w-4 text-gray-400 cursor-help"
                data-tooltip-id="subnet-tooltip"
              />
              <Tooltip id="subnet-tooltip" place="top">
                Enter a subnet mask (e.g., 255.255.255.0) or select CIDR notation
              </Tooltip>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <input
                type="text"
                id="subnetMask"
                placeholder="e.g., 255.255.255.0"
                value={subnetMask}
                onChange={(e) => setSubnetMask(e.target.value)}
                className={`flex-1 rounded-md border ${
                  subnetMask && !isValidSubnetMask(subnetMask)
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-gray-300 focus:border-blue-500'
                } px-2 sm:px-4 py-2 focus:ring-1 focus:ring-blue-500 transition-colors text-sm sm:text-base`}
              />
              <select
                className="min-w-[80px] sm:min-w-[100px] rounded-md border border-gray-300 px-2 sm:px-4 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white text-gray-700 text-sm sm:text-base"
                onChange={handleCIDRChange}
                value={results ? `/${results.maskBits}` : ''}
              >
                <option value="">CIDR</option>
                {Array.from({ length: 33 }, (_, i) => (
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

        {/* Network Visualization - Always visible */}
        <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="absolute inset-y-0 left-0 bg-blue-500 transition-all duration-300"
            style={{ 
              width: `${(getMaskBits() / 32) * 100}%`,
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-900">
            Network Bits: {getMaskBits()} / Host Bits: {32 - getMaskBits()}
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-4 sm:space-y-6">
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
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Save as CSV
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            {/* Network Information Cards - 2 Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <ResultCard
                label="Network Address"
                value={results?.networkAddress}
                tooltipContent="The first address in the subnet (network identifier)"
                onCopy={() => results && copyToClipboard(results.networkAddress, 'network')}
                copied={copied === 'network'}
                color="green"
              />
              <ResultCard
                label="Broadcast Address"
                value={results?.broadcastAddress}
                tooltipContent="The last address in the subnet (used for broadcast messages)"
                onCopy={() => results && copyToClipboard(results.broadcastAddress, 'broadcast')}
                copied={copied === 'broadcast'}
                color="orange"
              />
              <ResultCard
                label="First Host IP"
                value={results?.firstHostIP}
                tooltipContent="The first usable IP address for hosts in the subnet"
                onCopy={() => results && copyToClipboard(results.firstHostIP, 'first')}
                copied={copied === 'first'}
                color="teal"
              />
              <ResultCard
                label="Last Host IP"
                value={results?.lastHostIP}
                tooltipContent="The last usable IP address for hosts in the subnet"
                onCopy={() => results && copyToClipboard(results.lastHostIP, 'last')}
                copied={copied === 'last'}
                color="indigo"
              />
              <ResultCard
                label="Total Hosts"
                value={results?.totalHosts.toLocaleString()}
                tooltipContent="Total number of usable host addresses in the subnet"
                color="pink"
              />
              <ResultCard
                label="Mask Bits (CIDR)"
                value={results ? `/${results.maskBits}` : '-'}
                tooltipContent="Number of network bits in CIDR notation"
                color="cyan"
              />
            </div>

            {/* Host Range and Wildcard Mask Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Host Range Card */}
              <div className="bg-blue-50 p-3 sm:p-4 rounded-md transition-all hover:shadow-md">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs sm:text-sm font-medium text-blue-700">Host Address Range</p>
                  <InformationCircleIcon 
                    className="h-4 w-4 text-blue-400 cursor-help"
                    data-tooltip-id="host-range-tooltip"
                  />
                  <Tooltip id="host-range-tooltip" place="top">
                    The range of usable IP addresses for hosts in this subnet
                  </Tooltip>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm sm:text-lg font-semibold text-gray-900 break-all">
                    {getHostRange()}
                  </p>
                  <button
                    onClick={() => results && copyToClipboard(getHostRange(), 'range')}
                    className="p-1 hover:bg-blue-100 rounded-md transition-colors ml-2 flex-shrink-0"
                    data-tooltip-id="copy-range"
                  >
                    <ClipboardIcon className={`h-4 w-4 sm:h-5 sm:w-5 ${copied === 'range' ? 'text-green-500' : 'text-blue-400'}`} />
                    <Tooltip id="copy-range">
                      {copied === 'range' ? 'Copied!' : 'Copy to clipboard'}
                    </Tooltip>
                  </button>
                </div>
              </div>

              {/* Wildcard Mask Card */}
              <div className="bg-purple-50 p-3 sm:p-4 rounded-md transition-all hover:shadow-md">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs sm:text-sm font-medium text-purple-700">Wildcard Mask</p>
                  <InformationCircleIcon 
                    className="h-4 w-4 text-purple-400 cursor-help"
                    data-tooltip-id="wildcard-mask-tooltip"
                  />
                  <Tooltip id="wildcard-mask-tooltip" place="top">
                    The inverse of the subnet mask, used in ACLs and route configurations
                  </Tooltip>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm sm:text-lg font-semibold text-gray-900">
                    {results?.wildcardMask || '-'}
                  </p>
                  <button
                    onClick={() => results && copyToClipboard(results.wildcardMask, 'wildcard')}
                    className="p-1 hover:bg-purple-100 rounded-md transition-colors ml-2 flex-shrink-0"
                    data-tooltip-id="copy-wildcard"
                  >
                    <ClipboardIcon className={`h-4 w-4 sm:h-5 sm:w-5 ${copied === 'wildcard' ? 'text-green-500' : 'text-purple-400'}`} />
                    <Tooltip id="copy-wildcard">
                      {copied === 'wildcard' ? 'Copied!' : 'Copy to clipboard'}
                    </Tooltip>
                  </button>
                </div>
              </div>
            </div>

            {/* All Host Addresses Section */}
            {results && hostAddresses.length > 0 && (
              <div className="bg-gray-50 p-3 sm:p-4 rounded-md">
                <button
                  onClick={() => setShowAllHosts(!showAllHosts)}
                  className="w-full flex items-center justify-between text-gray-700 hover:text-gray-900"
                >
                  <span className="text-xs sm:text-sm font-medium">
                    {showAllHosts ? 'Hide' : 'Show'} All Host Addresses ({hostAddresses.length} addresses)
                  </span>
                  {showAllHosts ? (
                    <ChevronUpIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  ) : (
                    <ChevronDownIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                </button>
                {showAllHosts && (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 max-h-96 overflow-y-auto">
                    {hostAddresses.map((address, index) => (
                      <div key={index} className="text-xs sm:text-sm text-gray-600 font-mono">
                        {address}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {results && results.totalHosts > 1024 && (
              <div className="text-xs sm:text-sm text-gray-500 italic">
                Host list is only available for subnets with 1024 or fewer addresses
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}