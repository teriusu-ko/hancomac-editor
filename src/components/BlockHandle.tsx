"use client";

// BlockHandle은 drag-handle 의존성 문제로 비활성화.
// + 버튼은 TipTapEditor의 Floating Menu로 대체됨.

import type { Editor } from "@tiptap/react";

export interface BlockHandleProps {
  editor: Editor;
  onPlusClick?: (pos: { top: number; left: number }) => void;
}

export function BlockHandle(_props: BlockHandleProps) {
  return null;
}
