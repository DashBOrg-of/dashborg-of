# Network Configuration: Gotchas and Traps

When reporting network addresses (LAN IP, ports, etc.), dashborg instances commonly make mistakes that affect multi-machine deployment.

## Trap: "First Non-Loopback IP" Approach

❌ **Don't do this:**
```javascript
const ip = networkInterfaces()
  .flatMap(addrs => addrs)
  .find(addr => addr.family === 'IPv4' && !addr.internal)?.address;
```

This will grab:
- Virtual adapter IPs (VMware, VirtualBox, Docker)
- VPN interface IPs (when active)
- Disabled/stale interface IPs
- Any non-loopback first, not necessarily the active one

**Result:** Reporting `192.168.224.1` (virtual) when the actual LAN is `192.168.0.4` (Wi-Fi).

## Solution: Query Active Gateway

✅ **Do this instead:**

### Windows (PowerShell)
```powershell
Get-NetIPConfiguration | Where-Object { $_.IPv4DefaultGateway } | Select-Object -First 1 -ExpandProperty IPv4Address
```

### Linux
```bash
ip route | grep default | grep -oP '(?<=src )\S+'
```

### macOS
```bash
route -n get default | grep interface | awk '{print $2}'
```

### Node.js Universal Fallback
See `packages/runtime-node/src/utils/get-lan-address.mjs` for a cross-platform implementation.

## Why This Works

The **default gateway route** identifies which network adapter is actually connected to the internet/LAN. Only adapters with a default gateway are actively used for network communication.

- Virtual adapters: no default route
- Disconnected adapters: no default route
- VPN (when not active): no default route
- Active LAN adapter: ✅ has default route

## Dashborg Instance Recipe

When exposing network port (43202) for LAN access:

1. **Query active gateway** to get real LAN IP
2. **Validate address** against expected subnet (192.168.x.x, 10.x.x.x, etc.)
3. **Log the address** at startup so users can copy-paste
4. **Never hardcode** network addresses; they change by machine

## See Also

- `packages/runtime-node/src/utils/get-lan-address.mjs` — cross-platform utility
- Instance configuration: `dashborg.instance.json` bind address and port
- Three privacy scopes: agent (43200), local (43201), network (43202)
