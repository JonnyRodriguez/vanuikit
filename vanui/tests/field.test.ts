import { describe, test, expect } from "bun:test";
import { Field, TextField, EmailField, PasswordField } from "../src/components/field.js";
import { Form } from "../src/components/form.js";
import { Required, MinLength, Match } from "../src/validators.js";

const mount = (node: HTMLElement) => {
  document.body.replaceChildren(node);
  return node;
};

// VanJS actualiza los bindings en un microtask; hay que esperarlo.
const tick = () => new Promise((r) => setTimeout(r, 0));

/** Dispara submit sobre el form y espera el flujo async. */
const submit = async (formEl: HTMLFormElement) => {
  formEl.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  await tick();
};

describe("EmailField — unidad tipada", () => {
  test("rechaza vacío y formato inválido, acepta válido", () => {
    const email = EmailField();
    expect(email.validate("")).toBe(false);
    expect(email.error.val).toContain("email");
    expect(email.validate("mal-formato")).toBe(false);
    expect(email.validate("a@b.co")).toBe(true);
    expect(email.error.val).toBe("");
  });
});

describe("PasswordField — unidad tipada", () => {
  test("rechaza vacío y corto, acepta >= 6", () => {
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

describe("TextField — requerido", () => {
  test("rechaza vacío, acepta texto", () => {
    const name = TextField("Nombre", "name");
    expect(name.validate("  ")).toBe(false);
    expect(name.validate("Ana")).toBe(true);
  });
});

describe("Proxy: addValidator sin perder los del tipo", () => {
  test("EmailField + validación extra sigue chequeando formato", () => {
    const email = EmailField();
    email.addValidator(MinLength(20, "Muy corto"));
    // formato inválido -> error del tipo (el extra no corre primero)
    expect(email.validate("abc")).toBe(false);
    expect(email.error.val).toBe("Invalid email address");
    // formato válido pero corto -> error extra
    expect(email.validate("a@b.co")).toBe(false);
    expect(email.error.val).toBe("Muy corto");
    // ambos pasan
    expect(email.validate("nombre.largo@ejemplo.com")).toBe(true);
  });

  test("campo base construido desde cero", () => {
    const monto = Field({ label: "Monto", name: "monto", inputType: "number" });
    monto.addValidator(Required("Ingresa un monto"));
    expect(monto.validate("")).toBe(false);
    expect(monto.validate("50")).toBe(true);
  });
});

describe("Form — itera las verificaciones por defecto", () => {
  test("no llama onSubmit si algún campo falla", async () => {
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

  test("llama onSubmit con los datos cuando todo pasa", async () => {
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

  test("Match: confirmar contraseña", async () => {
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
