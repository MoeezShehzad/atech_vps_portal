const fs = require('fs');

// 1. Update hyperv_agent.js
let agent = fs.readFileSync('hyperv_agent.js', 'utf8');
agent = agent.replace('00_Master_Template\\Ubuntu Server 24.04 LTS.vhdx', '00-MASTER-TEMPLATES\\Ubuntu_Server_24.04_LTS.vhdx');
agent = agent.replace("SwitchName: data.switchName || 'Default Switch'", "SwitchName: data.switchName || 'External_vSwitch'");
fs.writeFileSync('hyperv_agent.js', agent, 'utf8');

// 2. Update Create-VPS.ps1
let ps = fs.readFileSync('scripts/hyperv/Create-VPS.ps1', 'utf8');
ps = ps.replace('00_Master_Template\\Ubuntu Server 24.04 LTS.vhdx', '00-MASTER-TEMPLATES\\Ubuntu_Server_24.04_LTS.vhdx');
ps = ps.replace('[string]$SwitchName = "Default Switch"', '[string]$SwitchName = "External_vSwitch"');
fs.writeFileSync('scripts/hyperv/Create-VPS.ps1', ps, 'utf8');

// 3. Update hypervService.js
let svc = fs.readFileSync('services/hypervService.js', 'utf8');
svc = svc.replace(/switchName = 'Default Switch'/g, "switchName = 'External_vSwitch'");
svc = svc.replace('00_Master_Template\\Ubuntu Server 24.04 LTS.vhdx', '00-MASTER-TEMPLATES\\Ubuntu_Server_24.04_LTS.vhdx');
fs.writeFileSync('services/hypervService.js', svc, 'utf8');

console.log('Successfully updated template paths and switch name to External_vSwitch');
