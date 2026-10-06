Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "D:\atech_vps_portal"
WshShell.Run "cmd /c ""\""C:\Program Files\nodejs\node.exe\"" \""D:\atech_vps_portal\hyperv_agent.js\"" > \""D:\atech_vps_portal\agent.log\"" 2>&1""", 0, False
