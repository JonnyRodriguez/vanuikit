import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { createI18n, i18n as globalI18n } from "../src/i18n.js";

const nextTick = () => new Promise((resolve) => setTimeout(resolve, 10));

describe("createI18n", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const locales = {
    es: {
      greeting: "Hola {name}",
      common: {
        save: "Guardar",
      },
    },
    en: {
      greeting: "Hello {name}",
      common: {
        save: "Save",
      },
    },
  };

  test("resuelve traducciones anidadas e interpolación", () => {
    const i18n = createI18n({ defaultLocale: "es", locales });
    expect(i18n.raw("common.save")).toBe("Guardar");
    expect(i18n.raw("greeting", { name: "Mundo" })).toBe("Hola Mundo");
  });

  test("derivación reactiva con t() se actualiza al cambiar de idioma", async () => {
    const i18n = createI18n({ defaultLocale: "es", locales });
    const reactiveText = i18n.t("common.save");
    expect(reactiveText.val).toBe("Guardar");

    i18n.setLocale("en");
    expect(i18n.currentLocale.val).toBe("en");
    expect(document.documentElement.lang).toBe("en");

    await nextTick();
    expect(reactiveText.val).toBe("Save");
  });

  test("fallback al idioma por defecto si la llave falta en el secundario", () => {
    const localesWithMissing = {
      es: { missingInEn: "Disponible en español" },
      en: {},
    };
    const i18n = createI18n({ defaultLocale: "es", locales: localesWithMissing });
    i18n.setLocale("en");
    expect(i18n.raw("missingInEn")).toBe("Disponible en español");
  });

  test("createI18n sin opciones usa inglés por defecto con los diccionarios de la librería", () => {
    const i18n = createI18n();
    expect(i18n.getLocale()).toBe("en");
    expect(i18n.raw("dialog.cancel")).toBe("Cancel");
  });
});

describe("i18n — singleton (defaults de la librería)", () => {
  beforeEach(() => {
    localStorage.clear();
    // Blindar del orden de ejecución entre archivos: otros tests pueden
    // haber cambiado el locale del singleton (y localStorage es compartido).
    globalI18n.currentLocale.val = "en";
  });

  afterEach(() => {
    // El singleton se comparte entre archivos de test: restaurar el locale
    // para no envenenar a los que corren después.
    globalI18n.setLocale("en");
    localStorage.clear();
  });

  test("las claves de los componentes resuelven en inglés (sin leaks de español)", () => {
    expect(globalI18n.raw("field.email.required")).toBe("Please enter your email");
    expect(globalI18n.raw("field.confirm.mismatch")).toBe("Passwords do not match");
    expect(globalI18n.raw("modal.close")).toBe("Close");
    expect(globalI18n.raw("dropdown.empty")).toBe("No results found");
    expect(globalI18n.raw("dialog.confirmTitle")).toBe("Confirm action");
    expect(globalI18n.raw("theme.system")).toBe("System");
    expect(globalI18n.raw("nav.logout")).toBe("Sign out");
    expect(globalI18n.raw("table.showing", { start: 1, end: 5, total: 20 })).toBe(
      "Showing 1 - 5 of 20",
    );
  });

  test("el mismo diccionario resuelve en español", () => {
    globalI18n.setLocale("es");
    expect(globalI18n.raw("dialog.confirm")).toBe("Confirmar");
    expect(globalI18n.raw("table.prev")).toBe("← Anterior");
    expect(globalI18n.raw("field.email.label")).toBe("Correo electrónico");
  });
});

describe("addTranslations — registro en caliente", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("re-resuelve textos ya derivados al registrar traducciones nuevas", async () => {
    const inst = createI18n({
      defaultLocale: "en",
      locales: { en: { btn: "Save" } },
      storageKey: "test-hot",
    });
    const btn = inst.t("btn");
    expect(btn.val).toBe("Save");

    inst.addTranslations({ en: { btn: "Guardar" } });
    await nextTick();
    expect(btn.val).toBe("Guardar");
  });

  test("re-aplica un locale guardado que se registra después (caso fr)", () => {
    localStorage.setItem("test-late", "fr");
    const inst = createI18n({
      defaultLocale: "en",
      locales: { en: { hi: "Hello" } },
      storageKey: "test-late",
    });
    // "fr" estaba guardado pero aún no existía → cae al default
    expect(inst.getLocale()).toBe("en");

    inst.addTranslations({ fr: { hi: "Bonjour" } });
    expect(inst.getLocale()).toBe("fr");
    expect(inst.raw("hi")).toBe("Bonjour");
  });
});
