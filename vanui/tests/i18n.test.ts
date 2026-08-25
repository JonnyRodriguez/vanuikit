import { describe, test, expect, beforeEach } from "bun:test";
import { createI18n } from "../src/i18n.js";

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
});
