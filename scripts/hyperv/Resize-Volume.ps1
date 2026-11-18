# ==============================================================================
# Script: Resize-Volume.ps1
# Purpose: Expand an existing secondary VHDX volume on Synology NAS (E:\)
#          with Physical Free-Space LUN Lockout Guard.
# ==============================================================================

param (
    [Parameter(Mandatory=$true)][string]$VhdxPath,
    [Parameter(Mandatory=$true)][int]$SizeGB
)

$ErrorActionPreference = "Stop"

try {
    if (-not (Test-Path $VhdxPath)) {
        Write-Error "Volume VHDX file not found at '$VhdxPath'!"
        exit 1
    }

    # Protection #4A: Physical Synology iSCSI LUN Free-Space Guard
    $Qualifier = Split-Path -Path $VhdxPath -Qualifier
    if ($Qualifier) {
        $DriveLetter = $Qualifier.TrimEnd(':')
        $PsDrive = Get-PSDrive -Name $DriveLetter -ErrorAction SilentlyContinue
        if ($PsDrive -and $PsDrive.Free) {
            $FreeGB = [math]::Round($PsDrive.Free / 1GB, 2)
            $TotalPhysicalGB = [math]::Round(($PsDrive.Used + $PsDrive.Free) / 1GB, 2)
            $FreePercent = if ($TotalPhysicalGB -gt 0) { [math]::Round(($FreeGB / $TotalPhysicalGB) * 100, 1) } else { 100 }
            if ($FreeGB -lt 0.5 -or $FreePercent -lt 5) {
                Write-Error "SYNOLOGY_LUN_CAPACITY_GUARD: Physical storage array ($Qualifier) has reached safety threshold ($FreeGB GB free / $FreePercent%). Expansion paused to prevent LUN lockout."
                exit 1
            }
        }
    }

    $CurrentVHD = Get-VHD -Path $VhdxPath
    $TargetBytes = [int64]$SizeGB * 1GB

    if ($TargetBytes -gt $CurrentVHD.Size) {
        Write-Output "[VOLUME] Expanding volume '$VhdxPath' from $([math]::Round($CurrentVHD.Size / 1GB)) GB to $SizeGB GB"
        Resize-VHD -Path $VhdxPath -SizeBytes $TargetBytes
    } else {
        Write-Output "[VOLUME] Target size ($SizeGB GB) is equal or smaller than current ($([math]::Round($CurrentVHD.Size / 1GB)) GB); skipped."
    }

    $ResultObj = @{
        Status = "SUCCESS"
        Action = "RESIZE_VOLUME"
        VhdxPath = $VhdxPath
        SizeGB = $SizeGB
        Timestamp = (Get-Date).ToString('o')
    }

    Write-Output ($ResultObj | ConvertTo-Json -Compress)
    exit 0
}
catch {
    Write-Error "Failed to resize volume '$VhdxPath': $_"
    exit 1
}
