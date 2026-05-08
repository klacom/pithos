import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import { sanitizeText } from "@/lib/sanitization";

/**
 * Server-only HTML sanitization using DOMPurify + JSDOM.
 */
export function sanitizeHtmlServer(html: string): string {
    if (!html) return "";
    const window = new JSDOM('').window;
    const purify = createDOMPurify(window as any);
    return purify.sanitize(html);
}

export { sanitizeText };
