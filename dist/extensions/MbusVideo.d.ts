import { Node } from "@tiptap/core";
export interface MbusVideoOptions {
    HTMLAttributes: Record<string, unknown>;
}
declare module "@tiptap/core" {
    interface Commands<ReturnType> {
        mbusVideo: {
            setMbusVideo: (attrs: {
                src: string;
                width?: string;
            }) => ReturnType;
        };
    }
}
export declare const MbusVideo: Node<MbusVideoOptions, any>;
//# sourceMappingURL=MbusVideo.d.ts.map