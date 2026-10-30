export type AuthResult = {
    error: string;
} | {
    ok?: boolean;
} | {};
/** Lo que LoginForm necesita de su orquestador. */
export interface LoginInfo {
    handleLogin: (data: Record<string, unknown>) => Promise<AuthResult>;
}
/**
 * Formulario de login limpio y directo.
 * Los campos resuelven sus etiquetas, placeholders y validaciones automáticamente.
 * Usa el contrato de Form v3: submitting, línea general y sin doble submit.
 */
export declare const LoginForm: (info: LoginInfo) => HTMLDivElement;
//# sourceMappingURL=login.d.ts.map