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

  // 4. Host Agent / Network Communication
  if (
    lower.includes('econnrefused') ||
    lower.includes('etimedout') ||
    lower.includes('host agent') ||
    lower.includes('start_hyperv_agent') ||
    lower.includes(':5050')
  ) {
    return 'Unable to reach the infrastructure hypervisor. Our automated monitors have logged this event. Please try again in 1-2 minutes.';
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

  // 7. General internal leaks (PowerShell, file paths, hex codes, GUIDs)
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
    lower.includes('0x800')
  ) {
    return 'The requested operation could not be completed due to a temporary node delay. Please wait a moment and try again.';
  }

  return message;
}
