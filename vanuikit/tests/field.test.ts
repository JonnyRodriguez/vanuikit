import { describe, test, expect } from "bun:test";
import { Field, TextField, EmailField, PasswordField } from "../src/components/field.js";
import { Form } from "../src/components/form.js";
import { Required, MinLength, Match } from "../src/validators.js";

const mount = (node: HTMLElement) => {
  document.body.replaceChildren(node);
  return node;
};

// VanJS updates bindings in a microtask; tests must wait for it.
const tick = () => new Promise((r) => setTimeout(r, 0));

/** Dispatches submit on the form and awaits the async flow. */
const submit = async (formEl: HTMLFormElement) => {
  formEl.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  await tick();
};

describe("EmailField — typed unit", () => {
  test("rejects empty and invalid format, accepts valid", () => {
    const email = EmailField();
    expect(email.validate("")).toBe(false);
    expect(email.error.val).toContain("email");
    expect(email.validate("mal-formato")).toBe(false);
    expect(email.validate("a@b.co")).toBe(true);
    expect(email.error.val).toBe("");
  });
});

describe("PasswordField — typed unit", () => {
  test("rejects empty and short, accepts >= 6", () => {
    const pass = PasswordField();
    expect(pass.validate("")).toBe(false);
    expect(pass.validate("12345")).toBe(false);
    expect(pass.validate("123456")).toBe(true);
  });

  test("min customizable", () => {
    const pass = PasswordField("Contraseña", "password", "••", 8);
    expect(pass.validate("1234567")).toBe(false);
    expect(pass.validate("12345678")).toBe(true);
  });
});

describe("TextField — required", () => {
  test("rejects empty, accepts text", () => {
    const name = TextField("Nombre", "name");
    expect(name.validate("  ")).toBe(false);
    expect(name.validate("Ana")).toBe(true);
  });
});

describe("Proxy: addValidator without losing the type's own validators", () => {
  test("EmailField + extra validation still checks the format", () => {
    const email = EmailField();
    email.addValidator(MinLength(20, "Muy corto"));
    // invalid format -> type error (the extra one does not run first)
    expect(email.validate("abc")).toBe(false);
    expect(email.error.val).toBe("Invalid email address");
    // valid but short format -> extra error
    expect(email.validate("a@b.co")).toBe(false);
    expect(email.error.val).toBe("Muy corto");
    // both pass
    expect(email.validate("nombre.largo@ejemplo.com")).toBe(true);
  });

  test("base field built from scratch", () => {
    const monto = Field({ label: "Monto", name: "monto", inputType: "number" });
    monto.addValidator(Required("Ingresa un monto"));
    expect(monto.validate("")).toBe(false);
    expect(monto.validate("50")).toBe(true);
  });
});

describe("Form — runs the default validations", () => {
  test("does not call onSubmit when a field fails", async () => {
    let called = false;
    const form = Form(() => {
      called = true;
    });
    form.add(EmailField(), PasswordField());

    const el = mount(form.dom()) as HTMLFormElement;
    (el.querySelector('input[name="email"]') as HTMLInputElement).value = "mal";
    (el.querySelector('input[name="password"]') as HTMLInputElement).value = "123456";
    await submit(el);

    expect(called).toBe(false);
    expect(el.textContent).toContain("Invalid email address");
  });

  test("calls onSubmit with the data when everything passes", async () => {
    let data: Record<string, unknown> | null = null;
    const form = Form((d) => {
      data = d;
    });
    form.add(EmailField(), PasswordField());

    const el = mount(form.dom()) as HTMLFormElement;
    (el.querySelector('input[name="email"]') as HTMLInputElement).value = "a@b.co";
    (el.querySelector('input[name="password"]') as HTMLInputElement).value = "123456";
    await submit(el);

    expect(data).toEqual({ email: "a@b.co", password: "123456" });
  });

  test("Match: password confirmation", async () => {
    let called = false;
    const form = Form(() => {
      called = true;
    });
    const confirm = PasswordField("Confirmar", "confirm");
    confirm.addValidator(Match("password", "Las contraseñas no coinciden"));
    form.add(EmailField(), PasswordField(), confirm);

    const el = mount(form.dom()) as HTMLFormElement;
    (el.querySelector('input[name="email"]') as HTMLInputElement).value = "a@b.co";
    (el.querySelector('input[name="password"]') as HTMLInputElement).value = "123456";
    (el.querySelector('input[name="confirm"]') as HTMLInputElement).value = "654321";
    await submit(el);

    expect(called).toBe(false);
    expect(el.textContent).toContain("Las contraseñas no coinciden");
  });
});
