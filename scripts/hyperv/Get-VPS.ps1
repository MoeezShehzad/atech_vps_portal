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

        # Real-time resource metering and telemetry
        $Measure = $null
        try {
            if (-not $v.ResourceMeteringEnabled) {
                Enable-VMResourceMetering -VMName $v.Name -ErrorAction SilentlyContinue
            }
            $Measure = Measure-VM -VMName $v.Name -ErrorAction SilentlyContinue
        } catch {}

        # VHD Disk metrics
        $VHD = $null
        try {
            $VHD = $v.HardDrives | Get-VHD -ErrorAction SilentlyContinue | Select-Object -First 1
        } catch {}

        $RamAssigned = [math]::Round($v.MemoryAssigned / 1MB)
        $RamDemand = [math]::Round($v.MemoryDemand / 1MB)
        $RamStartup = [math]::Round($v.MemoryStartup / 1MB)
        $RamTotal = if ($RamAssigned -gt 0) { $RamAssigned } else { $RamStartup }
        $RamUsed = if ($RamDemand -gt 0) { $RamDemand } else { $RamAssigned }
        $RamPct = if ($RamTotal -gt 0) { [math]::Round(($RamUsed / $RamTotal) * 100) } else { 0 }

        $DiskTotal = if ($VHD -and $VHD.Size) { [math]::Round($VHD.Size / 1GB, 1) } else { 0 }
        $DiskUsed = if ($VHD -and $VHD.FileSize) { [math]::Round($VHD.FileSize / 1GB, 1) } else { 0 }
        $DiskPct = if ($DiskTotal -gt 0) { [math]::Round(($DiskUsed / $DiskTotal) * 100) } else { 0 }

        $AvgCpu = if ($Measure -and $Measure.AverageProcessorUsage -ne $null) { [int]$Measure.AverageProcessorUsage } else { [int]$v.CPUUsage }
        $DiskRead = if ($Measure) { [math]::Round($Measure.AggregatedDiskDataRead / 1MB, 2) } else { 0 }
        $DiskWrite = if ($Measure) { [math]::Round($Measure.AggregatedDiskDataWritten / 1MB, 2) } else { 0 }

        $List += @{
            Found = $true
            VMName = $v.Name
            VMId = $v.Id.ToString()
            State = $v.State.ToString()
            Status = $v.Status
            CPUCount = $v.ProcessorCount
            CPUUsage = [int]$v.CPUUsage
            AvgCPU = $AvgCpu
            RAMMB = $RamStartup
            RAMAssignedMB = $RamAssigned
            RAMTotalMB = $RamTotal
            RAMUsedMB = $RamUsed
            RAMPercent = $RamPct
            DiskTotalGB = $DiskTotal
            DiskUsedGB = $DiskUsed
            DiskPercent = $DiskPct
            DiskReadMB = $DiskRead
            DiskWriteMB = $DiskWrite
            Heartbeat = if ($v.Heartbeat) { $v.Heartbeat.ToString() } else { "Unknown" }
            Uptime = if ($v.Uptime) { $v.Uptime.ToString() } else { "00:00:00" }
            IPAddresses = $IPs
            Timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        }
    }

    if ($VMName -and ($List.Count -eq 1)) {
        Write-Output ($List[0] | ConvertTo-Json -Compress)
    } elseif ($List.Count -eq 1) {
        # Force JSON array format for single item when listing all VMs
        $SingleJson = $List[0] | ConvertTo-Json -Compress
        Write-Output "[$SingleJson]"
    } else {
        Write-Output ($List | ConvertTo-Json -Compress)
    }
    exit 0
}
catch {
    Write-Error "Failed to get VM status: $_"
    exit 1
}
