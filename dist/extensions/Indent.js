import { Extension } from "@tiptap/core";
const INDENT_STEP = 2; // em per level
const MAX_INDENT = 8;
export const Indent = Extension.create({
    name: "indent",
    addGlobalAttributes() {
        return [
            {
                types: ["paragraph", "heading"],
                attributes: {
                    indent: {
                        default: 0,
                        parseHTML: (element) => {
                            const ml = element.style.marginLeft;
                            if (!ml)
                                return 0;
                            const value = parseFloat(ml);
                            if (ml.endsWith("px"))
                                return Math.round(value / 40) || 0;
                            return Math.round(value / INDENT_STEP) || 0;
                        },
                        renderHTML: (attributes) => {
                            if (!attributes.indent || attributes.indent <= 0)
                                return {};
                            return { style: `margin-left: ${attributes.indent * INDENT_STEP}em` };
                        },
                    },
                },
            },
        ];
    },
    addCommands() {
        return {
            indent: () => ({ tr, state, dispatch }) => {
                const { $from } = state.selection;
                // listItem 내부에서는 기존 리스트 동작에 위임
                for (let d = $from.depth; d > 0; d--) {
                    if ($from.node(d).type.name === "listItem")
                        return false;
                }
                const node = $from.parent;
                if (node.type.name !== "paragraph" && node.type.name !== "heading")
                    return false;
                const pos = $from.before($from.depth);
                const currentIndent = node.attrs.indent || 0;
                if (currentIndent >= MAX_INDENT)
                    return false;
                if (dispatch) {
                    tr.setNodeMarkup(pos, undefined, {
                        ...node.attrs,
                        indent: currentIndent + 1,
                    });
                    dispatch(tr);
                }
                return true;
            },
            outdent: () => ({ tr, state, dispatch }) => {
                const { $from } = state.selection;
                for (let d = $from.depth; d > 0; d--) {
                    if ($from.node(d).type.name === "listItem")
                        return false;
                }
                const node = $from.parent;
                if (node.type.name !== "paragraph" && node.type.name !== "heading")
                    return false;
                const pos = $from.before($from.depth);
                const currentIndent = node.attrs.indent || 0;
                if (currentIndent <= 0)
                    return false;
                if (dispatch) {
                    tr.setNodeMarkup(pos, undefined, {
                        ...node.attrs,
                        indent: currentIndent - 1,
                    });
                    dispatch(tr);
                }
                return true;
            },
        };
    },
    addKeyboardShortcuts() {
        // 일반 paragraph/heading: 들여쓰기 문자(\u00a0×4) 커서 위치에 삽입.
        //   - HTML이 일반 공백을 collapse 하므로 NBSP 사용.
        // 코드블록: literal \t 삽입 (code:true가 보존).
        // 리스트 항목: 기본 listItem Tab(sinkListItem)에 위임 (false 반환).
        const INDENT_NBSP = "\u00a0\u00a0\u00a0\u00a0";
        const isInListItem = (state) => {
            const { $from } = state.selection;
            for (let d = $from.depth; d > 0; d--) {
                if ($from.node(d).type.name === "listItem")
                    return true;
            }
            return false;
        };
        return {
            Tab: () => {
                const { state, view } = this.editor;
                if (isInListItem(state))
                    return false;
                const inCode = this.editor.isActive("codeBlock");
                const insert = inCode ? "\t" : INDENT_NBSP;
                view.dispatch(state.tr.insertText(insert));
                return true;
            },
            "Shift-Tab": () => {
                const { state, view } = this.editor;
                if (isInListItem(state))
                    return false;
                const inCode = this.editor.isActive("codeBlock");
                const { $from } = state.selection;
                const parentStart = $from.start();
                const textBefore = state.doc.textBetween(parentStart, $from.pos, "\n");
                const lastNl = textBefore.lastIndexOf("\n");
                const lineHead = textBefore.slice(lastNl + 1);
                const cursorAbsLineStart = $from.pos - lineHead.length;
                let removeLen = 0;
                if (inCode) {
                    if (lineHead.startsWith("\t"))
                        removeLen = 1;
                    else if (lineHead.startsWith("    "))
                        removeLen = 4;
                    else if (lineHead.startsWith("  "))
                        removeLen = 2;
                    else if (lineHead.startsWith(" "))
                        removeLen = 1;
                }
                else {
                    // 일반 문단: 줄 머리의 NBSP 4개 또는 1개 제거
                    if (lineHead.startsWith(INDENT_NBSP))
                        removeLen = 4;
                    else if (lineHead.startsWith("\u00a0"))
                        removeLen = 1;
                }
                if (!removeLen)
                    return true; // Tab 포커스 이탈 방지
                view.dispatch(state.tr.delete(cursorAbsLineStart, cursorAbsLineStart + removeLen));
                return true;
            },
        };
    },
});
