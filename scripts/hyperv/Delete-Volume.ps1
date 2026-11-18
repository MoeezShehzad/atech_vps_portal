# ==============================================================================
# Script: Delete-Volume.ps1
# Purpose: Permanently delete a secondary VHDX volume from Synology NAS (E:\)
#          (Only called when a customer explicitly deletes the volume itself)
# ==============================================================================

param (
    [Parameter(Mandatory=$true)][string]$VhdxPath,
    [Parameter(Mandatory=$false)][string]$VMName = ""
)

$ErrorActionPreference = "Stop"

try {
    # Ensure it is detached from any VM before deleting the file
    if ($VMName -and $VMName.Trim() -ne "") {
        $VM = Get-VM -Name $VMName -ErrorAction SilentlyContinue
        if ($VM) {
            $Drives = Get-VMHardDiskDrive -VMName $VMName -ErrorAction SilentlyContinue | Where-Object { $_.Path -ieq $VhdxPath }
            foreach ($Drive in $Drives) {
                Remove-VMHardDiskDrive -VMHardDiskDrive $Drive -ErrorAction SilentlyContinue
            }
        }
    } else {
        $AllVMs = Get-VM -ErrorAction SilentlyContinue
        foreach ($CheckVM in $AllVMs) {
            $Drives = Get-VMHardDiskDrive -VMName $CheckVM.Name -ErrorAction SilentlyContinue | Where-Object { $_.Path -ieq $VhdxPath }
            foreach ($Drive in $Drives) {
                Remove-VMHardDiskDrive -VMHardDiskDrive $Drive -ErrorAction SilentlyContinue
            }
        }
    }

    if (Test-Path $VhdxPath) {
        Remove-Item -Path $VhdxPath -Force -ErrorAction Stop
        Write-Output "[VOLUME] Permanently deleted volume file: $VhdxPath"
    }

    $ResultObj = @{
        Status = "SUCCESS"
        Action = "DELETE_VOLUME"
        VhdxPath = $VhdxPath
        Timestamp = (Get-Date).ToString('o')
    }

    Write-Output ($ResultObj | ConvertTo-Json -Compress)
    exit 0
}
catch {
    Write-Error "Failed to delete volume '$VhdxPath': $_"
    exit 1
}
