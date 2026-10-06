# ==============================================================================
# Script: Power-VPS.ps1
# Purpose: Start, Stop, or Restart a Hyper-V VM (Instant & Non-interactive)
# ==============================================================================

param (
    [Parameter(Mandatory=$true)][string]$VMName,
    [Parameter(Mandatory=$true)][ValidateSet("START", "STOP", "RESTART", "FORCE_STOP")][string]$Action
)

$ErrorActionPreference = "Stop"

try {
    Write-Output "[POWER] Executing action '$Action' on VM: $VMName"

    $VM = Get-VM -Name $VMName -ErrorAction SilentlyContinue
    if (-not $VM) {
        Write-Error "VM '$VMName' not found in Hyper-V!"
        exit 1
    }

    switch ($Action) {
        "START" {
            if ($VM.State -ne "Running") {
                Start-VM -Name $VMName -Confirm:$false
            }
        }
        "STOP" {
            if ($VM.State -ne "Off") {
                Stop-VM -Name $VMName -TurnOff -Force -Confirm:$false
            }
        }
        "FORCE_STOP" {
            if ($VM.State -ne "Off") {
                Stop-VM -Name $VMName -TurnOff -Force -Confirm:$false
            }
        }
        "RESTART" {
            if ($VM.State -ne "Off") {
                Stop-VM -Name $VMName -TurnOff -Force -Confirm:$false
                Start-Sleep -Seconds 2
            }
            Start-VM -Name $VMName -Confirm:$false
        }
    }

    $Current = Get-VM -Name $VMName
    $ResultObj = @{
        Status = "SUCCESS"
        Action = $Action
        VMName = $VMName
        State = $Current.State.ToString()
    }

    Write-Output ($ResultObj | ConvertTo-Json -Compress)
    exit 0
}
catch {
    Write-Error "Failed to execute '$Action' on VM '$VMName': $_"
    exit 1
}
