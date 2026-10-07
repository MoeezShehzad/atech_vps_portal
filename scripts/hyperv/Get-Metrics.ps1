# ==============================================================================
# Script: Get-Metrics.ps1
# Purpose: Real-time Hyper-V CPU, Memory, Disk, and Health Metrics for a VPS
# ==============================================================================

param (
    [Parameter(Mandatory=$true)][string]$VMName
)

$ErrorActionPreference = "Stop"

try {
    $VM = Get-VM -Name $VMName -ErrorAction SilentlyContinue
    if (-not $VM) {
        Write-Output (@{ Found = $false; VMName = $VMName } | ConvertTo-Json -Compress)
        exit 0
    }

    # Enable Resource Metering if not already turned on
    try {
        if (-not $VM.ResourceMeteringEnabled) {
            Enable-VMResourceMetering -VMName $VMName -ErrorAction SilentlyContinue
        }
    } catch {}

    $Measure = $null
    try {
        $Measure = Measure-VM -VMName $VMName -ErrorAction SilentlyContinue
    } catch {}

    # Query Disk (VHDX) properties
    $VHD = $null
    try {
        $VHD = $VM.HardDrives | Get-VHD -ErrorAction SilentlyContinue | Select-Object -First 1
    } catch {}

    # CPU Calculation (Get-VM CPUUsage is direct 0-100% guest CPU percentage; Measure-VM is raw MHz)
    $CpuUsage = [math]::Min(100, [math]::Max(0, [int]$VM.CPUUsage))
    $AvgCpu = $CpuUsage

    # RAM Calculation
    $RamAssignedMB = [math]::Round($VM.MemoryAssigned / 1MB)
    $RamDemandMB = [math]::Round($VM.MemoryDemand / 1MB)
    $RamStartupMB = [math]::Round($VM.MemoryStartup / 1MB)
    $RamUsedMB = if ($RamDemandMB -gt 0) { $RamDemandMB } else { $RamAssignedMB }
    $RamTotalMB = if ($RamAssignedMB -gt 0) { $RamAssignedMB } else { $RamStartupMB }
    $RamPercent = if ($RamTotalMB -gt 0) {
        [math]::Round(($RamUsedMB / $RamTotalMB) * 100)
    } else {
        0
    }

    # Disk Calculation
    $DiskTotalGB = if ($VHD -and $VHD.Size) { [math]::Round($VHD.Size / 1GB, 1) } else { 0 }
    $DiskUsedGB = if ($VHD -and $VHD.FileSize) { [math]::Round($VHD.FileSize / 1GB, 1) } else { 0 }
    $DiskPercent = if ($DiskTotalGB -gt 0) {
        [math]::Round(($DiskUsedGB / $DiskTotalGB) * 100)
    } else {
        0
    }

    # Disk IO
    $DiskReadMB = if ($Measure) { [math]::Round($Measure.AggregatedDiskDataRead / 1MB, 2) } else { 0 }
    $DiskWriteMB = if ($Measure) { [math]::Round($Measure.AggregatedDiskDataWritten / 1MB, 2) } else { 0 }

    # Network / IP
    $Net = Get-VMNetworkAdapter -VMName $VMName -ErrorAction SilentlyContinue
    $IPs = @()
    if ($Net -and $Net.IPAddresses) {
        $IPs = @($Net.IPAddresses | Where-Object { $_ -notlike '*:*' })
    }
    if (-not $IPs -and $Net -and $Net.MacAddress) {
        $MacFormatted = [regex]::Replace($Net.MacAddress, '..(?!$)', '$&-').ToLower()
        $Neighbor = Get-NetNeighbor -ErrorAction SilentlyContinue | Where-Object { $_.LinkLayerAddress -and ($_.LinkLayerAddress.ToLower() -eq $MacFormatted) }
        if ($Neighbor) {
            $IPs = @($Neighbor | ForEach-Object { $_.IPAddress } | Where-Object { $_ -notlike '*:*' })
        }
    }

    $Metrics = @{
        Found = $true
        VMName = $VM.Name
        VMId = $VM.Id.ToString()
        State = $VM.State.ToString()
        Status = $VM.Status
        Uptime = if ($VM.Uptime) { $VM.Uptime.ToString() } else { "00:00:00" }
        ProcessorCount = $VM.ProcessorCount
        CPUUsage = $CpuUsage
        AvgCPU = $AvgCpu
        RAMTotalMB = $RamTotalMB
        RAMUsedMB = $RamUsedMB
        RAMPercent = $RamPercent
        DiskTotalGB = $DiskTotalGB
        DiskUsedGB = $DiskUsedGB
        DiskPercent = $DiskPercent
        DiskReadMB = $DiskReadMB
        DiskWriteMB = $DiskWriteMB
        IPAddresses = $IPs
        Heartbeat = if ($VM.Heartbeat) { $VM.Heartbeat.ToString() } else { "Unknown" }
        Timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    }

    Write-Output ($Metrics | ConvertTo-Json -Compress)
    exit 0
}
catch {
    Write-Error "Failed to collect metrics for VM '$VMName': $_"
    exit 1
}
