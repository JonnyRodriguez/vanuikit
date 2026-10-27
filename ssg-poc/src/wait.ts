// ssg-poc/src/wait.ts
/**
 * Utilidades de espera compartidas por el SSG (build) y los tests:
 * el render en build debe ESPERAR a que las queries resuelvan antes de
 * serializar, o el HTML quedaría con el skeleton.
 */

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Espera a que la página termine de cargar datos. Las páginas marcan su
 * zona de contenido con `data-loading="true"` mientras no hay data (ni
 * error) y lo conmutan a "false" al resolver.
 *
 * (Gotcha van: un prop reactivo que devuelve null NO elimina el atributo —
 * setAttribute escribe "null" — así que el marcador no puede apoyarse en
 * la ausencia del atributo.)
 *
 * Lanza si excede el timeout — el SSG NO debe publicar una página a medio
 * cargar.
 */
export const waitForReady = async (timeoutMs = 3000): Promise<void> => {
  const start = Date.now();
  while (document.querySelector('[data-loading="true"]')) {
    if (Date.now() - start > timeoutMs) {
      throw new Error('waitForReady: timeout — [data-loading="true"] sigue presente');
    }
    await sleep(25);
  }
};
