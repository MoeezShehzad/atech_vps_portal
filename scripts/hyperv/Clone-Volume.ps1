# ==============================================================================
# Script: Clone-Volume.ps1
# Purpose: Create a 1-click point-in-time clone / backup copy of a Synology NAS
#          volume on E:\STORAGE-VOLUMES
# ==============================================================================

param (
    [Parameter(Mandatory=$true)][string]$SourceVhdxPath,
    [Parameter(Mandatory=$true)][string]$NewVolumeName,
    [Parameter(Mandatory=$true)][int]$UserId,
    [Parameter(Mandatory=$false)][string]$VolumesRoot = "E:\STORAGE-VOLUMES"
)

$ErrorActionPreference = "Stop"

try {
    if (-not (Test-Path $SourceVhdxPath)) {
        Write-Error "Source volume VHDX file not found at '$SourceVhdxPath'!"
        exit 1
    }

    if (-not (Test-Path (Split-Path -Path $VolumesRoot -Qualifier))) {
        $VolumesRoot = "D:\STORAGE-VOLUMES"
    }

    $UserVolumeDir = Join-Path -Path $VolumesRoot -ChildPath "user_$UserId"
    New-Item -Path $UserVolumeDir -ItemType Directory -Force | Out-Null

    $SafeFileName = if ($NewVolumeName.ToLower().EndsWith(".vhdx")) { $NewVolumeName } else { "$NewVolumeName.vhdx" }
    $DestVhdxPath = Join-Path -Path $UserVolumeDir -ChildPath $SafeFileName

    Copy-Item -Path $SourceVhdxPath -Destination $DestVhdxPath -Force

    $ResultObj = @{
        Status = "SUCCESS"
        Action = "CLONE_VOLUME"
        SourceVhdxPath = $SourceVhdxPath
        VhdxPath = $DestVhdxPath
        Timestamp = (Get-Date).ToString('o')
    }

    Write-Output ($ResultObj | ConvertTo-Json -Compress)
    exit 0
}
catch {
    Write-Error "Failed to clone volume '$SourceVhdxPath': $_"
    exit 1
}
