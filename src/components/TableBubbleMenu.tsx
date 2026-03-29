"use client";

import type { Editor } from "@tiptap/react";
import {
  ArrowUpToLine,
  ArrowDownToLine,
  ArrowLeftToLine,
  ArrowRightToLine,
  RemoveFormatting,
  Trash2,
  PanelTop,
  PanelLeft,
  Combine,
  SplitSquareHorizontal,
  Paintbrush,
  UnfoldVertical,
  EqualApproximately,
  RowsIcon,
  ColumnsIcon,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "../utils/cn";

const PRESET_COLORS = [
  { label: "없음", value: "" },
  { label: "밝은 회색", value: "#f1f5f9" },
  { label: "밝은 파랑", value: "#dbeafe" },
  { label: "밝은 초록", value: "#dcfce7" },
  { label: "밝은 노랑", value: "#fef9c3" },
  { label: "밝은 주황", value: "#ffedd5" },
  { label: "밝은 빨강", value: "#fee2e2" },
  { label: "밝은 보라", value: "#ede9fe" },
  { label: "밝은 분홍", value: "#fce7f3" },
];

const LINE_HEIGHTS = [
  { label: "좁게", value: "0.8" },
  { label: "보통", value: "1.0" },
  { label: "넓게", value: "1.4" },
];

function TBtn({
  onClick,
  disabled,
  destructive,
  label,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="hce-table-btn-wrap">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "p-1.5 rounded-md transition-colors",
          destructive
            ? "text-white/70 hover:text-red-300 hover:bg-white/10"
            : "text-white/70 hover:text-white hover:bg-white/10",
          disabled && "opacity-30 pointer-events-none"
        )}
      >
        {children}
      </button>
      <span className="hce-table-btn-tooltip">{label}</span>
    </div>
  );
}

function findTableNode(editor: Editor) {
  const { state } = editor;
  const { from } = state.selection;
  let tablePos = -1;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let tableNode: any = null;
  state.doc.descendants((node, pos) => {
    if (node.type.name === "table" && pos <= from && pos + node.nodeSize >= from) {
      tablePos = pos;
      tableNode = node;
      return false;
    }
  });
  return { tableNode, tablePos };
}

