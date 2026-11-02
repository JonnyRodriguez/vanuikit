/** Registers a minimal DOM (happy-dom) for component tests. */
import { GlobalRegistrator } from "@happy-dom/global-registrator";

// Base URL so location/history work in the router (about:blank does not allow pushState).
GlobalRegistrator.register({ url: "http://localhost/" });
