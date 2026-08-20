# Project Knowledge Discovery & Architecture Audit

Quiero convertir este proyecto en un proyecto "AI-native": los agentes de IA deben poder entender y respetar de forma consistente su arquitectura, decisiones de diseño, stack tecnológico, patrones y reglas de implementación sin que yo tenga que explicar estas cosas repetidamente en cada conversación.

Por ahora NO quiero que construyas ningún sistema de memoria, MCP, RAG, vector database ni cambies el código.

Tu tarea en esta fase es exclusivamente **analizar el proyecto existente y proponer una primera base de conocimiento arquitectónico**.

## Objetivo

Analiza el repositorio completo y determina:

1. Qué arquitectura parece utilizar actualmente.
2. Qué stack tecnológico utiliza realmente.
3. Qué patrones de diseño e implementación existen.
4. Qué reglas y convenciones parecen seguirse.
5. Qué decisiones arquitectónicas ya están implícitas en el código.
6. Qué decisiones parecen deliberadas frente a cuáles parecen accidentales o históricas.
7. Qué partes del proyecto no siguen consistentemente la arquitectura detectada.
8. Qué conocimiento sería importante que un agente de IA conociera antes de modificar el proyecto.
9. Qué información falta para poder entender correctamente la arquitectura.
10. Qué contradicciones, deuda arquitectónica o decisiones dudosas existen.

---

# Reglas importantes

### NO inventes decisiones

No asumas que algo es una decisión arquitectónica simplemente porque aparece en el código.

Distingue cuidadosamente entre:

* hecho observado
* patrón inferido
* decisión probable
* decisión confirmada
* recomendación tuya

Cuando algo no esté claro, márcalo como:

`UNKNOWN`

o

`INFERRED`

No conviertas inferencias en reglas.

### NO modifiques código

En esta fase:

* no cambies código
* no refactorices
* no instales dependencias
* no cambies configuración
* no crees archivos dentro del proyecto

Solo analiza y presenta propuestas.

### Prioriza evidencia

Para cada conclusión importante indica brevemente de dónde proviene.

Ejemplo:

* `src/domain/...`
* `package.json`
* `README.md`
* configuración
* múltiples implementaciones similares
* tests
* comentarios existentes

---

# Analiza estas áreas

## 1. Project Overview

Describe brevemente:

* propósito aparente del proyecto
* principales componentes
* responsabilidades
* flujo general de la aplicación

---

## 2. Technology Stack

Identifica el stack REAL utilizado actualmente.

Incluye, cuando corresponda:

* runtime
* lenguaje
* framework
* frontend
* backend
* database
* ORM
* APIs
* authentication
* testing
* build tools
* package manager
* infraestructura
* deployment
* observability
* otros componentes importantes

Distingue entre:

`USED`

`CONFIGURED BUT UNUSED`

`PLANNED`

`UNKNOWN`

No asumas que una dependencia instalada significa que realmente se utiliza.

---

## 3. Architecture

Determina qué arquitectura utiliza actualmente el proyecto.

Por ejemplo, si aplica:

* layered
* hexagonal
* clean architecture
* modular monolith
* microservices
* event-driven
* MVC
* CQRS
* feature-based
* domain-driven
* u otra

No fuerces el proyecto a encajar en una categoría.

Si parece una combinación de varias arquitecturas, explícalo.

Describe:

* capas
* módulos
* dependencias
* límites
* dirección de dependencias
* entrada/salida de datos
* responsabilidades

Incluye un diagrama ASCII cuando sea útil.

---

## 4. Existing Patterns

Busca patrones que realmente estén presentes en el código.

Por ejemplo:

* Repository
* Service
* Factory
* Adapter
* Strategy
* Dependency Injection
* Event Bus
* DTO
* Mapper
* Use Case
* Command
* Query
* Middleware

Para cada patrón indica:

* dónde aparece
* cómo se utiliza
* si parece consistente
* si debería considerarse una convención oficial

---

## 5. Existing Rules & Conventions

Detecta reglas que parezcan existir.

Por ejemplo:

* naming
* estructura de carpetas
* imports
* acceso a database
* manejo de errores
* validación
* logging
* testing
* API design
* dependency injection
* separación de responsabilidades
* manejo de configuración
* seguridad

Clasifica cada una:

`OBSERVED`

`INFERRED`

`CONFIRMED`

No conviertas automáticamente estas reglas en reglas oficiales.

---

# 6. Architectural Decisions

