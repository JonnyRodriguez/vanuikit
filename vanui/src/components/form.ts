import van, { type ChildDom } from "vanjs-core";
import { Field } from "./field.js";

const FORM_BASE_CLASSES = "space-y-3";

type FormHandler = (data: Record<string, unknown>) => Promise<void> | void;

export type Form = {
  /** Registra campos; devuelve el form para encadenar. */
  add(...fields: Field[]): Form;
  /** El <form> con los campos y el footer; valida en cada submit. */
  dom(...footer: ChildDom[]): ChildDom;
};

/**
 * Form — fábrica (mismo esquema que Field/Button/Modal). Coordina los
 * campos: al submit junta los valores, corre las verificaciones de cada
 * Field (las del tipo + las extra) y solo llama al handler si todas pasan.
 */
export const Form = (handler: FormHandler): Form => {
  const fields: Field[] = [];

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    const formEl = e.target as HTMLFormElement;
    const data = Object.fromEntries(
      new FormData(formEl).entries(),
    ) as Record<string, unknown>;

    let valid = true;
    for (const f of fields) {
      const fieldValid = f.validate(data);
      if (!fieldValid) {
        valid = false;
      }
    }
    if (!valid) return;

    await handler(data);
  };

  const form: Form = {
    add(...more) {
      fields.push(...more);
      return form;
    },
    dom(...footer) {
      return van.tags.form(
        { onsubmit: handleSubmit, class: FORM_BASE_CLASSES },
        ...fields.map((f) => f.dom()),
        ...footer,
      );
    },
  };

  return form;
};
