"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteRecipient } from "@/lib/actions/recipients";
import { deleteDonor } from "@/lib/actions/donors";
import { Loader2, Trash2 } from "lucide-react";

const kinds = {
  recipient: { action: deleteRecipient, listHref: "/admin/recipients" },
  donor: { action: deleteDonor, listHref: "/admin/donors" },
};

interface DeleteRecordButtonProps {
  kind: keyof typeof kinds;
  id: string;
  name: string;
}

export default function DeleteRecordButton({ kind, id, name }: DeleteRecordButtonProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(`Delete ${kind} "${name}"? This cannot be undone.`)) return;

    setDeleting(true);
    const result = await kinds[kind].action(id);

    if (!result.success) {
      setDeleting(false);
      window.alert(result.error || `Failed to delete ${kind}.`);
      return;
    }

    router.push(kinds[kind].listHref);
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className="inline-flex items-center space-x-1 border border-slate-200 hover:bg-rose-50 hover:text-rose-700 text-slate-600 px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer"
    >
      {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      <span>Delete</span>
    </button>
  );
}
