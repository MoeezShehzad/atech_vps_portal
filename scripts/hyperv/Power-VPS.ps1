# ==============================================================================
# Script: Power-VPS.ps1
# Purpose: Start, Stop, or Restart a Hyper-V VM (Instant & Non-interactive)
# ==============================================================================

param (
    [Parameter(Mandatory=$true)][string]$VMName,
    [Parameter(Mandatory=$true)][ValidateSet("START", "STOP", "RESTART", "FORCE_STOP", "PAUSE", "RESUME")][string]$Action
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
            if ($VM.State -eq "Paused") {
                Resume-VM -Name $VMName -Confirm:$false -ErrorAction Stop
            } elseif ($VM.State -ne "Running") {
                Start-VM -Name $VMName -Confirm:$false -ErrorAction Stop
            }
        }
        "STOP" {
            if ($VM.State -ne "Off") {
                try {
                    Stop-VM -Name $VMName -TurnOff -Force -Confirm:$false -ErrorAction Stop
                } catch {
                    Start-Sleep -Milliseconds 500
                    Stop-VM -Name $VMName -TurnOff -Force -Confirm:$false -ErrorAction SilentlyContinue
                }
            }
        }
        "FORCE_STOP" {
            if ($VM.State -ne "Off") {
                Stop-VM -Name $VMName -TurnOff -Force -Confirm:$false -ErrorAction SilentlyContinue
            }
        }
        "RESTART" {
            if ($VM.State -eq "Running") {
                Restart-VM -Name $VMName -Force -Confirm:$false -ErrorAction Stop
            } elseif ($VM.State -eq "Paused") {
                Resume-VM -Name $VMName -Confirm:$false -ErrorAction Stop
                Restart-VM -Name $VMName -Force -Confirm:$false -ErrorAction Stop
            } else {
                Start-VM -Name $VMName -Confirm:$false -ErrorAction Stop
            }
        }
        "PAUSE" {
            if ($VM.State -eq "Running") {
                Suspend-VM -Name $VMName -Confirm:$false -ErrorAction Stop
            }
        }
        "RESUME" {
            if ($VM.State -eq "Paused") {
                Resume-VM -Name $VMName -Confirm:$false -ErrorAction Stop
            }
        }
    }

    $StateStr = switch ($Action) {
        "PAUSE"   { "Paused" }
        "RESUME"  { "Running" }
        "START"   { "Running" }
        "RESTART" { "Running" }
        default   { "Off" }
    }
    $ResultObj = @{
        Status = "SUCCESS"
        Action = $Action
        VMName = $VMName
        State  = $StateStr
    }

    Write-Output ($ResultObj | ConvertTo-Json -Compress)
    exit 0
}
catch {
    Write-Error "Failed to execute '$Action' on VM '$VMName': $_"
    exit 1
}
