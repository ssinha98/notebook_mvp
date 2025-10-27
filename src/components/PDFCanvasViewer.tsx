"use client";

interface PDFCanvasViewerProps {
  url: string;
  highlightText?: string;
}

export default function PDFCanvasViewer({
  url,
  highlightText,
}: PDFCanvasViewerProps) {
  if (!url) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f3f3f3",
          color: "#666",
        }}
      >
        No PDF URL provided
      </div>
    );
  }

  return (
    <iframe
      src={url}
      style={{
        width: "100%",
        height: "100%",
        border: "none",
      }}
      title="PDF Viewer"
    />
  );
}
