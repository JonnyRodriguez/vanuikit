import { describe, test, expect, beforeEach, afterEach, afterAll } from "bun:test";
import { createI18n, i18n as globalI18n } from "../src/i18n.js";

const nextTick = () => new Promise((resolve) => setTimeout(resolve, 10));

// Tests below pin the global singleton to "es"; bun test runs the whole suite
// in one process, so restore the default to avoid leaking into other files.
afterAll(() => {
  localStorage.removeItem("vanuikit-locale");
  globalI18n.setLocale("en");
});

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

  test("resolves nested translations and interpolation", () => {
    const i18n = createI18n({ defaultLocale: "es", locales });
    expect(i18n.raw("common.save")).toBe("Guardar");
    // cSpell:disable — test-local es dictionary values, asserted verbatim.
    expect(i18n.raw("greeting", undefined, { name: "Mundo" })).toBe("Hola Mundo");
    // cSpell:enable
  });

  test("reactive derivation with t() updates on language change", async () => {
    const i18n = createI18n({ defaultLocale: "es", locales });
    const reactiveText = i18n.t("common.save");
    expect(reactiveText.val).toBe("Guardar");

    i18n.setLocale("en");
    expect(i18n.currentLocale.val).toBe("en");
    expect(document.documentElement.lang).toBe("en");

    await nextTick();
    expect(reactiveText.val).toBe("Save");
  });

  test("falls back to the default locale when the key is missing in the secondary one", () => {
    // cSpell:disable — test-local es dictionary values, asserted verbatim.
    const localesWithMissing = {
      es: { missingInEn: "Disponible en español" },
      en: {},
    };
    const i18n = createI18n({ defaultLocale: "es", locales: localesWithMissing });
    i18n.setLocale("en");
    expect(i18n.raw("missingInEn")).toBe("Disponible en español");
    // cSpell:enable
  });

  test("createI18n without options defaults to English with the library dictionaries", () => {
    const i18n = createI18n();
    expect(i18n.getLocale()).toBe("en");
    expect(i18n.raw("dialog.cancel")).toBe("Cancel");
  });
});

describe("i18n — singleton (library defaults)", () => {
  beforeEach(() => {
    localStorage.clear();
    // Shield from execution order across files: other tests may have changed
    // the singleton locale (and localStorage is shared).
    globalI18n.currentLocale.val = "en";
  });

  afterEach(() => {
    // The singleton is shared across test files: restore the locale so
    // later files are not poisoned.
    globalI18n.setLocale("en");
    localStorage.clear();
  });

  test("component keys resolve in English (no Spanish leaks)", () => {
    expect(globalI18n.raw("field.email.required")).toBe("Please enter your email");
    expect(globalI18n.raw("field.confirm.mismatch")).toBe("Passwords do not match");
    expect(globalI18n.raw("modal.close")).toBe("Close");
    expect(globalI18n.raw("dropdown.empty")).toBe("No results found");
    expect(globalI18n.raw("dialog.confirmTitle")).toBe("Confirm action");
    expect(globalI18n.raw("theme.system")).toBe("System");
    expect(globalI18n.raw("nav.logout")).toBe("Sign out");
    expect(globalI18n.raw("table.showing", undefined, { start: 1, end: 5, total: 20 })).toBe(
      "Showing 1 - 5 of 20",
    );
  });

  test("the same dictionary resolves in Spanish", () => {
    // cSpell:disable — asserted strings come from the builtin es dictionary.
    globalI18n.setLocale("es");
    expect(globalI18n.raw("dialog.confirm")).toBe("Confirmar");
    expect(globalI18n.raw("table.prev")).toBe("← Anterior");
    expect(globalI18n.raw("field.email.label")).toBe("Correo electrónico");
    // cSpell:enable
  });
});

describe("addTranslations — hot registration", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("re-resolves already derived texts when new translations are registered", async () => {
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

  test("re-applies a stored locale registered later (fr case)", () => {
    localStorage.setItem("test-late", "fr");
    const inst = createI18n({
      defaultLocale: "en",
      locales: { en: { hi: "Hello" } },
      storageKey: "test-late",
    });
    // "fr" was stored but did not exist yet → falls back to the default
    expect(inst.getLocale()).toBe("en");

    inst.addTranslations({ fr: { hi: "Bonjour" } });
    expect(inst.getLocale()).toBe("fr");
    expect(inst.raw("hi")).toBe("Bonjour");
  });
});
