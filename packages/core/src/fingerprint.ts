/**
 * @feedvalue/core - Client Fingerprint
 *
 * Generates a semi-unique fingerprint for anti-abuse protection.
 * Used to identify clients without requiring authentication.
 *
 * NOTE: This is NOT for tracking users. It's used to:
 * 1. Validate submission tokens (tied to fingerprint)
 * 2. Rate limit abusive clients
 * 3. Detect automated submissions
 */

/**
 * Generate a client fingerprint using available browser signals
 *
 * The fingerprint is a hash of browser characteristics that:
 * - Is consistent across page loads (same browser/device)
 * - Changes if browser/device changes
 * - Is NOT personally identifiable
 *
 * @returns SHA-256 hash of fingerprint data
 */
export async function generateFingerprint(): Promise<string> {
  // Collect fingerprint components
  const components: string[] = [];

  // Screen dimensions
  if (typeof screen !== 'undefined') {
    components.push(`screen:${screen.width}x${screen.height}x${screen.colorDepth}`);
  }

  // Timezone
  if (typeof Intl !== 'undefined') {
    try {
      components.push(`tz:${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
    } catch {
      // Intl not fully supported
    }
  }

  // Language
  if (typeof navigator !== 'undefined') {
    components.push(`lang:${navigator.language || ''}`);
    components.push(`langs:${(navigator.languages || []).join(',')}`);
    components.push(`platform:${navigator.platform || ''}`);
    components.push(`cores:${navigator.hardwareConcurrency || 0}`);
    components.push(`touch:${navigator.maxTouchPoints || 0}`);
  }

  // Date offset (handles DST)
  const date = new Date();
  components.push(`offset:${date.getTimezoneOffset()}`);

  // Canvas fingerprint (optional, adds uniqueness)
  const canvasHash = await getCanvasFingerprint();
  if (canvasHash) {
    components.push(`canvas:${canvasHash}`);
  }

  // WebGL renderer (optional)
  const webglRenderer = getWebGLRenderer();
  if (webglRenderer) {
    components.push(`webgl:${webglRenderer}`);
  }

  // Audio context (optional)
  const audioHash = await getAudioFingerprint();
  if (audioHash) {
    components.push(`audio:${audioHash}`);
  }

  // Hash all components
  const fingerprintString = components.join('|');
  return hashString(fingerprintString);
}

/**
 * Get canvas fingerprint
 */
async function getCanvasFingerprint(): Promise<string | null> {
  if (typeof document === 'undefined') return null;

  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Draw text with various styles
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('FeedValue', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Fingerprint', 4, 17);

    // Get data URL and hash it
    const dataUrl = canvas.toDataURL();
    return hashString(dataUrl.slice(-50)); // Only hash last part
  } catch {
    return null;
  }
}

/**
 * Get WebGL renderer string
 */
function getWebGLRenderer(): string | null {
  if (typeof document === 'undefined') return null;

  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return null;

    const glContext = gl as WebGLRenderingContext;
    const debugInfo = glContext.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return null;

    const renderer = glContext.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    return typeof renderer === 'string' ? renderer.slice(0, 100) : null;
  } catch {
    return null;
  }
}

/**
 * Get audio context fingerprint
 */
async function getAudioFingerprint(): Promise<string | null> {
  if (typeof window === 'undefined' || !window.AudioContext) return null;

  try {
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const analyser = audioContext.createAnalyser();
    const gain = audioContext.createGain();
    const processor = audioContext.createScriptProcessor(4096, 1, 1);

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(10000, audioContext.currentTime);

    gain.gain.setValueAtTime(0, audioContext.currentTime);
    oscillator.connect(analyser);
    analyser.connect(processor);
    processor.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start(0);

    // Get frequency data
    const frequencyData = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(frequencyData);

    // Cleanup
    oscillator.stop();
    audioContext.close();

    // Hash first 10 frequency values
    return hashString(frequencyData.slice(0, 10).join(','));
  } catch {
    return null;
  }
}

/**
 * Hash a string using SHA-256
 * Falls back to simple hash if crypto not available
 */
async function hashString(str: string): Promise<string> {
  // Try Web Crypto API first
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(str);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fall through to fallback
    }
  }

  // Fallback: simple hash (djb2)
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}
