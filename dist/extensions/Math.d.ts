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
import { Node } from "@tiptap/core";
interface MathOptions {
    HTMLAttributes: Record<string, unknown>;
}
declare module "@tiptap/core" {
    interface Commands<ReturnType> {
        mathInline: {
            insertMathInline: (latex: string) => ReturnType;
        };
        mathDisplay: {
            insertMathDisplay: (latex: string) => ReturnType;
        };
    }
}
export declare const MathInline: Node<MathOptions, any>;
export declare const MathDisplay: Node<MathOptions, any>;
export {};
//# sourceMappingURL=Math.d.ts.map