# ==============================================================================
# Script: Detach-Volume.ps1
# Purpose: Safely detach a secondary VHDX volume from a Hyper-V VM WITHOUT
#          deleting the underlying .vhdx file on Synology NAS (E:\).
#          Includes Protection #3: Active Snapshot (.avhdx) Chain Lock Detection.
# ==============================================================================

param (
    [Parameter(Mandatory=$true)][string]$VMName,
    [Parameter(Mandatory=$true)][string]$VhdxPath
)

$ErrorActionPreference = "Stop"

try {
    $VM = Get-VM -Name $VMName -ErrorAction SilentlyContinue
    if ($VM) {
        $AllDrives = Get-VMHardDiskDrive -VMName $VMName -ErrorAction SilentlyContinue

        # Protection #3: Check if this volume is currently locked by an active Hyper-V Snapshot (.avhdx differencing chain)
        $BaseNameWithoutExt = [System.IO.Path]::GetFileNameWithoutExtension($VhdxPath)
        $AvhdxLock = $AllDrives | Where-Object {
            $_.Path -and $_.Path.ToLower().EndsWith(".avhdx") -and $_.Path.ToLower().Contains($BaseNameWithoutExt.ToLower())
        } | Select-Object -First 1

        if ($AvhdxLock) {
            Write-Error "SNAPSHOT_AVHDX_LOCK: Cannot detach volume while an active VM Snapshot/Checkpoint is locking its write chain ($($AvhdxLock.Path)). Please delete or merge your VM snapshot first so all recent writes are saved to your NAS volume."
            exit 1
        }

        $TargetDrive = $AllDrives | Where-Object { $_.Path -ieq $VhdxPath }
        if ($TargetDrive) {
            foreach ($Drive in $TargetDrive) {
                Remove-VMHardDiskDrive -VMHardDiskDrive $Drive -ErrorAction Stop
                Write-Output "[VOLUME] Safely detached '$VhdxPath' from VM '$VMName' (data preserved on disk)"
            }
        } else {
            Write-Output "[VOLUME] Volume '$VhdxPath' was not attached to VM '$VMName'"
        }
    } else {
        Write-Output "[VOLUME] VM '$VMName' not found in Hyper-V; marking volume as detached"
    }

    $ResultObj = @{
        Status = "SUCCESS"
        Action = "DETACH_VOLUME"
        VMName = $VMName
        VhdxPath = $VhdxPath
        BusInfo = "Unattached (Available)"
        Timestamp = (Get-Date).ToString('o')
    }

    Write-Output ($ResultObj | ConvertTo-Json -Compress)
    exit 0
}
catch {
    Write-Error "Failed to detach volume '$VhdxPath' from VM '$VMName': $_"
    exit 1
}
