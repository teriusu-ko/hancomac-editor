import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { TipTapEditor } from "../src";
import "../src/styles/editor.css";

function App() {
  const [html, setHtml] = useState("");

  const handleUpload = async (file: File): Promise<string> => {
    // 로컬 dev에서는 blob URL로 미리보기
    return URL.createObjectURL(file);
  };

  return (
    <>
      <h1>@hancomac/editor Dev</h1>
      <TipTapEditor
        content=""
        onChange={setHtml}
        onUploadFile={handleUpload}
      />
      <details className="output">
        <summary>HTML 출력</summary>
        <pre>{html}</pre>
      </details>
    </>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
