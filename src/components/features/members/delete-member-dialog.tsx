"use client";

import { Dialog } from "~/components/ui/dialog";
import { BUTTON_CLASS } from "~/components/ui/form-field";
import { type Member } from "~/lib/types";
import { api } from "~/trpc/react";

export function DeleteMemberDialog({
  member,
  onClose,
}: {
  member: Member | null;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={!!member}
      onClose={onClose}
      size="sm"
      title="Delete this member?"
    >
      {member && <DeleteMember member={member} onDone={onClose} />}
    </Dialog>
  );
}

function DeleteMember({
  member,
  onDone,
}: {
  member: Member;
  onDone: () => void;
}) {
  const utils = api.useUtils();
  const remove = api.member.delete.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.member.getAll.invalidate(),
        utils.dashboard.invalidate(),
      ]);
      onDone();
    },
  });

  return (
    <>
      <p className="text-sm leading-relaxed">
        <span className="font-semibold">
          {member.firstName} {member.lastName}
        </span>{" "}
        will be removed from the members list. This can&apos;t be undone.
      </p>
      <p className="text-muted mt-2 text-sm">
        Members who have ever borrowed a book can&apos;t be deleted, so their
        loan history stays intact. Suspend them instead.
      </p>

      {remove.error && (
        <p
          role="alert"
          className="bg-danger-light text-danger mt-4 rounded-lg px-3 py-2 text-sm"
        >
          {remove.error.message}
        </p>
      )}

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onDone}
          className={BUTTON_CLASS.secondary}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => remove.mutate({ id: member.id })}
          disabled={remove.isPending}
          className={BUTTON_CLASS.danger}
        >
          {remove.isPending ? "Deleting…" : "Delete member"}
        </button>
      </div>
    </>
  );
}
