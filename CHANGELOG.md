# ATECH VPS Portal - Changes Log

## [Current Phase] VM Automation & Provisioning Engine

### 1. Hyper-V PowerShell Scripts
- Created [Create-VPS.ps1](file:///d:/atech_vps_portal/scripts/hyperv/Create-VPS.ps1) with Gen 2 UEFI, supporting dynamic ISO installation and VHDX templates.
- Created [Destroy-VPS.ps1](file:///d:/atech_vps_portal/scripts/hyperv/Destroy-VPS.ps1) for safe VM power-off, removal, and VHDX disk cleanup.
- Created [Power-VPS.ps1](file:///d:/atech_vps_portal/scripts/hyperv/Power-VPS.ps1) for Start, Stop, and Restart actions.
- Created [Resize-VPS.ps1](file:///d:/atech_vps_portal/scripts/hyperv/Resize-VPS.ps1) for dynamic RAM, CPU cores, and VHDX disk expansion.
- Created [Get-VPS.ps1](file:///d:/atech_vps_portal/scripts/hyperv/Get-VPS.ps1) for live telemetry query (status, IP, CPU, memory).

### 2. Backend Orchestration & Windows Host Agent
- Implemented [hyperv_agent.js](file:///d:/atech_vps_portal/hyperv_agent.js) on Windows host (port 5050) to directly bridge the Ubuntu portal and parent Windows Hyper-V.
- Implemented `services/hypervService.js` on Ubuntu to dispatch commands over HTTP (`172.25.80.1:5050`) directly to Windows.
- Created [start_hyperv_agent.bat](file:///d:/atech_vps_portal/start_hyperv_agent.bat) for one-click launching of the agent on Windows.
- Master ISO Path set in database and scripts: `D:\00_Master_Template\ubuntu-22.04.5-live-server-amd64.iso`.

### 3. Database State & Seeding (MS SQL Server)
- Cleaned up duplicate/terminated records; verified single active VM (`vps-vps-basic-983`).
- Set all OS Image template paths to `D:\00_Master_Template\ubuntu-22.04.5-live-server-amd64.iso`.
- Seeded VPS Plans, Hyper-V Host (`host1.atech.internal`), and IP Pool (`192.168.10.10` - `192.168.10.25`).

### 4. UI Fixes & Drawer Overlay
- Fixed Drawer and Modals z-index (`z-[100]`) in [Dashboard.tsx](file:///d:/atech_vps_portal/public/src/pages/Dashboard.tsx) so the header and close button (`X`) are never covered by the sticky navbar.
- Added sticky drawer header, prominent `Close` button, backdrop click-to-close, and `Escape` key shortcut.
- Added creative empty state experience for 0-VM accounts with package cards and instant deploy buttons.
- Rebuilt frontend production bundle and reloaded PM2 backend.

### 5. Hyper-V Execution & Real VM Provisioning
- Resolved Hyper-V authorization policy by elevating Host Agent to Administrator and adding user to Hyper-V Administrators group.
- Successfully provisioned `moeez-srv-o1` and `server-01` into Hyper-V with Gen 2 UEFI and dynamic VHDX disks on `D:\CUSTOMER-VMS\`.
- Real Hyper-V telemetry verified: CPU, RAM, and Running states reported live.
- Updated Power script with instant non-blocking turnoff and disabled console QuickEdit freeze.

### 6. Linux Secure Boot, Dynamic Pricing & Clean Database State
- Disabled Secure Boot in [Create-VPS.ps1](file:///d:/atech_vps_portal/scripts/hyperv/Create-VPS.ps1) for Gen 2 Linux VMs to permanently eliminate UEFI certificate boot failures on Ubuntu/Debian.
- Cleaned up deleted VMs for `moeezshahzad26@gmail.com` in MS SQL Server and freed IP pool addresses.
- Added live real-time price calculation box in the Deploy Modal reacting dynamically to selected base plan, vCPU, and RAM scaling.
- Upgraded Destroy Server functionality with multi-relation cascade cleanup (IP pool, subscriptions, jobs) and strict user ownership checks.
