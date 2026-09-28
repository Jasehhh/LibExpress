"use client";

import { FormEvent, useState } from "react";
import { patchMember, postMember } from "@/app/api/memberService";
import { Button } from "@/components/ui/Button";
import { DialogActions } from "@/components/ui/Dialog";
import { FormError, SelectField, TextField } from "@/components/ui/Field";
import { ApiError, errorMessage } from "@/lib/client";
import { createMemberSchema, updateMemberSchema } from "@/lib/schemas/member";
import { validate } from "@/lib/schemas/validate";
import { Member, MemberRole, MemberStatus, PatchMemberDTO } from "@/lib/types/member";

export function MemberForm({
  member,
  token,
  onCancel,
  onSaved,
}: {
  member?: Member;
  token: string;
  onCancel: () => void;
  onSaved: (member: Member) => void;
}) {
  const [values, setValues] = useState({
    first_name: member?.first_name ?? "",
    last_name: member?.last_name ?? "",
    email: member?.email ?? "",
    role: member?.role ?? ("USER" as MemberRole),
    status: member?.status ?? ("ACTIVE" as MemberStatus),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function set(key: keyof typeof values) {
    return (event: { target: { value: string } }) => {
      setValues((current) => ({ ...current, [key]: event.target.value }));
      setErrors((current) => {
        if (!current[key]) return current;
        const next = { ...current };
        delete next[key];
        return next;
      });
    };
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    const base = {
      first_name: values.first_name.trim(),
      last_name: values.last_name.trim(),
      email: values.email.trim(),
    };

    try {
      if (member) {
        const changes: PatchMemberDTO = {};
        if (base.first_name !== member.first_name) changes.first_name = base.first_name;
        if (base.last_name !== member.last_name) changes.last_name = base.last_name;
        if (base.email !== member.email) changes.email = base.email;
        if (values.role !== member.role) changes.role = values.role;
        if (values.status !== member.status) changes.status = values.status;
        if (Object.keys(changes).length === 0) {
          onCancel();
          return;
        }
        const checked = validate(updateMemberSchema, changes);
        if (checked.errors) {
          setErrors(checked.errors);
          return;
        }
        setErrors({});
        setBusy(true);
        onSaved(await patchMember(member.id, changes, token));
      } else {
        const checked = validate(createMemberSchema, base);
        if (checked.errors) {
          setErrors(checked.errors);
          return;
        }
        setErrors({});
        setBusy(true);
        onSaved(await postMember(checked.data, token));
      }
    } catch (err) {
      setFormError(errorMessage(err));
      if (err instanceof ApiError) setErrors(err.fieldErrors);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="First name" value={values.first_name} onChange={set("first_name")} error={errors.first_name} autoFocus required />
        <TextField label="Last name" value={values.last_name} onChange={set("last_name")} error={errors.last_name} required />
        <TextField
          label="Email"
          type="email"
          autoComplete="off"
          value={values.email}
          onChange={set("email")}
          error={errors.email}
          maxLength={255}
          containerClassName="sm:col-span-2"
          required
        />
        {member && (
          <>
            <SelectField label="Role" value={values.role} onChange={set("role")} error={errors.role}>
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
            </SelectField>
            <SelectField
              label="Status"
              value={values.status}
              onChange={set("status")}
              error={errors.status}
              hint={values.status === "SUSPENDED" ? "Suspended members are flagged at checkout." : undefined}
            >
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
            </SelectField>
          </>
        )}
      </div>
      {!member && <p className="mt-4 text-sm text-ink-soft">New members start as active users with no loans or fines.</p>}
      <div className="mt-5">
        <FormError message={formError} />
      </div>
      <DialogActions>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" busy={busy}>
          {member ? "Save changes" : "Add member"}
        </Button>
      </DialogActions>
    </form>
  );
}
