# ==============================================================================
# Script: Snapshot-VPS.ps1
# Purpose: Create, list, restore, and delete Hyper-V Checkpoints (Snapshots)
#          Routed to Secondary Synology NAS Storage (E:\SYNOLOGY-SNAPSHOTS)
# ==============================================================================

param (
    [Parameter(Mandatory=$true)]
    [string]$VMName,

    [Parameter(Mandatory=$true)]
    [ValidateSet("CREATE", "LIST", "RESTORE", "DELETE")]
    [string]$Action,

    [Parameter(Mandatory=$false)]
    [string]$SnapshotName = "",

    [Parameter(Mandatory=$false)]
    [string]$SnapshotsRoot = "E:\SYNOLOGY-SNAPSHOTS"
)

$ErrorActionPreference = "Stop"

try {
    $vm = Get-VM -Name $VMName -ErrorAction SilentlyContinue
    if (-not $vm) {
        Write-Output "[]"
        exit 0
    }

    switch ($Action.ToUpper()) {
        "CREATE" {
            # Ensure snapshot files are stored on the Synology NAS (E:\) if available
            if (Test-Path (Split-Path -Path $SnapshotsRoot -Qualifier)) {
                $VmNasSnapDir = Join-Path -Path $SnapshotsRoot -ChildPath $VMName
                New-Item -Path $VmNasSnapDir -ItemType Directory -Force | Out-Null
                Set-VM -Name $VMName -SnapshotFileLocation $VmNasSnapDir -ErrorAction SilentlyContinue
            }

            $snapName = if ([string]::IsNullOrWhiteSpace($SnapshotName)) { "Snapshot_$(Get-Date -Format 'yyyyMMdd_HHmmss')" } else { $SnapshotName }
            Checkpoint-VM -Name $VMName -SnapshotName $snapName
            $created = Get-VMSnapshot -VMName $VMName -Name $snapName | Select-Object -First 1
            $result = @{
                status = "SUCCESS"
                vmName = $VMName
                snapshotName = $snapName
                storageLocation = "Synology NAS (E:\SYNOLOGY-SNAPSHOTS\$VMName)"
                createdAt = (Get-Date -Date $created.CreationTime -Format "o")
                id = $created.Id.ToString()
            }
            Write-Output ($result | ConvertTo-Json -Compress)
        }

        "LIST" {
            $snapshots = Get-VMSnapshot -VMName $VMName -ErrorAction SilentlyContinue
            if (-not $snapshots) {
                Write-Output "[]"
                exit 0
            }

            $list = @()
            foreach ($s in $snapshots) {
                $list += @{
                    id = $s.Id.ToString()
                    snapshotName = $s.Name
                    createdAt = (Get-Date -Date $s.CreationTime -Format "o")
                    snapshotType = $s.SnapshotType.ToString()
                    storageLocation = "Synology NAS (E:\SYNOLOGY-SNAPSHOTS\$VMName)"
                }
            }
            Write-Output ($list | ConvertTo-Json -Compress)
        }

        "RESTORE" {
            if ([string]::IsNullOrWhiteSpace($SnapshotName)) {
                throw "SnapshotName is required for RESTORE action"
            }
            Restore-VMSnapshot -VMName $VMName -Name $SnapshotName -Confirm:$false
            $result = @{
                status = "SUCCESS"
                action = "RESTORE"
                vmName = $VMName
                snapshotName = $SnapshotName
            }
            Write-Output ($result | ConvertTo-Json -Compress)
        }

        "DELETE" {
            if ([string]::IsNullOrWhiteSpace($SnapshotName)) {
                throw "SnapshotName is required for DELETE action"
            }
            Remove-VMSnapshot -VMName $VMName -Name $SnapshotName -Confirm:$false
            $result = @{
                status = "SUCCESS"
                action = "DELETE"
                vmName = $VMName
                snapshotName = $SnapshotName
            }
            Write-Output ($result | ConvertTo-Json -Compress)
        }
    }
} catch {
    $errObj = @{
        status = "FAILED"
        error = $_.Exception.Message
    }
    Write-Output ($errObj | ConvertTo-Json -Compress)
    exit 1
}
