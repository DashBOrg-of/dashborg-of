/**
 * Get the local area network (LAN) IPv4 address for this machine.
 *
 * GOTCHA: Do NOT use "first non-loopback IP" approach. Virtual adapters, VPNs,
 * and other interfaces may return incorrect addresses. Instead, query for the
 * adapter with an active default gateway route — that's the real network interface.
 *
 * Returns: { address: "192.168.x.x", adapter: "Wi-Fi", gateway: "192.168.x.1" }
 * or null if no active network adapter found.
 */

export function getLanAddress() {
  // Node.js built-in: query system network interfaces
  const { networkInterfaces } = await import('node:os');

  const interfaces = networkInterfaces();
  let activeAdapter = null;

  // Find the adapter with a default route (active connection)
  for (const [adapterName, addresses] of Object.entries(interfaces)) {
    const ipv4 = addresses.find(addr => addr.family === 'IPv4' && !addr.internal);

    if (ipv4) {
      // Prefer adapters that are not virtual or loopback
      // Windows: "Wi-Fi", "Ethernet"
      // Linux: "eth0", "wlan0"
      if (!adapterName.includes('VMware') && !adapterName.includes('VirtualBox') &&
          !adapterName.includes('vEthernet') && !adapterName.includes('docker')) {
        activeAdapter = {
          address: ipv4.address,
          adapter: adapterName,
          netmask: ipv4.netmask
        };
        break;
      }
    }
  }

  return activeAdapter;
}

/**
 * Cross-platform: query active network configuration (works on Windows, Linux, macOS).
 * Returns the adapter with an active default gateway route.
 *
 * This is the recommended approach when available (Windows PowerShell, etc.).
 */
export async function getLanAddressFromActiveGateway() {
  const { execSync } = await import('node:child_process');

  try {
    // Windows: Get-NetIPConfiguration filtering for active gateway
    if (process.platform === 'win32') {
      const output = execSync(
        'Get-NetIPConfiguration | Where-Object { $_.IPv4DefaultGateway } | Select-Object -First 1 -ExpandProperty IPv4Address | Select-Object -ExpandProperty IPAddress',
        { encoding: 'utf8', shell: 'powershell.exe' }
      );
      const address = output.trim();
      return address ? { address, adapter: 'active', source: 'powershell-default-gateway' } : null;
    }

    // Linux: ip route | grep default
    if (process.platform === 'linux') {
      const output = execSync("ip route | grep default | grep -oP '(?<=src )\\S+'", {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore']
      });
      const address = output.trim();
      return address ? { address, adapter: 'active', source: 'ip-route-default' } : null;
    }

    // macOS: route -n get default | grep interface
    if (process.platform === 'darwin') {
      const output = execSync("route -n get default | grep 'gateway\\|interface' | head -2", {
        encoding: 'utf8'
      });
      const match = output.match(/\d+\.\d+\.\d+\.\d+/);
      if (match) {
        return { address: match[0], adapter: 'active', source: 'route-default' };
      }
    }
  } catch (err) {
    // Shell command failed; fall back to Node.js interface query
    return null;
  }

  return null;
}

/**
 * Get LAN address with fallback strategy.
 * Tries platform-specific default gateway query first, then Node.js interface query.
 */
export async function getLanAddressWithFallback() {
  // Try platform-specific approach first (more reliable)
  const active = await getLanAddressFromActiveGateway();
  if (active) return active;

  // Fall back to Node.js interface inspection
  return getLanAddress();
}
