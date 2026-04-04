export declare function sanitizeHtml(html: string): string;
/**
 * 레거시 TipTap v2 커스텀 태그를 현재 형식으로 변환.
 * 에디터 content 로드 전, 또는 게시물 렌더링 전에 호출.
 * tiptap-file → data-file-id, tiptap-midibus → iframe으로 변환.
 */
export declare function transformLegacyHtml(html: string): string;
export declare function stripHtmlToExcerpt(html: string, maxLen?: number): string;
//# sourceMappingURL=sanitize.d.ts.map