# ==============================================================================
# Script: Attach-Volume.ps1
# Purpose: Hot-attach an existing secondary VHDX volume (E:\) to a Hyper-V VM
#          with Storage QoS (MaximumIOPS) protection.
# ==============================================================================

param (
    [Parameter(Mandatory=$true)][string]$VMName,
    [Parameter(Mandatory=$true)][string]$VhdxPath,
    [Parameter(Mandatory=$false)][int]$MaxIOPS = 3000
)

$ErrorActionPreference = "Stop"

try {
    if (-not (Test-Path $VhdxPath)) {
        Write-Error "Volume VHDX file not found at '$VhdxPath'!"
        exit 1
    }

    $ExistingOnTarget = Get-VMHardDiskDrive -VMName $VMName -ErrorAction SilentlyContinue | Where-Object { $_.Path -ieq $VhdxPath } | Select-Object -First 1
    if ($ExistingOnTarget) {
        $BusInfo = "SCSI Controller ($($ExistingOnTarget.ControllerNumber):$($ExistingOnTarget.ControllerLocation))"
        $ResultObj = @{
            Status = "SUCCESS"
            Action = "ATTACH_VOLUME"
            VMName = $VMName
            VhdxPath = $VhdxPath
            BusInfo = $BusInfo
        }
        Write-Output ($ResultObj | ConvertTo-Json -Compress)
        exit 0
    }

    $Drive = Add-VMHardDiskDrive -VMName $VMName -Path $VhdxPath -ControllerType SCSI -Passthru
    if ($MaxIOPS -gt 0) {
        Set-VMHardDiskDrive -VMHardDiskDrive $Drive -MaximumIOPS $MaxIOPS -ErrorAction SilentlyContinue
    }
    $BusInfo = "SCSI Controller ($($Drive.ControllerNumber):$($Drive.ControllerLocation))"
    Write-Output "[VOLUME] Attached '$VhdxPath' to '$VMName' at $BusInfo (QoS: $MaxIOPS Max IOPS)"

    $ResultObj = @{
        Status = "SUCCESS"
        Action = "ATTACH_VOLUME"
        VMName = $VMName
        VhdxPath = $VhdxPath
        BusInfo = $BusInfo
        MaxIOPS = $MaxIOPS
        Timestamp = (Get-Date).ToString('o')
    }

    Write-Output ($ResultObj | ConvertTo-Json -Compress)
    exit 0
}
catch {
    Write-Error "Failed to attach volume '$VhdxPath' to VM '$VMName': $_"
    exit 1
}
