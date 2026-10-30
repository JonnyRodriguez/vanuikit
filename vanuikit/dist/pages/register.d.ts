export type AuthResult = {
    error: string;
} | {
    ok?: boolean;
} | {};
/** Lo que RegisterForm necesita de su orquestador. */
export interface RegisterInfo {
    handleRegister: (data: Record<string, unknown>) => Promise<AuthResult>;
}
/**
 * Formulario de registro limpio.
 * Los campos ya traen sus etiquetas, placeholders y validaciones por defecto.
 * Usa el contrato de Form v3: submitting, línea general y sin doble submit.
 */
export declare const RegisterForm: (info: RegisterInfo) => HTMLDivElement;
//# sourceMappingURL=register.d.ts.map