Busca decisiones arquitectónicas existentes.

Para cada una crea una propuesta con:

* título
* decisión
* contexto
* evidencia
* alternativas aparentes
* consecuencias
* estado

Por ejemplo:

ADR candidate:

```text
Title:
PostgreSQL as primary persistence

Status:
INFERRED

Evidence:
...

Decision:
...

Reason:
UNKNOWN

Consequences:
...
```

No inventes el "Reason" si no existe evidencia.

---

# 7. Architectural Inconsistencies

Busca casos donde:

* diferentes partes hacen lo mismo de maneras diferentes
* una regla parece aplicarse en algunos módulos pero no en otros
* existen dos patrones para resolver el mismo problema
* existen dependencias que parecen romper la arquitectura
* hay código legacy que contradice el diseño predominante

Para cada caso explica:

* observación
* posible problema
* impacto
* si parece intencional o accidental
* pregunta que debería responder el desarrollador

No propongas todavía un refactor completo.

---

# 8. AI Agent Knowledge

Ahora cambia de perspectiva.

Imagina que mañana otro agente de IA entra al proyecto sin conocerlo.

¿Qué tendría que saber ANTES de implementar una nueva feature?

Construye una lista priorizada:

### Critical

Información que el agente debe conocer siempre.

### Important

Información que debería consultar cuando trabaje en determinadas áreas.

### Contextual

Información que solo necesita para tareas específicas.

---

# 9. Proposed Knowledge Structure

Propón una estructura inicial de conocimiento.

No crees los archivos todavía.

Sugiere algo parecido a:

```text
knowledge/
├── constitution/
├── architecture/
├── rules/
├── decisions/
├── patterns/
├── stack/
└── glossary/
```

Pero modifica esta estructura si el proyecto necesita otra cosa.

Para cada carpeta explica qué tipo de conocimiento debería contener.

---

# 10. Project Constitution

Propón una primera versión de los principios fundamentales que podrían formar la "Constitution" del proyecto.

IMPORTANTE:

No los presentes como decisiones confirmadas.

Clasifica cada principio como:

* CONFIRMED
* STRONGLY INFERRED
* PROPOSED

Ejemplo:

```text
Principle:
Business logic should remain independent from infrastructure.

Status:
STRONGLY INFERRED

Evidence:
...

Reasoning:
...
```

---

# 11. Knowledge Candidates

Genera una lista de documentos que sería conveniente crear.

Por ejemplo:

```text
knowledge/
├── constitution/
│   └── principles.md
│
├── architecture/
│   └── overview.md
│
├── rules/
│   ├── backend.md
│   └── database.md
│
├── decisions/
│   ├── ADR-001.md
│   └── ADR-002.md
│
└── patterns/
    ├── repository.md
    └── service.md
```

Para cada documento indica:

* propósito
* prioridad
* información que debería contener
* evidencia encontrada

---

# 12. Questions for the Developer

Finalmente, genera las preguntas que YO debería responder para convertir las inferencias en conocimiento oficial.

Prioriza las preguntas que realmente cambien la arquitectura.

Ejemplos:

* ¿Esta arquitectura es intencional?
* ¿Este patrón debe utilizarse siempre?
* ¿Esta dependencia está permitida?
* ¿Esta parte legacy será migrada?
* ¿Por qué se eligió esta tecnología?
* ¿Qué reglas son obligatorias?

No hagas preguntas triviales.

Máximo 15 preguntas.

---

# FORMATO DE RESPUESTA

No modifiques el proyecto.

Devuelve un informe estructurado exactamente con estas secciones:

1. Executive Summary
2. Current Architecture
3. Technology Stack
4. Existing Patterns
5. Existing Rules
6. Architectural Decisions
7. Inconsistencies & Technical Debt
8. Knowledge Required by AI Agents
9. Proposed Knowledge Structure
10. Proposed Constitution
11. Knowledge Candidates
12. Questions for the Developer
13. Recommended Next Step

Al final incluye una sección:

## Confidence

Indica qué partes de tu análisis tienen:

* HIGH confidence
* MEDIUM confidence
* LOW confidence

Recuerda:

**Tu trabajo ahora no es diseñar una arquitectura nueva.**

Tu trabajo es descubrir y documentar de manera rigurosa **la arquitectura que realmente existe**, distinguirla de la arquitectura que parece que debería existir y señalar dónde necesito tomar decisiones.

No escribas código en esta fase.
