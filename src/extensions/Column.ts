import { Node as TiptapNode, mergeAttributes } from "@tiptap/core";

export const Column = TiptapNode.create({
  name: "column",
  group: "",
  content: "block+",
  isolating: true,

  parseHTML() {
    return [
      { tag: 'div[data-type="column"]' },
      { tag: "div.tiptap-column" },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "column" }),
      0,
    ];
  },
});
