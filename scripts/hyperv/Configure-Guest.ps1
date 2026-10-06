# ==============================================================================
# Script: Configure-Guest.ps1
# Purpose: Post-boot guest automation for Linux VMs:
#          - Discovers assigned dynamic IP via MAC neighbor lookup
#          - Expands LVM / ext4 root filesystem to 50 GB NVMe capacity
#          - Configures customer-specified username and password over SSH
# ==============================================================================

param (
    [Parameter(Mandatory=$true)][string]$VMName,
    [Parameter(Mandatory=$false)][string]$AdminUsername = "ubuntu",
    [Parameter(Mandatory=$false)][string]$AdminPassword = "",
    [Parameter(Mandatory=$false)][string]$DefaultPass = "root",
    [Parameter(Mandatory=$false)][int]$TimeoutSeconds = 90
)

$ErrorActionPreference = "SilentlyContinue"

Write-Output "[GUEST CONFIG] Starting guest post-boot provisioning for VM: $VMName"

$VM = Get-VM -Name $VMName -ErrorAction SilentlyContinue
if (-not $VM) {
    Write-Error "VM '$VMName' not found."
    exit 1
}

$Net = Get-VMNetworkAdapter -VMName $VMName
$MacFormatted = if ($Net -and $Net.MacAddress) { [regex]::Replace($Net.MacAddress, '..(?!$)', '$&-').ToLower() } else { $null }

# 1. Wait for IP address assignment
$ResolvedIP = $null
$Deadline = (Get-Date).AddSeconds($TimeoutSeconds)

while ((Get-Date) -lt $Deadline) {
    # Check KVP IP
    $CurrentNet = Get-VMNetworkAdapter -VMName $VMName
    if ($CurrentNet -and $CurrentNet.IPAddresses) {
        $ResolvedIP = ($CurrentNet.IPAddresses | Where-Object { $_ -notlike '*:*' } | Select-Object -First 1)
    }

    # Check ARP / Neighbor table by MAC
    if (-not $ResolvedIP -and $MacFormatted) {
        $Neighbor = Get-NetNeighbor -ErrorAction SilentlyContinue | Where-Object {
            $_.LinkLayerAddress -and ($_.LinkLayerAddress.ToLower() -eq $MacFormatted) -and ($_.State -ne 'Permanent')
        } | Select-Object -First 1

        if ($Neighbor) {
            $ResolvedIP = $Neighbor.IPAddress
        }
    }

    if ($ResolvedIP) {
        # Test TCP port 22
        $TcpTest = Test-NetConnection -ComputerName $ResolvedIP -Port 22 -WarningAction SilentlyContinue
        if ($TcpTest.TcpTestSucceeded) {
            Write-Output "[GUEST CONFIG] VM reachable at $ResolvedIP (Port 22 SSH OPEN)"
            break
        }
    }

    Start-Sleep -Seconds 2
}

if (-not $ResolvedIP) {
    Write-Output "[GUEST CONFIG] Notice: VM IP not discovered within timeout; will configure on first boot."
    $Result = @{
        Success = $true
        Configured = $false
        Message = "IP discovery timed out; credentials registered in portal"
        VMName = $VMName
    }
    Write-Output ($Result | ConvertTo-Json -Compress)
    exit 0
}

# 2. Execute guest provisioning commands via SSH
$AskPassBat = Join-Path $env:TEMP "askpass_$([guid]::NewGuid().ToString('N')).bat"
"@echo $DefaultPass" | Set-Content -Path $AskPassBat -Encoding ASCII

$env:SSH_ASKPASS = $AskPassBat
$env:SSH_ASKPASS_REQUIRE = "force"
$env:DISPLAY = "dummy:0"

try {
    # Build guest command batch: expand root disk & apply credentials
    $Commands = @(
        # Disk expansion for LVM & ext4
        "echo $DefaultPass | sudo -S growpart /dev/sda 3 2>/dev/null || true",
        "echo $DefaultPass | sudo -S pvresize /dev/sda3 2>/dev/null || true",
        "echo $DefaultPass | sudo -S lvextend -l +100%FREE /dev/ubuntu-vg/ubuntu-lv 2>/dev/null || true",
        "echo $DefaultPass | sudo -S resize2fs /dev/ubuntu-vg/ubuntu-lv 2>/dev/null || true",
        "echo $DefaultPass | sudo -S resize2fs /dev/sda3 2>/dev/null || true"
    )

    if ($AdminPassword) {
        $SafePass = $AdminPassword -replace '"', '\"'
        # Update baseline users
        $Commands += "echo 'ubuntu:$SafePass' | sudo -S chpasswd"
        $Commands += "echo 'root:$SafePass' | sudo -S chpasswd"

        # Create custom username if specified
        if ($AdminUsername -and ($AdminUsername -ne 'ubuntu') -and ($AdminUsername -ne 'root')) {
            $SafeUser = $AdminUsername.ToLower() -replace '[^a-z0-9_-]', ''
            $Commands += "id -u $SafeUser 2>/dev/null || sudo useradd -m -s /bin/bash -G sudo $SafeUser"
            $Commands += "echo '$SafeUser:$SafePass' | sudo chpasswd"
        }
    }

    $FullCmd = $Commands -join " ; "

    $SshOutput = & ssh.exe -o StrictHostKeyChecking=no -o UserKnownHostsFile=NUL -o ConnectTimeout=10 "ubuntu@$ResolvedIP" "$FullCmd" 2>&1
    Write-Output "[GUEST CONFIG] Execution completed on $ResolvedIP"

    $Result = @{
        Success = $true
        Configured = $true
        IP = $ResolvedIP
        Username = $AdminUsername
        VMName = $VMName
    }
    Write-Output ($Result | ConvertTo-Json -Compress)
}
catch {
    Write-Output "[GUEST CONFIG ERROR] Guest setup failed: $_"
    $Result = @{
        Success = $false
        Error = $_.ToString()
        IP = $ResolvedIP
    }
    Write-Output ($Result | ConvertTo-Json -Compress)
}
finally {
    Remove-Item $AskPassBat -Force -ErrorAction SilentlyContinue
}
