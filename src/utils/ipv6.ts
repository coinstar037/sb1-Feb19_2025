export interface IPv6SubnetResults {
  networkAddress: string;
  lastAddress: string;
  totalAddresses: string;
}

export function isValidIPv6Address(address: string): boolean {
  try {
    if (address === '') return false;
    
    // Remove any leading/trailing whitespace
    address = address.trim();
    
    // Check for proper use of ::
    const doubleColonCount = (address.match(/::/g) || []).length;
    if (doubleColonCount > 1) return false;
    
    // Split the address into its segments
    const segments = address.split(':');
    
    // Handle ::
    if (doubleColonCount === 1) {
      const parts = address.split('::');
      const before = parts[0] ? parts[0].split(':') : [];
      const after = parts[1] ? parts[1].split(':') : [];
      
      if (before.length + after.length > 7) return false;
    } else {
      // Without ::, we should have exactly 8 segments
      if (segments.length !== 8) return false;
    }
    
    // Validate each segment
    return segments.every(segment => {
      if (segment === '') return true; // Allow empty segments for ::
      if (segment.length > 4) return false;
      return /^[0-9A-Fa-f]{1,4}$/.test(segment);
    });
  } catch {
    return false;
  }
}

export function expandIPv6Address(address: string): string {
  // Handle empty or invalid input
  if (!address) return '';
  
  // Split on :: to handle compressed sections
  const parts = address.split('::');
  
  if (parts.length > 2) return ''; // Invalid if more than one ::
  
  let before = parts[0] ? parts[0].split(':') : [];
  let after = parts[1] ? parts[1].split(':') : [];
  
  // Expand each section to 4 digits
  before = before.map(x => x.padStart(4, '0'));
  after = after.map(x => x.padStart(4, '0'));
  
  // Calculate how many zero sections we need
  const missing = 8 - (before.length + after.length);
  const zeros = Array(missing).fill('0000');
  
  // Combine all parts
  const full = [...before, ...zeros, ...after];
  
  return full.join(':');
}

export function calculateIPv6Subnet(address: string, prefixLength: number): IPv6SubnetResults | null {
  try {
    // Expand the address to its full form
    const expandedAddress = expandIPv6Address(address);
    if (!expandedAddress) return null;
    
    // Convert to binary
    let binary = '';
    expandedAddress.split(':').forEach(hex => {
      binary += parseInt(hex, 16).toString(2).padStart(16, '0');
    });
    
    // Apply network mask
    const networkBinary = binary.substring(0, prefixLength) + '0'.repeat(128 - prefixLength);
    const lastBinary = binary.substring(0, prefixLength) + '1'.repeat(128 - prefixLength);
    
    // Convert back to hex
    const networkAddress = [];
    const lastAddress = [];
    for (let i = 0; i < 128; i += 16) {
      networkAddress.push(parseInt(networkBinary.substr(i, 16), 2).toString(16).padStart(4, '0'));
      lastAddress.push(parseInt(lastBinary.substr(i, 16), 2).toString(16).padStart(4, '0'));
    }
    
    // Calculate total addresses
    const totalBits = 128 - prefixLength;
    const totalAddresses = totalBits === 0 ? '1' : `2^${totalBits}`;
    
    return {
      networkAddress: compressIPv6Address(networkAddress.join(':')),
      lastAddress: compressIPv6Address(lastAddress.join(':')),
      totalAddresses
    };
  } catch {
    return null;
  }
}

function compressIPv6Address(address: string): string {
  // Find the longest sequence of zero segments
  const segments = address.split(':');
  let longestZeroStart = -1;
  let longestZeroLength = 0;
  let currentZeroStart = -1;
  let currentZeroLength = 0;
  
  for (let i = 0; i < segments.length; i++) {
    if (segments[i] === '0000') {
      if (currentZeroStart === -1) currentZeroStart = i;
      currentZeroLength++;
      
      if (currentZeroLength > longestZeroLength) {
        longestZeroStart = currentZeroStart;
        longestZeroLength = currentZeroLength;
      }
    } else {
      currentZeroStart = -1;
      currentZeroLength = 0;
    }
  }
  
  // Compress the longest zero sequence if it's at least 2 segments long
  if (longestZeroLength >= 2) {
    const before = segments.slice(0, longestZeroStart).map(s => parseInt(s, 16).toString(16));
    const after = segments.slice(longestZeroStart + longestZeroLength).map(s => parseInt(s, 16).toString(16));
    return [...before, '', ...after].join(':');
  }
  
  // Just remove leading zeros from each segment
  return segments.map(s => parseInt(s, 16).toString(16)).join(':');
}