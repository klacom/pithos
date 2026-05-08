import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";

/**
 * Sanitizes HTML content to prevent XSS attacks.
 * Uses DOMPurify for robust protection on both client and server.
 */
export function sanitizeHtml(html: string): string {
    if (!html) return "";

    if (typeof window === "undefined") {
        // Server-side: Use JSDOM to provide a window object for DOMPurify
        const window = new JSDOM("").window;
        const purify = DOMPurify(window as any);
        return purify.sanitize(html);
    }

    // Client-side: Use global DOMPurify
    return DOMPurify.sanitize(html);
}

/**
 * Basic text sanitization (strips all HTML tags).
 * Useful for fields where no HTML is allowed at all.
 */
export function sanitizeText(text: string): string {
    if (!text) return "";

    // First strip all HTML tags using regex
    const stripped = text.replace(/<[^>]*>?/gm, "");

    // Then run through sanitizeHtml to catch any leftover encoding tricks
    return sanitizeHtml(stripped);
}
