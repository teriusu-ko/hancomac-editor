import { escapeHtml } from "./escape-html";

const ALLOWED_TAGS = new Set([
  "p", "br", "b", "i", "u", "em", "strong", "a",
  "ul", "ol", "li", "h1", "h2", "h3", "h4", "h5", "h6",
  "blockquote", "pre", "code", "img", "figure", "figcaption",
  "table", "colgroup", "col", "thead", "tbody", "tr", "th", "td",
  "span", "div", "hr", "sub", "sup",
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "title", "target", "rel"]),
  img: new Set(["src", "alt", "width", "height"]),
  table: new Set(["style"]),
  col: new Set(["style", "width"]),
  td: new Set(["colspan", "rowspan", "colwidth", "style"]),
  th: new Set(["colspan", "rowspan", "colwidth", "style"]),
  div: new Set(["data-pdf-src", "data-pdf-name"]),
  pre: new Set(["class"]),
  code: new Set(["class"]),
  "*": new Set(["class", "id"]),
};

const SAFE_URL_PATTERN = /^(?:https?:\/\/|\/[\w])/i;

export function sanitizeHtml(html: string): string {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g, (match, tag, attrs) => {
      const lower = tag.toLowerCase();
      if (!ALLOWED_TAGS.has(lower)) return "";

      const cleanAttrs = sanitizeAttributes(lower, attrs);
      const isClosing = match.startsWith("</");
      if (isClosing) return `</${lower}>`;
      const selfClosing = match.endsWith("/>");
      return `<${lower}${cleanAttrs}${selfClosing ? " /" : ""}>`;
    });
}

function sanitizeAttributes(tag: string, attrString: string): string {
  const allowedForTag = ALLOWED_ATTRS[tag] ?? new Set();
  const allowedGlobal = ALLOWED_ATTRS["*"] ?? new Set();
  const result: string[] = [];

  const attrRegex = /([a-zA-Z][\w-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+))/g;
  let m: RegExpExecArray | null;

  while ((m = attrRegex.exec(attrString)) !== null) {
    const name = m[1].toLowerCase();
    const value = m[2] ?? m[3] ?? m[4] ?? "";

    if (name.startsWith("on")) continue;
    if (!allowedForTag.has(name) && !allowedGlobal.has(name)) continue;
    if ((name === "href" || name === "src") && !SAFE_URL_PATTERN.test(value)) {
      continue;
    }

    result.push(` ${name}="${escapeHtml(value)}"`);
  }

  return result.join("");
}

/**
 * 레거시 TipTap v2 커스텀 태그를 현재 형식으로 변환.
 * 에디터 content 로드 전, 또는 게시물 렌더링 전에 호출.
 * tiptap-file → data-file-id, tiptap-midibus → iframe으로 변환.
 */
export function transformLegacyHtml(html: string): string {
  if (!html) return html;
  return (
    html
      // <tiptap-collapsable title="X">content</tiptap-collapsable>
      // → <details><summary>X</summary><div>content</div></details>
      .replace(
        /<tiptap-collapsable\s+title="([^"]*)">([\s\S]*?)<\/tiptap-collapsable>/gi,
        '<details><summary>$1</summary><div>$2</div></details>',
      )
      // <lite-youtube videoid="X" ...></lite-youtube>
      // → <div data-youtube-video><iframe src="https://www.youtube.com/embed/X" allowfullscreen></iframe></div>
      .replace(
        /<lite-youtube\s+videoid="([^"]*)"[^>]*>(?:<\/lite-youtube>)?/gi,
        '<div data-youtube-video=""><iframe src="https://www.youtube.com/embed/$1" allowfullscreen></iframe></div>',
      )
      // <embed src="X" type="application/pdf" ...>
      // → <div data-pdf-src="X" data-pdf-name="filename">
      .replace(
        /<embed\s+[^>]*src="([^"]*)"[^>]*type="application\/pdf"[^>]*\/?>/gi,
        (_match, src: string) => {
          const name =
            src.split("/").pop()?.replace(/\?.*$/, "") || "PDF";
          return `<div data-pdf-src="${src}" data-pdf-name="${name}"></div>`;
        },
      )
      // Also handle reversed attribute order: type before src
      .replace(
        /<embed\s+[^>]*type="application\/pdf"[^>]*src="([^"]*)"[^>]*\/?>/gi,
        (_match, src: string) => {
          const name =
            src.split("/").pop()?.replace(/\?.*$/, "") || "PDF";
          return `<div data-pdf-src="${src}" data-pdf-name="${name}"></div>`;
        },
      )
      // <tiptap-file id="X">text</tiptap-file>
      // → <div data-file-id="X" data-file-name="text">
      .replace(
        /<tiptap-file\s+id="([^"]*)"[^>]*>([^<]*)<\/tiptap-file>/gi,
        (_match, id: string, text: string) => {
          const name = text.trim() || "\uD30C\uC77C";
          return `<div data-file-id="${id}" data-file-name="${name}"></div>`;
        },
      )
      // <tiptap-midibus id="X" ...></tiptap-midibus> + 뒤따르는 iframe-wrapper 제거
      // → <div data-youtube-video><iframe src="https://play.mbus.tv/v1/hls/X" allowfullscreen></iframe></div>
      .replace(
        /<tiptap-midibus\s+id="([^"]*)"[^>]*>(?:<\/tiptap-midibus>)?/gi,
        (_match, id: string) => {
          return `<div data-youtube-video=""><iframe src="https://play.mbus.tv/v1/hls/${id}" width="100%" height="400" frameborder="0" allowfullscreen="true"></iframe></div>`;
        },
      )
      // 미디버스 뒤에 따라오는 빈 iframe-wrapper 제거
      .replace(
        /<div\s+class="iframe-wrapper"[^>]*>[\s\S]*?<\/div>/gi,
        "",
      )
      // <div class="tiptap-columns"> → <div data-type="columns">
      .replace(
        /<div\s+class="tiptap-columns">/gi,
        '<div data-type="columns">',
      )
      // <div class="tiptap-column"> → <div data-type="column">
      .replace(
        /<div\s+class="tiptap-column">/gi,
        '<div data-type="column">',
      )
      // <tiptap-upload-skeleton ...> 제거
      .replace(
        /<tiptap-upload-skeleton[^>]*>(?:<\/tiptap-upload-skeleton>)?/gi,
        "",
      )
  );
}

export function stripHtmlToExcerpt(html: string, maxLen = 200): string {
  const text = String(html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
  return text.length > maxLen ? text.slice(0, maxLen) + "\u2026" : text;
}
