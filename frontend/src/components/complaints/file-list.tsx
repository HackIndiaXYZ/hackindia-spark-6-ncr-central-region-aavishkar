"use client";

import { File, FileImage, FileVideo2 } from "lucide-react";
import type { LocalAttachment } from "@/lib/local-complaint-store";

type FileListProps = {
  files: LocalAttachment[];
  onPreview: (index: number) => void;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export function FileList({ files, onPreview }: FileListProps) {
  if (files.length === 0) {
    return <p className="mt-3 text-xs text-white/50">No attachment added for this complaint.</p>;
  }

  return (
    <ul className="mt-3 space-y-1">
      {files.map((file, idx) => (
        <li key={file.id} className="flex items-center justify-between gap-3 rounded-xl px-2 py-1.5 hover:bg-white/[0.03]">
          <button
            type="button"
            onClick={() => onPreview(idx)}
            className="inline-flex min-w-0 items-center gap-2 text-left text-blue-300 transition hover:underline"
          >
            {file.kind === "image" ? (
              <FileImage className="h-4 w-4 shrink-0" />
            ) : file.kind === "video" ? (
              <FileVideo2 className="h-4 w-4 shrink-0" />
            ) : (
              <File className="h-4 w-4 shrink-0" />
            )}
            <span className="truncate">{file.name}</span>
          </button>
          <span className="text-xs text-white/45">{formatBytes(file.size)}</span>
        </li>
      ))}
    </ul>
  );
}
