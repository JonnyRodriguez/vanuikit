import { State } from "vanjs-core";
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
/**
 * Hook reactivo para realizar peticiones GET / consultas a una API con VanJS.
 * Mantiene data, loading y error sincronizados con states de VanJS.
 */
export declare function createQuery<T>(url: string | (() => string), options?: QueryOptions<T>): QueryResult<T>;
/**
 * Hook reactivo para realizar mutaciones (POST, PUT, DELETE, PATCH) en APIs con VanJS.
 */
export declare function createMutation<TData = any, TVariables = any>(urlOrFn: string | ((variables: TVariables) => string) | ((variables: TVariables) => Promise<TData>), options?: MutationOptions<TData, TVariables>): MutationResult<TData, TVariables>;
//# sourceMappingURL=fetch.d.ts.map