export function TableBubbleMenu({ editor }: { editor: Editor }) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const [showColors, setShowColors] = useState(false);
  const [showLineHeight, setShowLineHeight] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const iconSize = 14;

  const updatePosition = useCallback(() => {
    if (!editor.isActive("table")) {
      setVisible(false);
      return;
    }
    const { from } = editor.state.selection;
    const domAtPos = editor.view.domAtPos(from);
    const tableEl = (domAtPos.node as HTMLElement)?.closest?.("table")
      || (domAtPos.node.parentElement as HTMLElement)?.closest?.("table");
    if (!tableEl) {
      setVisible(false);
      return;
    }
    const wrapper = editor.view.dom.closest(".hce-editor-wrapper");
    if (!wrapper) return;

    const tableRect = tableEl.getBoundingClientRect();
    const wrapperRect = wrapper.getBoundingClientRect();

    setPos({
      top: tableRect.top - wrapperRect.top - 36,
      left: tableRect.left - wrapperRect.left,
      width: tableRect.width,
    });
    setVisible(true);
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    editor.on("selectionUpdate", updatePosition);
    editor.on("update", updatePosition);
    return () => {
      editor.off("selectionUpdate", updatePosition);
      editor.off("update", updatePosition);
    };
  }, [editor, updatePosition]);

  useEffect(() => {
    if (!showColors && !showLineHeight) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowColors(false);
        setShowLineHeight(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showColors, showLineHeight]);

  if (!visible) return null;

  return (
    <div
      ref={menuRef}
      className="absolute z-20"
      style={{ top: pos.top, left: pos.left, width: pos.width }}
    >
      <div className="flex items-center justify-center gap-0.5 px-1.5 py-1 bg-foreground rounded-lg shadow-xl w-fit mx-auto">
        <TBtn
          onClick={() => editor.chain().focus().addRowBefore().run()}
          disabled={!editor.can().addRowBefore()}
          label="행 위에 추가"
        >
          <ArrowUpToLine size={iconSize} />
        </TBtn>
        <TBtn
          onClick={() => editor.chain().focus().addRowAfter().run()}
          disabled={!editor.can().addRowAfter()}
          label="행 아래에 추가"
        >
          <ArrowDownToLine size={iconSize} />
        </TBtn>
        <TBtn
          onClick={() => editor.chain().focus().addColumnBefore().run()}
          disabled={!editor.can().addColumnBefore()}
          label="열 왼쪽에 추가"
        >
          <ArrowLeftToLine size={iconSize} />
        </TBtn>
        <TBtn
          onClick={() => editor.chain().focus().addColumnAfter().run()}
          disabled={!editor.can().addColumnAfter()}
          label="열 오른쪽에 추가"
        >
          <ArrowRightToLine size={iconSize} />
        </TBtn>

        <div className="w-px h-5 bg-white/20 mx-0.5" />

        <TBtn
          onClick={() => editor.chain().focus().toggleHeaderRow().run()}
          disabled={!editor.can().toggleHeaderRow()}
          label="헤더 행 토글"
        >
          <PanelTop size={iconSize} />
        </TBtn>
        <TBtn
          onClick={() => editor.chain().focus().toggleHeaderColumn().run()}
          disabled={!editor.can().toggleHeaderColumn()}
          label="헤더 열 토글"
        >
          <PanelLeft size={iconSize} />
        </TBtn>
        <TBtn
          onClick={() => editor.chain().focus().mergeCells().run()}
          disabled={!editor.can().mergeCells()}
          label="셀 병합"
        >
          <Combine size={iconSize} />
        </TBtn>
        <TBtn
          onClick={() => editor.chain().focus().splitCell().run()}
          disabled={!editor.can().splitCell()}
          label="셀 분할"
        >
          <SplitSquareHorizontal size={iconSize} />
        </TBtn>

        <div className="w-px h-5 bg-white/20 mx-0.5" />

        {/* 줄 간격 (line-height) */}
        <div className="relative">
          <TBtn
            onClick={() => { setShowLineHeight((v) => !v); setShowColors(false); }}
            label="줄 간격"
          >
            <UnfoldVertical size={iconSize} />
          </TBtn>
          {showLineHeight && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-foreground rounded-lg shadow-xl border border-white/10 py-1" style={{ minWidth: "100px" }}>
              {LINE_HEIGHTS.map((lh) => (
                <button
                  key={lh.value}
                  type="button"
                  className="w-full text-left px-3 py-1.5 text-xs text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                  onClick={() => {
                    const { state, dispatch } = editor.view;
                    const { tr, doc } = state;
                    const { tableNode, tablePos } = findTableNode(editor);
                    if (!tableNode || tablePos < 0) return;
                    // 해당 표의 셀만 변경
                    tableNode.descendants((node: { type: { name: string }; attrs: Record<string, unknown> }, childPos: number) => {
                      if (node.type.name === "tableCell" || node.type.name === "tableHeader") {
                        tr.setNodeMarkup(tablePos + childPos + 1, undefined, { ...node.attrs, lineHeight: lh.value });
                      }
                    });
                    dispatch(tr);
                    setShowLineHeight(false);
                  }}
                >
                  {lh.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 너비 동일 */}
        <TBtn
          onClick={() => {
            const { tableNode, tablePos } = findTableNode(editor);
            if (!tableNode || tablePos < 0) return;
            // 첫 번째 행의 셀 수로 열 개수 파악
            const firstRow = tableNode.firstChild;
            if (!firstRow) return;
            const colCount = firstRow.childCount;
            if (colCount === 0) return;
            // 테이블 DOM에서 실제 너비 가져오기
            const domAtPos = editor.view.domAtPos(tablePos + 1);
            const tableEl = (domAtPos.node as HTMLElement)?.closest?.("table")
              || (domAtPos.node.parentElement as HTMLElement)?.closest?.("table");
            const tableWidth = tableEl?.clientWidth || 600;
            const equalWidth = Math.floor(tableWidth / colCount);
            const colwidths = Array(colCount).fill(equalWidth);
            // 모든 셀의 colwidth 업데이트
            const { tr } = editor.state;
            tableNode.descendants((node: { type: { name: string }; attrs: Record<string, unknown> }, childPos: number) => {
              if (node.type.name === "tableCell" || node.type.name === "tableHeader") {
                tr.setNodeMarkup(tablePos + childPos + 1, undefined, { ...node.attrs, colwidth: [equalWidth] });
              }
            });
            editor.view.dispatch(tr);
          }}
          label="너비 동일"
        >
          <EqualApproximately size={iconSize} />
        </TBtn>

        {/* 배경색 */}
        <div className="relative">
          <TBtn
            onClick={() => { setShowColors((v) => !v); setShowLineHeight(false); }}
            label="셀 배경색"
          >
            <Paintbrush size={iconSize} />
          </TBtn>
          {showColors && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-foreground rounded-lg shadow-xl border border-white/10 p-2" style={{ minWidth: "160px" }}>
              <p className="text-[10px] font-medium text-white/50 uppercase tracking-wider mb-1.5 px-1">
                배경색
              </p>
              <div className="grid grid-cols-3 gap-1">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c.value || "none"}
                    type="button"
                    title={c.label}
                    className="w-full h-7 rounded-md border border-white/20 transition-transform hover:scale-110"
                    style={{
                      background: c.value || "transparent",
                      backgroundImage: !c.value
                        ? "linear-gradient(135deg, transparent 45%, #ef4444 45%, #ef4444 55%, transparent 55%)"
                        : undefined,
                    }}
                    onClick={() => {
                      editor
                        .chain()
                        .focus()
                        .setCellAttribute("backgroundColor", c.value || null)
                        .run();
                      setShowColors(false);
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-white/20 mx-0.5" />

        <TBtn
          onClick={() => editor.chain().focus().deleteRow().run()}
          disabled={!editor.can().deleteRow()}
          destructive
          label="행 삭제"
        >
          <RowsIcon size={iconSize} />
        </TBtn>
        <TBtn
          onClick={() => editor.chain().focus().deleteColumn().run()}
          disabled={!editor.can().deleteColumn()}
          destructive
          label="열 삭제"
        >
          <ColumnsIcon size={iconSize} />
        </TBtn>
        <TBtn
          onClick={() => editor.chain().focus().deleteTable().run()}
          disabled={!editor.can().deleteTable()}
          destructive
          label="표 삭제"
        >
          <Trash2 size={iconSize} />
        </TBtn>
      </div>
    </div>
  );
}
