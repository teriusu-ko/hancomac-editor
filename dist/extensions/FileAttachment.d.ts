import { Node } from "@tiptap/core";
export type FileResolveResult = {
    src: string;
    name?: string;
    size?: number;
};
export type FileResolver = (fileId: string) => Promise<FileResolveResult>;
export interface FileAttachmentOptions {
    HTMLAttributes: Record<string, unknown>;
    resolver: FileResolver | null;
    downloadBaseUrl: string;
}
declare module "@tiptap/core" {
    interface Commands<ReturnType> {
        fileAttachment: {
            setFileAttachment: (attrs: {
                src?: string;
                fileId?: string;
                name: string;
                size?: number;
            }) => ReturnType;
        };
    }
}
export declare const FileAttachment: Node<FileAttachmentOptions, any>;
//# sourceMappingURL=FileAttachment.d.ts.map