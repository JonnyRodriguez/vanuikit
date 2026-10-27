/** Registra un DOM mínimo (happy-dom) para los tests de la POC. */
import { GlobalRegistrator } from "@happy-dom/global-registrator";

GlobalRegistrator.register({ url: "http://localhost/" });
