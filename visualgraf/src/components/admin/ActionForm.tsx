"use client";

import { startTransition, useActionState, useRef, type ReactNode } from "react";

export type ActionResult = { error?: string; success?: string };
type Action = (state: ActionResult, formData: FormData) => Promise<ActionResult>;

export function ActionForm({
  action, children, label, confirm, secondary = false, resetOnSuccess = false,
}: {
  action: Action;
  children?: ReactNode;
  label: string;
  confirm?: string;
  secondary?: boolean;
  resetOnSuccess?: boolean;
}) {
  const form = useRef<HTMLFormElement>(null);
  const [state, submit, pending] = useActionState(async (previous: ActionResult, data: FormData) => {
    const result = await action(previous, data);
    if (resetOnSuccess && result.success) form.current?.reset();
    return result;
  }, {});

  return (
    <form ref={form} method="post" onSubmit={(event) => {
      event.preventDefault();
      if (confirm && !window.confirm(confirm)) return;
      const data = new FormData(event.currentTarget);
      startTransition(() => submit(data));
    }}>
      <fieldset disabled={pending} className="min-w-0 space-y-3">
        {children}
        <button className={secondary ? "btn btn-ghost" : "btn btn-primary"}>
          {pending ? "Procesando…" : label}
        </button>
      </fieldset>
      {state.error && <p role="alert" className="mt-2">{state.error}</p>}
      {state.success && <p role="status" className="mt-2 text-mute">{state.success}</p>}
    </form>
  );
}
