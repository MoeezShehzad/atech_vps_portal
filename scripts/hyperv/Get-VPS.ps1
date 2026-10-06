# ==============================================================================
# Script: Get-VPS.ps1
# Purpose: Query real-time status, specs, and network metrics from Hyper-V
# ==============================================================================

param (
    [Parameter(Mandatory=$false)][string]$VMName
)

$ErrorActionPreference = "Stop"

try {
    if ($VMName) {
        $VM = Get-VM -Name $VMName -ErrorAction SilentlyContinue
        if (-not $VM) {
            Write-Output (@{ Found = $false; VMName = $VMName } | ConvertTo-Json -Compress)
            exit 0
        }
        $VMs = @($VM)
    } else {
        $VMs = Get-VM -ErrorAction SilentlyContinue
    }

    $List = @()
    foreach ($v in $VMs) {
        $Net = Get-VMNetworkAdapter -VMName $v.Name -ErrorAction SilentlyContinue
        $IPs = @()
        if ($Net -and $Net.IPAddresses) {
            $IPs = $Net.IPAddresses | Where-Object { $_ -notlike '*:*' }
        }

        $List += @{
            Found = $true
            VMName = $v.Name
            VMId = $v.Id.ToString()
            State = $v.State.ToString()
            CPUCount = $v.ProcessorCount
            CPUUsage = $v.CPUUsage
            RAMMB = [math]::Round($v.MemoryStartup / 1MB)
            RAMAssignedMB = [math]::Round($v.MemoryAssigned / 1MB)
            Uptime = if ($v.Uptime) { $v.Uptime.ToString() } else { "00:00:00" }
            IPAddresses = $IPs
        }
    }

    if ($VMName -and ($List.Count -eq 1)) {
        Write-Output ($List[0] | ConvertTo-Json -Compress)
    } else {
        Write-Output ($List | ConvertTo-Json -Compress)
    }
    exit 0
}
catch {
    Write-Error "Failed to get VM status: $_"
    exit 1
}
