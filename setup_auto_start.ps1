try {
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    $agentScript = Join-Path $scriptDir "hyperv_agent.js"
    
    # Create a VBScript wrapper to run node invisibly in background
    $vbsPath = Join-Path $scriptDir "run_agent_silent.vbs"
    $vbsContent = "CreateObject(`"WScript.Shell`").Run `"node `"`" & `"$agentScript`" & `"`"`", 0, False"
    Set-Content -Path $vbsPath -Value $vbsContent -Force

    # Place a shortcut in Windows Startup folder
    $wsh = New-Object -ComObject WScript.Shell
    $startupPath = [Environment]::GetFolderPath('Startup')
    $shortcutPath = Join-Path $startupPath "AtechHyperVAgent.lnk"
    $shortcut = $wsh.CreateShortcut($shortcutPath)
    $shortcut.TargetPath = "wscript.exe"
    $shortcut.Arguments = "`"$vbsPath`""
    $shortcut.WorkingDirectory = $scriptDir
    $shortcut.WindowStyle = 7 # Minimized/Silent
    $shortcut.Save()

    Write-Output "SUCCESS: Windows Startup shortcut created at '$shortcutPath'"
} catch {
    Write-Error $_
}
