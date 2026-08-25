import van, { State } from "vanjs-core";

export interface QueryOptions<T> {
  /** Función para transformar la respuesta */
  transform?: (raw: any) => T;
  /** Si debe ejecutar la petición inmediatamente al crearse (default: true) */
  immediate?: boolean;
  /** Opciones de init para pasar a fetch (headers, method, etc.) */
  init?: RequestInit | (() => RequestInit);
}

export interface QueryResult<T> {
  data: State<T | null>;
  loading: State<boolean>;
  error: State<string | null>;
  status: State<number | null>;
  refetch: () => Promise<T | null>;
  setData: (val: T | null) => void;
}

export interface MutationOptions<TData, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
  init?: RequestInit | (() => RequestInit);
}

export interface MutationResult<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<TData | null>;
  data: State<TData | null>;
  loading: State<boolean>;
  error: State<string | null>;
  reset: () => void;
}

function getStoredAuthHeaders(): Record<string, string> {
  try {
    if (typeof localStorage !== "undefined") {
      const token = localStorage.getItem("session_token");
      if (token) {
        return { Authorization: `Bearer ${token}` };
      }
    }
  } catch {}
  return {};
}

/**
 * Hook reactivo para realizar peticiones GET / consultas a una API con VanJS.
 * Mantiene data, loading y error sincronizados con states de VanJS.
 */
export function createQuery<T>(
  url: string | (() => string),
  options: QueryOptions<T> = {}
): QueryResult<T> {
  const { transform, immediate = true, init } = options;

  const data = van.state<T | null>(null);
  const loading = van.state<boolean>(immediate);
  const error = van.state<string | null>(null);
  const status = van.state<number | null>(null);

  const fetcher = async (): Promise<T | null> => {
    loading.val = true;
    error.val = null;

    try {
      const targetUrl = typeof url === "function" ? url() : url;
      const fetchInit = typeof init === "function" ? init() : init;

      const authHeaders = getStoredAuthHeaders();

      const res = await fetch(targetUrl, {
        credentials: "include",
        ...fetchInit,
        headers: {
          Accept: "application/json",
          ...authHeaders,
          ...(fetchInit?.headers || {}),
        },
      });

      status.val = res.status;

      if (!res.ok) {
        let errMessage = `Error ${res.status}: ${res.statusText}`;
        try {
          const body = await res.json();
          if (body && (body.error || body.message)) {
            errMessage = body.error || body.message;
          }
        } catch {
          // Si no es JSON, conservar mensaje por defecto
        }
        throw new Error(errMessage);
      }

      const json = await res.json();
      const parsedData = transform ? transform(json) : (json as T);
      data.val = parsedData;
      return parsedData;
    } catch (err: any) {
      error.val = err.message || "Error al realizar la petición";
      return null;
    } finally {
      loading.val = false;
    }
  };

  if (immediate) {
    fetcher();
  }

  const setData = (val: T | null) => {
    data.val = val;
  };

  return {
    data,
    loading,
    error,
    status,
    refetch: fetcher,
    setData,
  };
}

/**
 * Hook reactivo para realizar mutaciones (POST, PUT, DELETE, PATCH) en APIs con VanJS.
 */
export function createMutation<TData = any, TVariables = any>(
  urlOrFn:
    | string
    | ((variables: TVariables) => string)
    | ((variables: TVariables) => Promise<TData>),
  options: MutationOptions<TData, TVariables> = {}
): MutationResult<TData, TVariables> {
  const data = van.state<TData | null>(null);
  const loading = van.state<boolean>(false);
  const error = van.state<string | null>(null);

  const mutate = async (variables: TVariables): Promise<TData | null> => {
    loading.val = true;
    error.val = null;

    try {
      let result: TData;

      if (typeof urlOrFn === "function" && urlOrFn.length === 1 && typeof (urlOrFn as any)(variables) !== "string") {
        result = await (urlOrFn as (vars: TVariables) => Promise<TData>)(variables);
      } else {
        const targetUrl = typeof urlOrFn === "function" ? (urlOrFn as (v: TVariables) => string)(variables) : urlOrFn;
        const fetchInit = typeof options.init === "function" ? options.init() : options.init;
        const authHeaders = getStoredAuthHeaders();

        const res = await fetch(targetUrl, {
          method: "POST",
          credentials: "include",
          ...fetchInit,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...authHeaders,
            ...(fetchInit?.headers || {}),
          },
          body: JSON.stringify(variables),
        });

        if (!res.ok) {
          let errMessage = `Error ${res.status}: ${res.statusText}`;
          try {
            const body = await res.json();
            if (body && (body.error || body.message)) {
              errMessage = body.error || body.message;
            }
          } catch {
            // No JSON body
          }
          throw new Error(errMessage);
        }

        result = await res.json();
      }

      data.val = result;
      options.onSuccess?.(result, variables);
      return result;
    } catch (err: any) {
      const msg = err.message || "Error al ejecutar la acción";
      error.val = msg;
      options.onError?.(err, variables);
      return null;
    } finally {
      loading.val = false;
    }
  };

  const reset = () => {
    data.val = null;
    loading.val = false;
    error.val = null;
  };

  return {
    mutate,
    data,
    loading,
    error,
    reset,
  };
}
