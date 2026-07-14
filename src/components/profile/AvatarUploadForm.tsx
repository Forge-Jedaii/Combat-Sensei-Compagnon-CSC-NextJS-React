"use client";

import { useEffect, useState } from "react";
import { uploadAvatar } from "@/app/archives/profils/actions";
import SubmitButton from "@/components/ui/SubmitButton";

const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
const ACCEPTED_AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export default function AvatarUploadForm({ currentAvatarUrl }: { currentAvatarUrl: string | null }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const visibleAvatarUrl = previewUrl ?? currentAvatarUrl;

  return (
    <div className="space-y-4 text-center">
      <div className="mx-auto flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border border-cyan-400/50 bg-black">
        {visibleAvatarUrl ? (
          <span
            role="img"
            aria-label={previewUrl ? "Aperçu du nouvel avatar" : "Avatar actuel"}
            className="h-full w-full bg-cover bg-center"
            style={{ backgroundImage: `url(${visibleAvatarUrl})` }}
          />
        ) : <span aria-hidden="true" className="text-4xl">👤</span>}
      </div>

      <form action={uploadAvatar} className="space-y-3" encType="multipart/form-data">
        <label htmlFor="avatar-file" className="block text-xs text-gray-300">
          Image JPG, PNG ou WebP — 2 Mo maximum
        </label>
        <input
          id="avatar-file"
          name="avatar"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required
          className="block w-full text-xs text-gray-400 file:mr-2 file:rounded-md file:border-0 file:bg-cyan-950 file:px-3 file:py-2 file:text-cyan-200"
          aria-describedby={fileError ? "avatar-file-error" : undefined}
          onChange={(event) => {
            const input = event.currentTarget;
            const file = input.files?.[0];
            setFileError(null);
            setPreviewUrl((previous) => {
              if (previous) URL.revokeObjectURL(previous);
              return null;
            });
            if (!file) return;
            if (!ACCEPTED_AVATAR_TYPES.has(file.type)) {
              setFileError("Format non accepté. Choisissez une image JPG, PNG ou WebP.");
              input.value = "";
              return;
            }
            if (file.size > MAX_AVATAR_SIZE) {
              setFileError("Cette image dépasse la limite de 2 Mo.");
              input.value = "";
              return;
            }
            setPreviewUrl(URL.createObjectURL(file));
          }}
        />
        {fileError && <p id="avatar-file-error" role="alert" className="text-xs text-red-300">{fileError}</p>}
        <SubmitButton pendingLabel="Envoi…" className="rounded-lg border border-cyan-400/40 px-3 py-2 text-xs text-cyan-300 disabled:opacity-50">
          Changer l’avatar
        </SubmitButton>
      </form>
    </div>
  );
}
