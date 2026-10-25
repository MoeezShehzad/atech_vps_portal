# ==============================================================================
# Script: Create-VPS.ps1
# Purpose: Provision a new Hyper-V Generation 2 Virtual Machine with ISO / VHDX
# ==============================================================================

param (
    [Parameter(Mandatory=$true)][string]$VMName,
    [Parameter(Mandatory=$false)][int]$RAMMB = 2048,
    [Parameter(Mandatory=$false)][int]$CPUCount = 2,
    [Parameter(Mandatory=$false)][int]$DiskGB = 40,
    [Parameter(Mandatory=$false)][string]$AdminUsername = "ubuntu",
    [Parameter(Mandatory=$false)][string]$AdminPassword = "",
    [Parameter(Mandatory=$false)][string]$SSHPublicKey = "",
    [Parameter(Mandatory=$false)][string]$TemplatePath = "D:\00_Master_Template\Ubuntu Server 24.04 LTS.vhdx",
    [Parameter(Mandatory=$false)][string]$SwitchName = "Default Switch",
    [Parameter(Mandatory=$false)][string]$CustomerVMsRoot = "D:\CUSTOMER-VMS",
    [Parameter(Mandatory=$false)][string]$SystemLogsRoot = "D:\SYSTEM-LOGS\provisioning"
)

$ErrorActionPreference = "Stop"

