# ==============================================================================
# Script: Create-Volume.ps1
# Purpose: Provision a raw Dynamic VHDX secondary volume on Synology NAS (E:\)
#          with Physical Free-Space LUN Lockout Guard, iSCSI 60s Timeout Tuning,
#          and Storage QoS (MaximumIOPS) noisy-neighbor protection.
# ==============================================================================

param (
    [Parameter(Mandatory=$true)][string]$VolumeName,
    [Parameter(Mandatory=$true)][int]$UserId,
    [Parameter(Mandatory=$true)][int]$SizeGB,
    [Parameter(Mandatory=$false)][string]$VolumesRoot = "E:\STORAGE-VOLUMES",
    [Parameter(Mandatory=$false)][string]$VMName = "",
    [Parameter(Mandatory=$false)][int]$MaxIOPS = 3000
)

$ErrorActionPreference = "Stop"

try {
    # Protection #4B: Ensure Windows Host Disk TimeOutValue is >= 60s to prevent Synology iSCSI micro-stutter VM pauses
    try {
        $DiskRegPath = "HKLM:\SYSTEM\CurrentControlSet\Services\Disk"
        $CurrentTimeout = (Get-ItemProperty -Path $DiskRegPath -Name "TimeOutValue" -ErrorAction SilentlyContinue).TimeOutValue
        if (-not $CurrentTimeout -or $CurrentTimeout -lt 60) {
            Set-ItemProperty -Path $DiskRegPath -Name "TimeOutValue" -Value 60 -Type DWord -ErrorAction SilentlyContinue
        }
    } catch {}

    $Qualifier = Split-Path -Path $VolumesRoot -Qualifier
    if (-not (Test-Path $Qualifier)) {
        Write-Warning "Drive for '$VolumesRoot' not found; falling back to D:\STORAGE-VOLUMES"
        $VolumesRoot = "D:\STORAGE-VOLUMES"
        $Qualifier = "D:"
    }

    # Protection #4A: Physical Synology iSCSI LUN Free-Space Guard (prevents 100% full LUN Read-Only lockout)
    $DriveLetter = $Qualifier.TrimEnd(':')
    $PsDrive = Get-PSDrive -Name $DriveLetter -ErrorAction SilentlyContinue
    if ($PsDrive -and $PsDrive.Free) {
        $FreeGB = [math]::Round($PsDrive.Free / 1GB, 2)
        $TotalPhysicalGB = [math]::Round(($PsDrive.Used + $PsDrive.Free) / 1GB, 2)
        $FreePercent = if ($TotalPhysicalGB -gt 0) { [math]::Round(($FreeGB / $TotalPhysicalGB) * 100, 1) } else { 100 }
        if ($FreeGB -lt 0.5 -or $FreePercent -lt 5) {
            Write-Error "SYNOLOGY_LUN_CAPACITY_GUARD: Physical storage array ($Qualifier) has reached safety threshold ($FreeGB GB free / $FreePercent%). Provisioning paused to protect LUN integrity."
            exit 1
        }
    }

    $UserVolumeDir = Join-Path -Path $VolumesRoot -ChildPath "user_$UserId"
    New-Item -Path $UserVolumeDir -ItemType Directory -Force | Out-Null

    $SafeFileName = if ($VolumeName.ToLower().EndsWith(".vhdx")) { $VolumeName } else { "$VolumeName.vhdx" }
    $VhdxPath = Join-Path -Path $UserVolumeDir -ChildPath $SafeFileName

    if (-not (Test-Path $VhdxPath)) {
        $TargetBytes = [int64]$SizeGB * 1GB
        New-VHD -Path $VhdxPath -SizeBytes $TargetBytes -Dynamic | Out-Null
        Write-Output "[VOLUME] Created raw Dynamic VHDX ($SizeGB GB) at $VhdxPath"
    } else {
        Write-Output "[VOLUME] Using existing VHDX at $VhdxPath"
    }

    $BusInfo = "Unattached (Available)"
    $AttachedTo = ""
    $ControllerNumber = -1
    $ControllerLocation = -1

    if ($VMName -and $VMName.Trim() -ne "") {
        $VM = Get-VM -Name $VMName -ErrorAction SilentlyContinue
        if ($VM) {
            $ExistingDrive = Get-VMHardDiskDrive -VMName $VMName | Where-Object { $_.Path -ieq $VhdxPath } | Select-Object -First 1
            if (-not $ExistingDrive) {
                $Drive = Add-VMHardDiskDrive -VMName $VMName -Path $VhdxPath -ControllerType SCSI -Passthru
                if ($MaxIOPS -gt 0) {
                    Set-VMHardDiskDrive -VMHardDiskDrive $Drive -MaximumIOPS $MaxIOPS -ErrorAction SilentlyContinue
                }
                $ControllerNumber = $Drive.ControllerNumber
                $ControllerLocation = $Drive.ControllerLocation
                $BusInfo = "SCSI Controller ($ControllerNumber`:$ControllerLocation)"
            } else {
                $ControllerNumber = $ExistingDrive.ControllerNumber
                $ControllerLocation = $ExistingDrive.ControllerLocation
                $BusInfo = "SCSI Controller ($ControllerNumber`:$ControllerLocation)"
            }
            $AttachedTo = $VMName
            Write-Output "[VOLUME] Attached $VhdxPath to VM '$VMName' on $BusInfo (QoS: $MaxIOPS Max IOPS)"
        }
    }

    $ResultObj = @{
        Status = "SUCCESS"
        Action = "CREATE_VOLUME"
        VolumeName = $VolumeName
        VhdxPath = $VhdxPath
        SizeGB = $SizeGB
        AttachedVM = $AttachedTo
        BusInfo = $BusInfo
        ControllerNumber = $ControllerNumber
        ControllerLocation = $ControllerLocation
        MaxIOPS = $MaxIOPS
        Timestamp = (Get-Date).ToString('o')
    }

    Write-Output ($ResultObj | ConvertTo-Json -Compress)
    exit 0
}
catch {
    Write-Error "Failed to create volume '$VolumeName': $_"
    exit 1
}
