"use client";

import { type TRPCClientErrorLike } from "@trpc/client";
import { useId, useState } from "react";

import { Dialog } from "~/components/ui/dialog";
import {
  BUTTON_CLASS,
  FormField,
  INPUT_CLASS,
} from "~/components/ui/form-field";
import { changedFields } from "~/lib/changes";
import { memberInput } from "~/lib/schemas/member";
import { type Member, type MemberStatus } from "~/lib/types";
import { type AppRouter } from "~/server/api/root";
import { api } from "~/trpc/react";

type FieldName = "firstName" | "lastName" | "email";
type FieldErrors = Partial<Record<FieldName, string>>;

const firstErrors = (fieldErrors: Record<string, string[] | undefined>) =>
  Object.fromEntries(
    Object.entries(fieldErrors).map(([field, messages]) => [
      field,
      messages?.[0],
    ]),
  ) as FieldErrors;

export function MemberFormDialog({
  open,
  member,
  onClose,
}: {
  open: boolean;
  member: Member | null;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={member ? "Edit member" : "Add a member"}
      description={
        member
          ? "Suspend a member to stop them borrowing."
          : "New members can borrow books straight away."
      }
    >
      <MemberForm member={member} onDone={onClose} />
    </Dialog>
  );
}

function MemberForm({
  member,
  onDone,
}: {
  member: Member | null;
  onDone: () => void;
}) {
  const ids = useId();
  const utils = api.useUtils();
  const [firstName, setFirstName] = useState(member?.firstName ?? "");
  const [lastName, setLastName] = useState(member?.lastName ?? "");
  const [email, setEmail] = useState(member?.email ?? "");
  const [status, setStatus] = useState<MemberStatus>(
    member?.status ?? "ACTIVE",
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const onSaved = async () => {
    await Promise.all([
      utils.member.getAll.invalidate(),
      utils.loan.getOpen.invalidate(),
      utils.dashboard.invalidate(),
    ]);
    onDone();
  };
  const onFailed = (err: TRPCClientErrorLike<AppRouter>) => {
    const zodError = err.data?.zodError;
    if (zodError && Object.keys(zodError.fieldErrors).length > 0) {
      setErrors(firstErrors(zodError.fieldErrors));
    } else {
      setFormError(zodError?.formErrors[0] ?? err.message);
    }
  };
  const create = api.member.create.useMutation({
    onSuccess: onSaved,
    onError: onFailed,
  });
  const update = api.member.update.useMutation({
    onSuccess: onSaved,
    onError: onFailed,
  });
  const saving = create.isPending || update.isPending;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const parsed = memberInput.safeParse({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
    });
    if (!parsed.success) {
      setErrors(firstErrors(parsed.error.flatten().fieldErrors));
      return;
    }
    setErrors({});
    if (!member) {
      create.mutate(parsed.data);
      return;
    }
    const data = changedFields(member, { ...parsed.data, status });
    if (Object.keys(data).length === 0) onDone();
    else update.mutate({ id: member.id, data });
  }

  const field = (name: FieldName) => ({
    id: `${ids}-${name}`,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${ids}-${name}-error` : undefined,
  });

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          label="First name"
          htmlFor={`${ids}-firstName`}
          error={errors.firstName}
        >
          <input
            {...field("firstName")}
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            autoComplete="off"
            className={`${INPUT_CLASS} h-10`}
          />
        </FormField>
        <FormField
          label="Last name"
          htmlFor={`${ids}-lastName`}
          error={errors.lastName}
        >
          <input
            {...field("lastName")}
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            autoComplete="off"
            className={`${INPUT_CLASS} h-10`}
          />
        </FormField>
      </div>

      <FormField label="Email" htmlFor={`${ids}-email`} error={errors.email}>
        <input
          {...field("email")}
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="off"
          className={`${INPUT_CLASS} h-10`}
        />
      </FormField>

      {member && (
        <FormField
          label="Status"
          htmlFor={`${ids}-status`}
          hint="Suspended members can't borrow until set back to active."
        >
          <select
            id={`${ids}-status`}
            value={status}
            onChange={(event) => setStatus(event.target.value as MemberStatus)}
            className={`${INPUT_CLASS} h-10`}
          >
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </FormField>
      )}

      {formError && (
        <p
          role="alert"
          className="bg-danger-light text-danger rounded-lg px-3 py-2 text-sm"
        >
          {formError}
        </p>
      )}

      <div className="border-border mt-2 flex justify-end gap-3 border-t pt-5">
        <button
          type="button"
          onClick={onDone}
          className={BUTTON_CLASS.secondary}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className={BUTTON_CLASS.primary}
        >
          {saving ? "Saving…" : member ? "Save changes" : "Add member"}
        </button>
      </div>
    </form>
  );
}
