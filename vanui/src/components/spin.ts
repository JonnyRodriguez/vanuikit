import van from "vanjs-core";

/** Indicador de carga: spinner animado + mensaje. */
export const Spin = (msg = "") => {
  const { div } = van.tags;

  return div(
    { class: "flex flex-col items-center justify-center py-8" },
    div({
      class:
        "animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-accent mb-3",
    }),
    msg ? div({ class: "text-base text-foreground-soft" }, msg) : null,
  );
};
