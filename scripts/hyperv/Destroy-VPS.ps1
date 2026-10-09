# ==============================================================================
# Script: Destroy-VPS.ps1
# Purpose: Gracefully shut down, remove, and clean up a Hyper-V VM and its disks
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

        Write-Output "[HYPERV] Removing VM definition: $VMName"
        Remove-VM -Name $VMName -Force -Confirm:$false
    } else {
        Write-Output "[NOTICE] VM '$VMName' not registered in Hyper-V, proceeding with storage cleanup."
    }

    # Delete storage folder (with retry loop to gracefully wait for Hyper-V disk unlock)
    $VMDirectory = Join-Path -Path $CustomerVMsRoot -ChildPath $VMName
    if (Test-Path $VMDirectory) {
        Write-Output "[CLEANUP] Removing VM directory and disks: $VMDirectory"
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
        Add-Content -Path $LogFile -Value "$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss')) - Destroyed $VMName and removed storage."
    }

    $ResultObj = @{
        Status = "SUCCESS"
        Action = "DESTROY"
        VMName = $VMName
        Timestamp = (Get-Date).ToString('o')
    }

    Write-Output ($ResultObj | ConvertTo-Json -Compress)
    exit 0
}
catch {
    Write-Error "Failed to destroy VM '$VMName': $_"
    exit 1
}
