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

/** Schema fake (estructural, compatible con la interfaz SchemaLike). */
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

describe("Form v3 — contrato", () => {
  test("submitting es true mientras onSubmit corre, y bloquea doble submit", async () => {
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

    // intento de doble submit mientras corre → no llama de nuevo
    el.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await tick();
    expect(calls).toBe(1);

    resolveSubmit();
    await flush();
    expect(form.submitting.val).toBe(false);
    expect(calls).toBe(1);
  });

  test("schema: si falla, no llama onSubmit y pinta errores por campo", async () => {
    let called = false;
    const schema = makeSchema([{ path: "email", message: "Correo requerido" }]);
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
    expect(email.error.val).toBe("Correo requerido");
    expect(form.fieldErrors.val).toEqual({ email: "Correo requerido" });
    expect(form.error.val).toBe("");
  });

  test("schema: errores sin campo registrado caen en la línea general", async () => {
    const schema = makeSchema([{ path: "foo", message: "Falta el término" }]);
    const form = Form({
      schema,
      onSubmit: () => ({ ok: true }),
    });
    form.add(EmailField(), PasswordField());
    const el = mount(form.dom()) as HTMLFormElement;
    await submit(el);
    expect(form.error.val).toBe("Falta el término");
  });

  test("schema: si pasa, llama onSubmit con los datos", async () => {
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

  test("backend fieldErrors: se aplican con setError; los no mapeados van a la línea general", async () => {
    const form = Form({
      onSubmit: () => ({
        ok: false,
        fieldErrors: { email: "Ya existe una cuenta con ese correo", foo: "Algo falló" },
      }),
    });
    const email = EmailField();
    form.add(email, PasswordField());
    const el = mount(form.dom()) as HTMLFormElement;
    setValue(el, "email", "a@b.co");
    setValue(el, "password", "123456");
    await submit(el);

    expect(email.error.val).toBe("Ya existe una cuenta con ese correo");
    expect(form.error.val).toBe("Algo falló");
  });

  test("backend error general: se muestra en la línea general", async () => {
    let onErrorCalled = false;
    const form = Form({
      onSubmit: () => ({ ok: false, error: "Credenciales inválidas" }),
      onError: () => {
        onErrorCalled = true;
      },
    });
    form.add(EmailField(), PasswordField());
    const el = mount(form.dom()) as HTMLFormElement;
    setValue(el, "email", "a@b.co");
    setValue(el, "password", "123456");
    await submit(el);
    expect(form.error.val).toBe("Credenciales inválidas");
    expect(onErrorCalled).toBe(true);
  });

  test("onSuccess se llama al triunfar y deja la línea general limpia", async () => {
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

  test("legacy handler: { error } se normaliza a la línea general", async () => {
    const form = Form(async () => {
      return { error: "Falló" };
    });
    form.add(EmailField(), PasswordField());
    const el = mount(form.dom()) as HTMLFormElement;
    setValue(el, "email", "a@b.co");
    setValue(el, "password", "123456");
    await submit(el);
    expect(form.error.val).toBe("Falló");
  });

  test("legacy handler: void se trata como éxito", async () => {
    const form = Form(() => {});
    form.add(EmailField(), PasswordField());
    const el = mount(form.dom()) as HTMLFormElement;
    setValue(el, "email", "a@b.co");
    setValue(el, "password", "123456");
    await submit(el);
    expect(form.error.val).toBe("");
  });
});
