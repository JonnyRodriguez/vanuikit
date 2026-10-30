/** Registra un DOM mínimo (happy-dom) para los tests de componentes. */
import { GlobalRegistrator } from "@happy-dom/global-registrator";

// URL base para que location/history funcionen en el router (about:blank no permite pushState).
GlobalRegistrator.register({ url: "http://localhost/" });
