import type { SubnetResults } from './subnet';
import type { IPv6SubnetResults } from './ipv6';

export function generateCSV(results: SubnetResults): string {
  const rows = [
    ['Property', 'Value'],
    ['Network Address', results.networkAddress],
    ['Broadcast Address', results.broadcastAddress],
    ['First Host IP', results.firstHostIP],
    ['Last Host IP', results.lastHostIP],
    ['Total Hosts', results.totalHosts.toString()],
    ['Mask Bits (CIDR)', `/${results.maskBits}`],
    ['IP Class', results.ipClass],
    ['Wildcard Mask', results.wildcardMask]
  ];

  return rows.map(row => row.join(',')).join('\n');
}

export function generateIPv6CSV(results: IPv6SubnetResults): string {
  const rows = [
    ['Property', 'Value'],
    ['Network Address', results.networkAddress],
    ['Last Address', results.lastAddress],
    ['Total Addresses', results.totalAddresses]
  ];

  return rows.map(row => row.join(',')).join('\n');
}

export function downloadCSV(data: string, filename: string) {
  const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}