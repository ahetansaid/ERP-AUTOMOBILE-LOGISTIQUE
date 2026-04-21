"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

type UploadKind =
  | "VEHICLE_PHOTO"
  | "PURCHASE_DOCUMENT"
  | "TRANSIT_DOCUMENT"
  | "COMPANY_LOGO"
  | "USER_AVATAR"
  | "OTHER";

export interface FileUploaderProps {
  kind: UploadKind;
  resource?: string;
  resourceId?: number | string;
  accept?: string;
  maxSizeMb?: number;
  label?: string;
  multiple?: boolean;
  onUploaded?: (upload: { id: number; fileName: string; mimeType: string }) => void;
}

export function FileUploader({
  kind,
  resource,
  resourceId,
  accept,
  maxSizeMb = 25,
  label = "Ajouter un fichier",
  multiple = false,
  onUploaded,
}: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (file.size > maxSizeMb * 1024 * 1024) {
          throw new Error(`"${file.name}" dépasse ${maxSizeMb} MB.`);
        }
        const fd = new FormData();
        fd.append("file", file);
        fd.append("kind", kind);
        if (resource) fd.append("resource", resource);
        if (resourceId != null) fd.append("resourceId", String(resourceId));

        const base =
          process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("parcauto_access_token")
            : null;

        const res = await fetch(`${base}/uploads`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          body: fd,
        });
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error(
            payload.message || `Upload échoué (${res.status})`
          );
        }
        const data = await res.json();
        onUploaded?.(data);
      }
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur upload");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        loading={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {label}
      </Button>
      {error && (
        <p className="mt-2 text-xs font-medium text-danger-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
