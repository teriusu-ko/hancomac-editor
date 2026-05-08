import { Node, mergeAttributes } from "@tiptap/core";
function attachHls(video, src) {
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src;
        return { destroy: () => { } };
    }
    let hls = null;
    let cancelled = false;
    import("hls.js")
        .then(({ default: Hls }) => {
        if (cancelled)
            return;
        if (!Hls.isSupported()) {
            video.src = src;
            return;
        }
        const instance = new Hls();
        instance.loadSource(src);
        instance.attachMedia(video);
        hls = instance;
    })
        .catch(() => {
        if (!cancelled)
            video.src = src;
    });
    return {
        destroy: () => {
            cancelled = true;
            hls?.destroy();
        }
    };
}
export const MbusVideo = Node.create({
    name: "mbusVideo",
    group: "block",
    atom: true,
    draggable: true,
    addOptions() {
        return { HTMLAttributes: {} };
    },
    addAttributes() {
        return {
            src: { default: null },
            width: { default: null }
        };
    },
    parseHTML() {
        return [
            {
                tag: "div[data-mbus-src]",
                getAttrs: (dom) => {
                    const el = dom;
                    return {
                        src: el.getAttribute("data-mbus-src"),
                        width: el.getAttribute("data-mbus-width") || el.style?.width || null
                    };
                }
            }
        ];
    },
    renderHTML({ HTMLAttributes }) {
        const attrs = {
            "data-mbus-src": HTMLAttributes.src
        };
        if (HTMLAttributes.width) {
            attrs["data-mbus-width"] = HTMLAttributes.width;
            attrs["style"] = `width: ${HTMLAttributes.width}`;
        }
        return ["div", mergeAttributes(this.options.HTMLAttributes, attrs)];
    },
    addNodeView() {
        return ({ node, editor, getPos }) => {
            const dom = document.createElement("div");
            dom.setAttribute("data-type", "mbusVideo");
            dom.setAttribute("data-node-view-wrapper", "");
            dom.style.cssText = "margin:8px 0;position:relative;box-sizing:border-box;max-width:100%;";
            if (node.attrs.width)
                dom.style.width = node.attrs.width;
            const video = document.createElement("video");
            video.controls = true;
            video.preload = "metadata";
            video.setAttribute("controlslist", "nodownload");
            video.setAttribute("playsinline", "");
            video.style.cssText =
                "width:100%;height:auto;border-radius:8px;background:#0b1020;display:block;";
            dom.appendChild(video);
            const handle = node.attrs.src ? attachHls(video, node.attrs.src) : null;
            if (editor.isEditable) {
                const del = document.createElement("button");
                del.type = "button";
                del.textContent = "\u00D7";
                del.style.cssText =
                    "position:absolute;top:8px;right:8px;width:28px;height:28px;border:none;background:rgba(0,0,0,0.6);color:#fff;font-size:18px;cursor:pointer;border-radius:50%;display:flex;align-items:center;justify-content:center;z-index:2;";
                del.addEventListener("click", () => {
                    const pos = typeof getPos === "function" ? getPos() : null;
                    if (pos != null) {
                        editor.commands.deleteRange({ from: pos, to: pos + node.nodeSize });
                    }
                });
                dom.appendChild(del);
                const resizeHandle = document.createElement("button");
                resizeHandle.type = "button";
                resizeHandle.contentEditable = "false";
                resizeHandle.setAttribute("aria-label", "영상 너비 조절");
                resizeHandle.style.cssText =
                    "position:absolute;right:-12px;top:0;bottom:0;width:14px;padding:0;margin:0;border:0;background:transparent;cursor:ew-resize;z-index:2;display:flex;align-items:center;justify-content:center;";
                const bar = document.createElement("span");
                bar.style.cssText =
                    "display:block;width:3px;height:48px;background:var(--border, #d1d5db);border-radius:2px;transition:background 0.15s;pointer-events:none;";
                resizeHandle.appendChild(bar);
                resizeHandle.addEventListener("mouseenter", () => {
                    bar.style.background = "var(--primary, #3382f2)";
                });
                resizeHandle.addEventListener("mouseleave", () => {
                    if (!resizing)
                        bar.style.background = "var(--border, #d1d5db)";
                });
                const MIN_W = 240;
                const MAX_W = 1600;
                let resizing = false;
                let startX = 0;
                let startWidth = 0;
                resizeHandle.addEventListener("pointerdown", (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    resizing = true;
                    startX = e.clientX;
                    startWidth = dom.getBoundingClientRect().width;
                    bar.style.background = "var(--primary, #3382f2)";
                    resizeHandle.setPointerCapture(e.pointerId);
                });
                resizeHandle.addEventListener("pointermove", (e) => {
                    if (!resizing)
                        return;
                    const delta = e.clientX - startX;
                    const next = Math.max(MIN_W, Math.min(MAX_W, startWidth + delta));
                    dom.style.width = `${next}px`;
                });
                const endResize = (e) => {
                    if (!resizing)
                        return;
                    resizing = false;
                    bar.style.background = "var(--border, #d1d5db)";
                    try {
                        resizeHandle.releasePointerCapture(e.pointerId);
                    }
                    catch {
                        // ignore
                    }
                    const finalWidth = dom.style.width;
                    if (!finalWidth)
                        return;
                    const pos = typeof getPos === "function" ? getPos() : null;
                    if (pos == null)
                        return;
                    editor.view.dispatch(editor.view.state.tr.setNodeMarkup(pos, undefined, {
                        ...node.attrs,
                        width: finalWidth
                    }));
                };
                resizeHandle.addEventListener("pointerup", endResize);
                resizeHandle.addEventListener("pointercancel", endResize);
                dom.appendChild(resizeHandle);
            }
            return {
                dom,
                update: (updated) => {
                    if (updated.type !== node.type)
                        return false;
                    const w = updated.attrs.width;
                    dom.style.width = w || "";
                    return true;
                },
                destroy: () => handle?.destroy()
            };
        };
    },
    addCommands() {
        return {
            setMbusVideo: (attrs) => ({ chain }) => {
                return chain().insertContent({ type: this.name, attrs }).run();
            }
        };
    }
});