try {
    Write-Output "[PROVISION] Starting VM creation for: $VMName"

    # 1. Validation Checks
    if (Get-VM -Name $VMName -ErrorAction SilentlyContinue) {
        Write-Error "VM '$VMName' already exists in Hyper-V!"
        exit 1
    }

    if (-not (Test-Path $TemplatePath)) {
        Write-Error "Template file not found at: '$TemplatePath'"
        exit 1
    }

    # Auto-resolve virtual switch if specified switch does not exist
    if (-not (Get-VMSwitch -Name $SwitchName -ErrorAction SilentlyContinue)) {
        if (Get-VMSwitch -Name "Default Switch" -ErrorAction SilentlyContinue) {
            $SwitchName = "Default Switch"
        } else {
            $AnySwitch = Get-VMSwitch -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($AnySwitch) {
                $SwitchName = $AnySwitch.Name
            }
        }
    }
    Write-Output "[NETWORK] Attaching to Hyper-V Virtual Switch: '$SwitchName'"

    # 2. Directory Layout
    $VMDirectory      = Join-Path -Path $CustomerVMsRoot -ChildPath $VMName
    $VHDXDirectory    = Join-Path -Path $VMDirectory -ChildPath "Virtual Hard Disks"
    $CustomerVHDXPath = Join-Path -Path $VHDXDirectory -ChildPath "$VMName-disk0.vhdx"

    New-Item -Path $VHDXDirectory -ItemType Directory -Force | Out-Null
    New-Item -Path (Join-Path -Path $VMDirectory -ChildPath "Logs") -ItemType Directory -Force | Out-Null
    New-Item -Path $SystemLogsRoot -ItemType Directory -Force | Out-Null

    # 3. Disk Provisioning
    $IsISO = $TemplatePath.ToLower().EndsWith(".iso")
    if ($IsISO) {
        # Create a dynamic new VHDX for OS installation
        New-VHD -Path $CustomerVHDXPath -SizeBytes ([int64]$DiskGB * 1GB) -Dynamic | Out-Null
        Write-Output "[DISK] Created dynamic VHDX ($DiskGB GB) at $CustomerVHDXPath"
    } else {
        # Differencing disk based on master VHDX template
        New-VHD -Path $CustomerVHDXPath -ParentPath $TemplatePath -Differencing | Out-Null
        Write-Output "[DISK] Created differencing VHDX attached to master $TemplatePath"

        # Expand differencing disk capacity if requested package disk is larger than template
        if ($DiskGB -gt 0) {
            $TargetBytes = [int64]$DiskGB * 1GB
            $ParentVHD = Get-VHD -Path $TemplatePath -ErrorAction SilentlyContinue
            if ($ParentVHD -and ($TargetBytes -gt $ParentVHD.Size)) {
                Resize-VHD -Path $CustomerVHDXPath -SizeBytes $TargetBytes | Out-Null
                Write-Output "[DISK] Resized differencing VHDX to $DiskGB GB"
            }
        }
    }

    # 4. Create Generation 2 VM
    $VM = New-VM -Name $VMName `
                 -MemoryStartupBytes ([int64]$RAMMB * 1MB) `
                 -VHDPath $CustomerVHDXPath `
                 -SwitchName $SwitchName `
                 -Generation 2 `
                 -Path $VMDirectory

    # 5. Hardware Configuration
    Set-VMProcessor -VMName $VMName -Count $CPUCount
    $TargetMaxBytes = [int64]$RAMMB * 1MB
    $StartupBytes = [Math]::Min([int64]2048 * 1MB, $TargetMaxBytes)
    $MinBytes = [Math]::Min([int64]512 * 1MB, $TargetMaxBytes)
    Set-VMMemory -VMName $VMName -DynamicMemoryEnabled $true -StartupBytes $StartupBytes -MinimumBytes $MinBytes -MaximumBytes $TargetMaxBytes -Buffer 20

    # 6. Firmware & Secure Boot Configuration
    # Disable Secure Boot for Linux / ISO to prevent "unsigned image hash not allowed" boot failures
    Set-VMFirmware -VMName $VMName -EnableSecureBoot Off
    Write-Output "[FIRMWARE] Secure Boot disabled for guaranteed Linux / ISO boot compatibility."

    # 7. If ISO template provided, mount DVD drive and set boot order
    if ($IsISO) {
        $ExistingDvd = Get-VMDvdDrive -VMName $VMName -ErrorAction SilentlyContinue
        if ($ExistingDvd) {
            Set-VMDvdDrive -VMName $VMName -Path $TemplatePath | Out-Null
        } else {
            Add-VMDvdDrive -VMName $VMName -Path $TemplatePath | Out-Null
        }
        $DvdDrive = Get-VMDvdDrive -VMName $VMName
        Set-VMFirmware -VMName $VMName -FirstBootDevice $DvdDrive
        Write-Output "[BOOT] Attached ISO ($TemplatePath) to DVD drive and set first boot device."
    }

    # 8. Start the VM automatically
    Start-VM -Name $VMName
    Write-Output "[STATUS] VM '$VMName' started successfully."

    # Enable Resource Metering for real-time telemetry
    try {
        Enable-VMResourceMetering -VMName $VMName -ErrorAction SilentlyContinue
    } catch {}

    # 9. Asynchronously run guest configuration (disk filesystem expansion & credential setup for Linux)
    $IsWindows = $TemplatePath.ToLower().Contains("windows") -or ($AdminUsername -eq "Administrator") -or ($AdminUsername -eq "user")
    if (-not $IsISO -and -not $IsWindows) {
        $GuestScript = Join-Path $PSScriptRoot "Configure-Guest.ps1"
        if (Test-Path $GuestScript) {
            $ProcArgs = "-NoProfile -NonInteractive -ExecutionPolicy Bypass -File `"$GuestScript`" -VMName `"$VMName`" -AdminUsername `"$AdminUsername`" -AdminPassword `"$AdminPassword`" -SSHPublicKey `"$SSHPublicKey`" -TimeoutSeconds 120"
            Start-Process powershell.exe -ArgumentList $ProcArgs -WindowStyle Hidden -ErrorAction SilentlyContinue | Out-Null
            Write-Output "[GUEST] Spawned independent process for guest initialization and filesystem expansion."
        }
    } else {
        Write-Output "[GUEST] Windows or ISO template detected - skipping Linux guest configuration."
    }

    # 10. Audit Logging
    $LogFile = Join-Path -Path $SystemLogsRoot -ChildPath "provision.log"
    Add-Content -Path $LogFile -Value "$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss')) - Provisioned and started $VMName successfully."

    $ResultObj = @{
        Status = "SUCCESS"
        VMName = $VMName
        VMId = $VM.Id.ToString()
        CPUCount = $CPUCount
        RAMMB = $RAMMB
        DiskGB = $DiskGB
        Directory = $VMDirectory
    }

    Write-Output ($ResultObj | ConvertTo-Json -Compress)
    exit 0
}
catch {
    Write-Error "Failed to provision VM '$VMName': $_"
    exit 1
}
