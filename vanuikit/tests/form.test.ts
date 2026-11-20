import { describe, test, expect } from "bun:test";
import { Form, type FormResult, type SchemaLike } from "../src/components/form.js";
import { EmailField, PasswordField } from "../src/components/field.js";

const mount = (node: HTMLElement) => {
  document.body.replaceChildren(node);
  return node;
};

const tick = () => new Promise((r) => setTimeout(r, 0));
const flush = () => new Promise((r) => setTimeout(r, 10));

const submit = async (formEl: HTMLFormElement) => {
  formEl.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  await flush();
};

/** Fake schema (structural, compatible with the SchemaLike interface). */
const makeSchema = (
  failWith: Array<{ path: string; message: string }> = [],
): SchemaLike => ({
  safeParse: () =>
    failWith.length === 0
      ? { success: true, data: {} }
      : {
          success: false,
          error: {
            issues: failWith.map((f) => ({ path: [f.path], message: f.message })),
          },
        },
});

const setValue = (formEl: HTMLFormElement, name: string, value: string) => {
  const input = formEl.querySelector(`input[name="${name}"]`) as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
};

describe("Form v3 — contract", () => {
  test("submitting is true while onSubmit runs, and blocks double submit", async () => {
    let calls = 0;
    let resolveSubmit!: (r: FormResult) => void;
    const form = Form({
      onSubmit: () => {
        calls++;
        return new Promise<FormResult>((res) => {
          resolveSubmit = () => res({ ok: true });
        });
      },
    });
    form.add(EmailField(), PasswordField());
    const el = mount(form.dom()) as HTMLFormElement;
    setValue(el, "email", "a@b.co");
    setValue(el, "password", "123456");

    el.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await tick();
    expect(form.submitting.val).toBe(true);

    // double submit attempt while running → not called again
    el.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await tick();
    expect(calls).toBe(1);

    resolveSubmit();
    await flush();
    expect(form.submitting.val).toBe(false);
    expect(calls).toBe(1);
  });

  test("schema: on failure, does not call onSubmit and paints per-field errors", async () => {
    let called = false;
    const schema = makeSchema([{ path: "email", message: "Email is required" }]);
    const form = Form({
      schema,
      onSubmit: () => {
        called = true;
        return { ok: true };
      },
    });
    const email = EmailField();
    const password = PasswordField();
    form.add(email, password);

    const el = mount(form.dom()) as HTMLFormElement;
    await submit(el);

    expect(called).toBe(false);
    expect(email.error.val).toBe("Email is required");
    expect(form.fieldErrors.val).toEqual({ email: "Email is required" });
    expect(form.error.val).toBe("");
  });

  test("schema: errors without a registered field fall into the general line", async () => {
    const schema = makeSchema([{ path: "foo", message: "Missing the term" }]);
    const form = Form({
      schema,
      onSubmit: () => ({ ok: true }),
    });
    form.add(EmailField(), PasswordField());
    const el = mount(form.dom()) as HTMLFormElement;
    await submit(el);
    expect(form.error.val).toBe("Missing the term");
  });

  test("schema: on success, calls onSubmit with the data", async () => {
    let received: Record<string, unknown> | null = null;
    const form = Form({
      schema: makeSchema(),
      onSubmit: (data) => {
        received = data;
        return { ok: true };
      },
    });
    form.add(EmailField(), PasswordField());
    const el = mount(form.dom()) as HTMLFormElement;
    setValue(el, "email", "a@b.co");
    setValue(el, "password", "123456");
    await submit(el);
    expect(received).toEqual({ email: "a@b.co", password: "123456" });
  });

  test("backend fieldErrors: applied via setError; unmapped ones go to the general line", async () => {
    const form = Form({
      onSubmit: () => ({
        ok: false,
        fieldErrors: { email: "An account with that email already exists", foo: "Something failed" },
      }),
    });
    const email = EmailField();
    form.add(email, PasswordField());
    const el = mount(form.dom()) as HTMLFormElement;
    setValue(el, "email", "a@b.co");
    setValue(el, "password", "123456");
    await submit(el);

    expect(email.error.val).toBe("An account with that email already exists");
    expect(form.error.val).toBe("Something failed");
  });

  test("backend general error: shown in the general line", async () => {
    let onErrorCalled = false;
    const form = Form({
      onSubmit: () => ({ ok: false, error: "Invalid credentials" }),
      onError: () => {
        onErrorCalled = true;
      },
    });
    form.add(EmailField(), PasswordField());
    const el = mount(form.dom()) as HTMLFormElement;
    setValue(el, "email", "a@b.co");
    setValue(el, "password", "123456");
    await submit(el);
    expect(form.error.val).toBe("Invalid credentials");
    expect(onErrorCalled).toBe(true);
  });

  test("onSuccess is called on success and leaves the general line clean", async () => {
    let successData: Record<string, unknown> | null = null;
    const form = Form({
      onSubmit: () => ({ ok: true }),
      onSuccess: (data) => {
        successData = data;
      },
    });
    form.add(EmailField(), PasswordField());
    const el = mount(form.dom()) as HTMLFormElement;
    setValue(el, "email", "a@b.co");
    setValue(el, "password", "123456");
    await submit(el);
    expect(form.error.val).toBe("");
    expect(successData).toEqual({ email: "a@b.co", password: "123456" });
  });

  test("legacy handler: { error } is normalized to the general line", async () => {
    const form = Form(async () => {
      return { error: "Failed" };
    });
    form.add(EmailField(), PasswordField());
    const el = mount(form.dom()) as HTMLFormElement;
    setValue(el, "email", "a@b.co");
    setValue(el, "password", "123456");
    await submit(el);
    expect(form.error.val).toBe("Failed");
  });

  test("legacy handler: void is treated as success", async () => {
    const form = Form(() => {});
    form.add(EmailField(), PasswordField());
    const el = mount(form.dom()) as HTMLFormElement;
    setValue(el, "email", "a@b.co");
    setValue(el, "password", "123456");
    await submit(el);
    expect(form.error.val).toBe("");
  });
});
