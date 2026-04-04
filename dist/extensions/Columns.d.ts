import { Node as TiptapNode } from "@tiptap/core";
declare module "@tiptap/core" {
    interface Commands<ReturnType> {
        columns: {
            setColumns: (count?: number) => ReturnType;
            unsetColumns: () => ReturnType;
        };
    }
}
export declare const Columns: TiptapNode<any, any>;
//# sourceMappingURL=Columns.d.ts.map