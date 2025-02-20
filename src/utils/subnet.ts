export interface SubnetResults {
  networkAddress: string;
  broadcastAddress: string;
  firstHostIP: string;
  lastHostIP: string;
  totalHosts: number;
  maskBits: number;
  ipClass: string;
  wildcardMask: string;
}

export function isValidIPAddress(ip: string): boolean {
  const parts = ip.split('.');
  if (parts.length !== 4) return false;

  return parts.every(part => {
    const num = parseInt(part, 10);
    return !isNaN(num) && num >= 0 && num <= 255;
  });
}

export function determineIPClass(ip: string): string {
  const firstOctet = parseInt(ip.split('.')[0], 10);
  
  if (firstOctet >= 1 && firstOctet <= 126) return 'A';
  if (firstOctet >= 128 && firstOctet <= 191) return 'B';
  if (firstOctet >= 192 && firstOctet <= 223) return 'C';
  if (firstOctet >= 224 && firstOctet <= 239) return 'D';
  if (firstOctet >= 240 && firstOctet <= 255) return 'E';
  return 'Invalid';
}

export function isValidSubnetMask(mask: string): boolean {
  if (mask.startsWith('/')) {
    const bits = parseInt(mask.substring(1), 10);
    return !isNaN(bits) && bits >= 0 && bits <= 32;
  }

  const parts = mask.split('.');
  if (parts.length !== 4) return false;

  let binary = '';
  for (const part of parts) {
    const num = parseInt(part, 10);
    if (isNaN(num) || num < 0 || num > 255) return false;
    binary += num.toString(2).padStart(8, '0');
  }

  return /^1*0*$/.test(binary);
}

export function convertMaskToCIDR(mask: string): number {
  if (mask.startsWith('/')) {
    return parseInt(mask.substring(1), 10);
  }

  const parts = mask.split('.');
  let binary = '';
  for (const part of parts) {
    binary += parseInt(part, 10).toString(2).padStart(8, '0');
  }
  return binary.split('1').length - 1;
}

export function convertCIDRToMask(cidr: number): string {
  const binary = '1'.repeat(cidr) + '0'.repeat(32 - cidr);
  const octets = [];
  for (let i = 0; i < 32; i += 8) {
    octets.push(parseInt(binary.slice(i, i + 8), 2));
  }
  return octets.join('.');
}

export function calculateWildcardMask(subnetMask: string): string {
  const parts = subnetMask.split('.');
  return parts.map(part => (255 - parseInt(part, 10))).join('.');
}

export function ipToNumber(ip: string): number {
  const parts = ip.split('.');
  return ((parseInt(parts[0], 10) << 24) |
          (parseInt(parts[1], 10) << 16) |
          (parseInt(parts[2], 10) << 8) |
          parseInt(parts[3], 10)) >>> 0;
}

export function numberToIP(num: number): string {
  return [
    (num >>> 24) & 255,
    (num >>> 16) & 255,
    (num >>> 8) & 255,
    num & 255
  ].join('.');
}

export function getAllHostAddresses(firstHost: string, lastHost: string): string[] {
  const firstNum = ipToNumber(firstHost);
  const lastNum = ipToNumber(lastHost);
  const hosts: string[] = [];
  
  for (let i = firstNum; i <= lastNum; i++) {
    hosts.push(numberToIP(i));
  }
  
  return hosts;
}

export function calculateSubnet(ip: string, mask: string): SubnetResults | null {
  if (!isValidIPAddress(ip) || !isValidSubnetMask(mask)) {
    return null;
  }

  const maskBits = convertMaskToCIDR(mask);
  const subnetMask = convertCIDRToMask(maskBits);
  const ipNum = ipToNumber(ip);
  const maskNum = ipToNumber(subnetMask);
  
  const networkNum = ipNum & maskNum;
  const broadcastNum = networkNum | (~maskNum >>> 0);
  
  const totalHosts = Math.pow(2, 32 - maskBits) - 2;
  
  return {
    networkAddress: numberToIP(networkNum),
    broadcastAddress: numberToIP(broadcastNum),
    firstHostIP: numberToIP(networkNum + 1),
    lastHostIP: numberToIP(broadcastNum - 1),
    totalHosts: totalHosts > 0 ? totalHosts : 0,
    maskBits,
    ipClass: determineIPClass(ip),
    wildcardMask: calculateWildcardMask(subnetMask)
  };
}