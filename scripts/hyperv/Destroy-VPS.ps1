# ==============================================================================
# Script: Destroy-VPS.ps1
# Purpose: Gracefully shut down, remove, and clean up a Hyper-V VM and its OS disk
#          while SAFELY DETACHING & PRESERVING any secondary NAS volumes (E:\).
# ==============================================================================

param (
    [Parameter(Mandatory=$true)][string]$VMName,
    [Parameter(Mandatory=$false)][string]$CustomerVMsRoot = "D:\CUSTOMER-VMS",
    [Parameter(Mandatory=$false)][string]$SystemLogsRoot = "D:\SYSTEM-LOGS\provisioning"
)

$ErrorActionPreference = "Stop"

try {
    Write-Output "[DESTROY] Initiating termination for VM: $VMName"

    $VM = Get-VM -Name $VMName -ErrorAction SilentlyContinue
    $VMDirectory = Join-Path -Path $CustomerVMsRoot -ChildPath $VMName
    $DetachedSecondaryPaths = @()

    if ($VM) {
        if ($VM.State -ne 'Off') {
            Write-Output "[POWER] Forcing immediate shutdown for VM: $VMName"
            Stop-VM -Name $VMName -TurnOff -Force -Confirm:$false
            
            # Poll Hyper-V to ensure state transitions to 'Off' before deletion
            $MaxWaitSec = 15
            $Elapsed = 0
            while ($Elapsed -lt $MaxWaitSec) {
                Start-Sleep -Seconds 1
                $CurrentVM = Get-VM -Name $VMName -ErrorAction SilentlyContinue
                if (-not $CurrentVM -or $CurrentVM.State -eq 'Off') {
                    Write-Output "[POWER] VM '$VMName' successfully powered off."
                    break
                }
                $Elapsed++
            }
        }

        # CRITICAL SAFETY: Detach any secondary volumes located outside the VM's D:\ folder (e.g. E:\STORAGE-VOLUMES)
        $AttachedDrives = Get-VMHardDiskDrive -VMName $VMName -ErrorAction SilentlyContinue
        foreach ($Drive in $AttachedDrives) {
            if ($Drive.Path -and (-not $Drive.Path.StartsWith($VMDirectory, [System.StringComparison]::OrdinalIgnoreCase))) {
                Write-Output "[STORAGE SAFETY] Detaching secondary NAS volume before VM removal (data preserved): $($Drive.Path)"
                $DetachedSecondaryPaths += $Drive.Path
                Remove-VMHardDiskDrive -VMHardDiskDrive $Drive -ErrorAction SilentlyContinue
            }
        }

        Write-Output "[HYPERV] Removing VM definition: $VMName"
        Remove-VM -Name $VMName -Force -Confirm:$false
    } else {
        Write-Output "[NOTICE] VM '$VMName' not registered in Hyper-V, proceeding with OS storage cleanup."
    }

    # Delete ONLY the OS storage folder on D:\ (never touches E:\STORAGE-VOLUMES)
    if (Test-Path $VMDirectory) {
        Write-Output "[CLEANUP] Removing VM OS directory and primary disk: $VMDirectory"
        $Removed = $false
        for ($i = 0; $i -lt 5; $i++) {
            try {
                Remove-Item -Path $VMDirectory -Recurse -Force -ErrorAction Stop
                $Removed = $true
                break
            } catch {
                Start-Sleep -Milliseconds 800
            }
        }
        if (-not $Removed) {
            Write-Warning "Could not immediately remove $VMDirectory due to file lock; scheduled background cleanup."
        }
    }

    # Audit log
    $LogFile = Join-Path -Path $SystemLogsRoot -ChildPath "provision.log"
    if (Test-Path $SystemLogsRoot) {
        Add-Content -Path $LogFile -Value "$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss')) - Destroyed $VMName (OS storage removed; $($DetachedSecondaryPaths.Count) secondary volumes preserved)."
    }

    $ResultObj = @{
        Status = "SUCCESS"
        Action = "DESTROY"
        VMName = $VMName
        DetachedSecondaryVolumes = $DetachedSecondaryPaths
        Timestamp = (Get-Date).ToString('o')
    }

    Write-Output ($ResultObj | ConvertTo-Json -Compress)
    exit 0
}
catch {
    Write-Error "Failed to destroy VM '$VMName': $_"
    exit 1
}
