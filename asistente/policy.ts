/**
 * policy — Normas de seguridad del asistente (STUB inicial).
 *
 * Toda toolCall pasa por aquí antes de ejecutarse. La forma es la importante:
 * cada herramienta se revisa y produce allow / confirm / deny. Las reglas concretas
 * crecerán aquí — NO es una frontera de seguridad completa todavía.
 */

import { resolve, sep } from "node:path";

export interface PolicyDecision {
    action: "allow" | "confirm" | "deny";
    reason?: string;
}

/** Comandos que jamás se ejecutan (ni siquiera con confirmación humana). */
const DENY_PATTERNS: RegExp[] = [
    /\brm\s+(-[a-z]*[rf][a-z]*\s+)+[^&;|]*[/\s]/i, // rm con -r y/o -f
    /(^|\s)sudo(\s|$)/,
    /(^|\s)su\s+\S/,
    /\bmkfs/i,
    /\b(shutdown|reboot|halt|poweroff)\b/,
    /\bdd\s+[^\n]*of=\//i,
    /\b:\(\)\s*\{[^}]*\}\s*;\s*:/, // fork bomb
    /\bcurl\b[^\n|]*\|\s*(ba)?sh\b/i, // remote → shell
    /\bwget\b[^\n|]*\|\s*(ba)?sh\b/i,
    /\bchmod\s+-R\s+777\s+\//,
    />\s*\/dev\/sd[a-z]/,
];

/** Prefijos de solo-lectura seguros: se ejecutan sin molestar al usuario. */
const ALLOW_PREFIXES = [
    "ls",
    "pwd",
    "cat ",
    "head ",
    "tail ",
    "grep ",
    "rg ",
    "find ",
    "wc ",
    "echo ",
    "which ",
    "git status",
    "git log",
    "git diff",
    "git branch",
    "bun test",
    "bun run typecheck",
];

export function reviewShellCommand(command: string): PolicyDecision {
    const cmd = command.trim();
    if (DENY_PATTERNS.some((re) => re.test(cmd))) {
        return { action: "deny", reason: "patrón prohibido por la política" };
    }
    if (ALLOW_PREFIXES.some((p) => cmd === p || cmd.startsWith(p + " ") || cmd.startsWith(p + "\n") || cmd.includes(" && " + p))) {
        return { action: "allow" };
    }
    // Fail-safe default: todo lo desconocido pide confirmación humana.
    return { action: "confirm" };
}

/** ¿`target` (absoluto o relativo) queda dentro de `baseDir`? */
export function isPathInside(baseDir: string, target: string): boolean {
    const resolved = resolve(baseDir, target);
    const base = resolve(baseDir);
    return resolved === base || resolved.startsWith(base + sep);
}

export function reviewToolCall(name: string, args: Record<string, unknown>): PolicyDecision {
    if (name === "read_file") {
        // El relay además valida contención de ruta; aquí solo la intención.
        return { action: "allow" };
    }
    if (name === "run_shell_command") {
        return reviewShellCommand(String(args.command ?? ""));
    }
    return { action: "confirm", reason: "herramienta desconocida" };
}
