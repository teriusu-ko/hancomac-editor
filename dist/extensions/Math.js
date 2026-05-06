/**
 * KaTeX 기반 inline/display math 노드.
 *
 * 저장 포맷은 prod(arcturus + @seorii/prosemirror-math)와 호환:
 *   - inline: <math-inline class="math-node">LATEX</math-inline>
 *   - display: <math-display class="math-node">LATEX</math-display>
 *
 * 노드는 atom이며 텍스트 콘텐츠(LaTeX 원문)를 자식 텍스트 노드로 보관한다.
 * NodeView가 KaTeX로 렌더링한다.
 */
import { mergeAttributes, Node } from "@tiptap/core";
import katex from "katex";
function renderKatex(latex, displayMode) {
    try {
        return katex.renderToString(latex, {
            displayMode,
            throwOnError: false,
            output: "html",
        });
    }
    catch {
        return `<span class="math-error">${latex}</span>`;
    }
}
function buildNodeView(displayMode) {
    return ({ node, HTMLAttributes }) => {
        const tag = displayMode ? "math-display" : "math-inline";
        const dom = document.createElement(tag);
        Object.entries({ class: "math-node", ...HTMLAttributes }).forEach(([k, v]) => {
            if (v != null)
                dom.setAttribute(k, String(v));
        });
        dom.innerHTML = renderKatex(node.textContent, displayMode);
        return { dom };
    };
}
export const MathInline = Node.create({
    name: "math_inline",
    group: "inline",
    inline: true,
    atom: true,
    content: "text*",
    selectable: true,
    addOptions() {
        return {
            HTMLAttributes: { class: "math-node" },
        };
    },
    parseHTML() {
        return [{ tag: "math-inline" }];
    },
    renderHTML({ HTMLAttributes }) {
        return ["math-inline", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
    },
    addNodeView() {
        return ({ node, HTMLAttributes }) => buildNodeView(false)({ node: node, HTMLAttributes });
    },
    addCommands() {
        return {
            insertMathInline: (latex) => ({ commands }) => commands.insertContent({
                type: "math_inline",
                content: [{ type: "text", text: latex }],
            }),
        };
    },
});
export const MathDisplay = Node.create({
    name: "math_display",
    group: "block",
    atom: true,
    content: "text*",
    code: true,
    selectable: true,
    defining: true,
    addOptions() {
        return {
            HTMLAttributes: { class: "math-node" },
        };
    },
    parseHTML() {
        return [{ tag: "math-display" }];
    },
    renderHTML({ HTMLAttributes }) {
        return ["math-display", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
    },
    addNodeView() {
        return ({ node, HTMLAttributes }) => buildNodeView(true)({ node: node, HTMLAttributes });
    },
    addCommands() {
        return {
            insertMathDisplay: (latex) => ({ commands }) => commands.insertContent({
                type: "math_display",
                content: [{ type: "text", text: latex }],
            }),
        };
    },
});
