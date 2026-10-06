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
            Write-Output "[POWER] Turning off VM: $VMName"
            Stop-VM -Name $VMName -TurnOff -Force -Confirm:$false
            Start-Sleep -Seconds 1
        }

        Write-Output "[HYPERV] Removing VM definition: $VMName"
        Remove-VM -Name $VMName -Force -Confirm:$false
    } else {
        Write-Output "[NOTICE] VM '$VMName' not registered in Hyper-V, proceeding with storage cleanup."
    }

    # Delete storage folder
    $VMDirectory = Join-Path -Path $CustomerVMsRoot -ChildPath $VMName
    if (Test-Path $VMDirectory) {
        Write-Output "[CLEANUP] Removing VM directory and disks: $VMDirectory"
        Remove-Item -Path $VMDirectory -Recurse -Force
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
