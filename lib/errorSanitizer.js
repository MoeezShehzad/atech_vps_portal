// ==============================================================================
// Utility: lib/errorSanitizer.js
// Purpose: Enterprise Cloud Error Sanitizer
//          Prevents leaking infrastructure secrets, PowerShell paths, hypervisor
//          GUIDs, or raw system traces to customers. Replaces low-level errors
//          with reassuring, professional cloud status messages.
// ==============================================================================

export function sanitizeInfrastructureError(rawError) {
  if (!rawError) {
    return 'The requested operation could not be completed at this time. Please try again shortly.';
  }

  const message = typeof rawError === 'string' ? rawError : (rawError.message || String(rawError));
  const lower = message.toLowerCase();

  // 1. RAM / Memory Exhaustion
  if (
    lower.includes('not enough memory') ||
    lower.includes('could not initialize memory') ||
    lower.includes('0x8007000e') ||
    lower.includes('insufficient memory') ||
    lower.includes('ram size') ||
    lower.includes('out of memory')
  ) {
    return 'The host cluster is currently balancing node memory resources. Please wait a moment and try again, or reach out to support if this continues.';
  }

  // 2. Storage / Disk Space / VHDX lock
  if (
    lower.includes('disk full') ||
    lower.includes('no space left') ||
    lower.includes('0x80070070') ||
    lower.includes('vhdx') ||
    lower.includes('virtual hard disk') ||
    lower.includes('process cannot access the file') ||
    lower.includes('sharing violation')
  ) {
    return 'Storage volumes are currently undergoing routine optimization on this node. Please allow a few moments and retry.';
  }

  // 3. CPU / Processor Capacity
  if (
    lower.includes('processor') ||
    lower.includes('exceeded processor limit') ||
    lower.includes('cpu quota')
  ) {
    return 'Compute capacity on this cluster node is temporarily re-balancing. Please try again in a few moments.';
  }

  // 4. Host Agent / Network Communication (never expose backend/hypervisor outage to customers)
  if (
    lower.includes('econnrefused') ||
    lower.includes('econnreset') ||
    lower.includes('ehostunreach') ||
    lower.includes('etimedout') ||
    lower.includes('timeout') ||
    lower.includes('timed out') ||
    lower.includes('fetch failed') ||
    lower.includes('socket hang up') ||
    lower.includes('host agent') ||
    lower.includes('hyperv_agent') ||
    lower.includes('start_hyperv_agent') ||
    lower.includes('offline') ||
    lower.includes('unreachable') ||
    lower.includes(':5050')
  ) {
    return 'Your instance is currently undergoing routine synchronization. Please try again in a moment.';
  }

  // 5. Already Running / Already Stopped states
  if (lower.includes('already running') || lower.includes('state is running')) {
    return 'The virtual machine is already running.';
  }
  if (lower.includes('already stopped') || lower.includes('state is off') || lower.includes('not running')) {
    return 'The virtual machine is already stopped.';
  }

  // 6. Security / Permissions
  if (lower.includes('permission denied') || lower.includes('access is denied') || lower.includes('authorization policy')) {
    return 'Authorization verification in progress on this cluster node. Please try again shortly.';
  }

  // 7. General internal leaks (PowerShell, file paths, hex codes, GUIDs, backend internals)
  if (
    lower.includes('powershell') ||
    lower.includes('command failed') ||
    lower.includes('.ps1') ||
    lower.includes('write-error') ||
    lower.includes('categoryinfo') ||
    lower.includes('fullyqualifiederrorid') ||
    lower.includes('d:\\') ||
    lower.includes('c:\\') ||
    lower.includes('/scripts/') ||
    lower.includes('0x800') ||
    lower.includes('hyper-v') ||
    lower.includes('hypervisor') ||
    lower.includes('prisma') ||
    lower.includes('sql') ||
    lower.includes('http 5') ||
    lower.includes('enoent')
  ) {
    return 'Your request is taking a bit longer than expected. Please try again in a moment.';
  }

  return message;
}
