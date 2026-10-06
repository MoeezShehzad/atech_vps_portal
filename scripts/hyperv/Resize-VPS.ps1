# ==============================================================================
# Script: Resize-VPS.ps1
# Purpose: Dynamically adjust Hyper-V VM RAM, CPU Cores, and Disk Size
# ==============================================================================

param (
    [Parameter(Mandatory=$true)][string]$VMName,
    [Parameter(Mandatory=$false)][int]$RAMMB = 0,
    [Parameter(Mandatory=$false)][int]$CPUCount = 0,
    [Parameter(Mandatory=$false)][int]$DiskGB = 0,
    [Parameter(Mandatory=$false)][string]$CustomerVMsRoot = "D:\CUSTOMER-VMS"
)

$ErrorActionPreference = "Stop"

try {
    Write-Output "[RESIZE] Modifying hardware specs for VM: $VMName"

    $VM = Get-VM -Name $VMName -ErrorAction SilentlyContinue
    if (-not $VM) {
        Write-Error "VM '$VMName' not found in Hyper-V!"
        exit 1
    }

    $OriginalState = $VM.State
    $RequiresRestart = $false

    # Update RAM
    if ($RAMMB -gt 0) {
        Write-Output "[SPECS] Setting RAM to $RAMMB MB"
        # If dynamic memory disabled, changing memory may require stopping VM if hot-add is unsupported
        try {
            Set-VMMemory -VMName $VMName -StartupBytes ([int64]$RAMMB * 1MB)
        } catch {
            Write-Output "[SPECS] Memory adjustment requires brief restart; stopping VM..."
            Stop-VM -Name $VMName -Force
            Set-VMMemory -VMName $VMName -StartupBytes ([int64]$RAMMB * 1MB)
            $RequiresRestart = $true
        }
    }

    # Update CPU Count
    if ($CPUCount -gt 0) {
        Write-Output "[SPECS] Setting CPU cores to $CPUCount"
        if ($VM.State -ne 'Off') {
            Stop-VM -Name $VMName -Force
            $RequiresRestart = $true
        }
        Set-VMProcessor -VMName $VMName -Count $CPUCount
    }

    # Update Disk size (Expansion only)
    if ($DiskGB -gt 0) {
        $CustomerVHDXPath = Join-Path -Path (Join-Path -Path $CustomerVMsRoot -ChildPath $VMName) -ChildPath "Virtual Hard Disks\$VMName-disk0.vhdx"
        if (Test-Path $CustomerVHDXPath) {
            Write-Output "[DISK] Resizing disk to $DiskGB GB"
            Resize-VHD -Path $CustomerVHDXPath -SizeBytes ([int64]$DiskGB * 1GB)
        }
    }

    # Restart if it was running and needed restart
    if ($RequiresRestart -and ($OriginalState -eq 'Running')) {
        Write-Output "[POWER] Restarting VM after spec update..."
        Start-VM -Name $VMName
    }

    $UpdatedVM = Get-VM -Name $VMName
    $ResultObj = @{
        Status = "SUCCESS"
        Action = "RESIZE"
        VMName = $VMName
        CPUCount = $UpdatedVM.ProcessorCount
        RAMMB = [math]::Round($UpdatedVM.MemoryStartup / 1MB)
        State = $UpdatedVM.State.ToString()
    }

    Write-Output ($ResultObj | ConvertTo-Json -Compress)
    exit 0
}
catch {
    Write-Error "Failed to resize VM '$VMName': $_"
    exit 1
}
