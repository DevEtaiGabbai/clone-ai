import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function sanitizeHtml(rawHtml: any) {
  if (!rawHtml) return '';

  let sanitizedHtml = rawHtml;

  // Replace base64 data
  sanitizedHtml = sanitizedHtml.replace(
      /(data:[^;]+;base64,)[^"'\s)]+/g,
      '$1---base64 data, redacted---'
  );

  // Replace inline SVGs - using a workaround for the 's' flag
  sanitizedHtml = sanitizedHtml.replace(
      /<svg[^>]*>[\s\S]*?<\/svg>/g,
      '<svg>---svg content, redacted---</svg>'
  );

  // Replace long data-uri attributes
  sanitizedHtml = sanitizedHtml.replace(
      /data-uri="[^"]+"/g,
      'data-uri="---data-uri, redacted---"'
  );

  // Replace script contents (often contain long minified code)
  sanitizedHtml = sanitizedHtml.replace(
      /<script[^>]*>[\s\S]*?<\/script>/g,
      '<script>---script content, redacted---</script>'
  );

  // Replace style tags (often contain long CSS)
  sanitizedHtml = sanitizedHtml.replace(
      /<style[^>]*>[\s\S]*?<\/style>/g,
      '<style>---style content, redacted---</style>'
  );

  // Replace long comments
  sanitizedHtml = sanitizedHtml.replace(
      /<!--[\s\S]*?-->/g,
      '<!--comment redacted-->'
  );

  // Replace source maps
  sanitizedHtml = sanitizedHtml.replace(
      /\/\/# sourceMappingURL=.*?\.map/g,
      '//# sourceMappingURL=redacted'
  );

  // Replace long data attributes
  sanitizedHtml = sanitizedHtml.replace(
      /data-[a-zA-Z0-9-]+="[^"]{100,}"/g,
      'data-long-attribute="---long data attribute, redacted---"'
  );

  // Replace inline JSON data (often found in script tags with type="application/json")
  sanitizedHtml = sanitizedHtml.replace(
      /<script[^>]*type="application\/json"[^>]*>[\s\S]*?<\/script>/g,
      '<script type="application/json">---json data, redacted---</script>'
  );

  // Replace long class lists (when they're unnecessarily long, like in Tailwind)
  sanitizedHtml = sanitizedHtml.replace(
      /class="[^"]{200,}"/g,
      'class="---long-class-list-redacted---"'
  );

  return sanitizedHtml;
}

