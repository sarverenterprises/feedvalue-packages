/**
 * @feedvalue/core - Context Capture
 *
 * Captures DOM context from a trigger element for enhanced feedback metadata.
 * This allows understanding WHERE on a page the user reacted, not just which page.
 */

/**
 * Context capture configuration
 */
export interface ContextCaptureConfig {
  /** Enable automatic context capture (default: true) */
  enabled: boolean;
  /** Maximum parent traversal depth (default: 5) */
  maxDepth: number;
  /** Maximum heading text length (default: 100) */
  maxHeadingLength: number;
  /** Data attribute whitelist (default: ['data-section', 'data-feature', 'data-component']) */
  dataAttributeWhitelist: string[];
}

export const DEFAULT_CONTEXT_CAPTURE_CONFIG: ContextCaptureConfig = {
  enabled: true,
  maxDepth: 5,
  maxHeadingLength: 100,
  dataAttributeWhitelist: [
    'data-section',
    'data-feature',
    'data-component',
    'data-fv-section',
    'data-fv-feature',
  ],
};

/**
 * Captured context data from DOM traversal
 */
export interface CapturedContext {
  /** ID of nearest parent element with an id attribute */
  sectionId?: string;
  /** Tag name of the section element (e.g., 'section', 'article', 'div') */
  sectionTag?: string;
  /** Text content of nearest heading (h1-h6) */
  nearestHeading?: string;
  /** Level of the nearest heading (1-6) */
  headingLevel?: number;
  /** Captured data-* attributes from element and parents */
  dataAttributes?: Record<string, string>;
  /** CSS selector path to the trigger element (for debugging) */
  cssSelector?: string;
}

/**
 * Find nearest parent element with an ID attribute
 */
function findNearestWithId(element: Element, maxDepth: number): Element | null {
  let current: Element | null = element;
  let depth = 0;

  while (current && depth < maxDepth) {
    if (current.id) {
      return current;
    }
    current = current.parentElement;
    depth++;
  }

  return null;
}

/**
 * Find nearest heading element (h1-h6)
 * First looks within the section, then searches previous siblings going up
 */
function findNearestHeading(
  element: Element,
  section: Element | null,
  maxDepth: number
): Element | null {
  // First, look within the section if we found one
  if (section) {
    const heading = section.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading) return heading;
  }

  // Fallback: traverse up looking for a heading sibling
  let current: Element | null = element;
  let depth = 0;

  while (current && depth < maxDepth) {
    // Check previous siblings for a heading
    let sibling = current.previousElementSibling;
    while (sibling) {
      if (/^H[1-6]$/.test(sibling.tagName)) {
        return sibling;
      }
      sibling = sibling.previousElementSibling;
    }
    current = current.parentElement;
    depth++;
  }

  return null;
}

/**
 * Capture whitelisted data-* attributes from element and parents
 * Child values take precedence (won't be overwritten by parent values)
 */
function captureDataAttributes(
  element: Element,
  whitelist: string[],
  maxDepth: number
): Record<string, string> {
  const result: Record<string, string> = {};
  let current: Element | null = element;
  let depth = 0;

  while (current && depth < maxDepth) {
    for (const attr of Array.from(current.attributes)) {
      // Check if attribute is in whitelist (don't overwrite child values)
      if (whitelist.includes(attr.name) && !result[attr.name]) {
        result[attr.name] = attr.value;
      }
    }
    current = current.parentElement;
    depth++;
  }

  return result;
}

/**
 * Generate a readable CSS selector path for debugging
 * Stops at ID (unique) or after maxDepth levels
 */
function generateSelector(element: Element, maxDepth: number): string {
  const parts: string[] = [];
  let current: Element | null = element;
  let depth = 0;

  while (current && depth < maxDepth && current !== document.body) {
    let selector = current.tagName.toLowerCase();
    if (current.id) {
      selector = `#${current.id}`;
      parts.unshift(selector);
      break; // ID is unique, no need to go further
    }
    if (current.className && typeof current.className === 'string') {
      const classes = current.className
        .split(' ')
        .filter((c) => c.trim())
        .slice(0, 2);
      if (classes.length) {
        selector += '.' + classes.join('.');
      }
    }
    parts.unshift(selector);
    current = current.parentElement;
    depth++;
  }

  return parts.join(' > ');
}

/**
 * Truncate string to maximum length with ellipsis
 */
function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

/**
 * Capture DOM context from a trigger element
 *
 * @param triggerElement - The element that triggered the reaction (e.g., the button)
 * @param config - Configuration for context capture
 * @returns Captured context object or null if disabled/unavailable
 *
 * @example
 * ```typescript
 * // Capture context from a button click
 * const context = captureContext(event.currentTarget, config);
 * // Returns: { sectionId: 'installation', nearestHeading: 'Installation', ... }
 * ```
 */
export function captureContext(
  triggerElement: Element | null,
  config: ContextCaptureConfig = DEFAULT_CONTEXT_CAPTURE_CONFIG
): CapturedContext | null {
  // Early exit if disabled, no element, or not in browser
  if (!config.enabled || !triggerElement || typeof document === 'undefined') {
    return null;
  }

  const context: CapturedContext = {};

  // 1. Find nearest parent with ID
  const sectionWithId = findNearestWithId(triggerElement, config.maxDepth);
  if (sectionWithId) {
    context.sectionId = sectionWithId.id;
    context.sectionTag = sectionWithId.tagName.toLowerCase();
  }

  // 2. Find nearest heading
  const heading = findNearestHeading(triggerElement, sectionWithId, config.maxDepth);
  if (heading) {
    context.nearestHeading = truncate(heading.textContent?.trim() || '', config.maxHeadingLength);
    // Extract heading level from tagName (e.g., 'H1' -> 1, 'H2' -> 2)
    const level = heading.tagName[1];
    if (level) {
      context.headingLevel = parseInt(level, 10);
    }
  }

  // 3. Capture whitelisted data attributes
  const dataAttrs = captureDataAttributes(
    triggerElement,
    config.dataAttributeWhitelist,
    config.maxDepth
  );
  if (Object.keys(dataAttrs).length > 0) {
    context.dataAttributes = dataAttrs;
  }

  // 4. Generate CSS selector (for debugging)
  context.cssSelector = generateSelector(triggerElement, 3);

  // Return null if no context was captured
  return Object.keys(context).length > 0 ? context : null;
}
