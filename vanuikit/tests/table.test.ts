import { describe, test, expect } from "bun:test";
import { Table, DataGrid } from "../src/components/table.js";

const tick = () => new Promise((r) => setTimeout(r, 0));

describe("Table / DataGrid", () => {
  const sampleData = [
    { id: 1, name: "Alice", score: 85 },
    { id: 2, name: "Bob", score: 92 },
    { id: 3, name: "Charlie", score: 78 },
  ];

  test("renderiza cabeceras y filas con datos", async () => {
    const el = Table({
      columns: [
        { key: "name", header: "Nombre" },
        { key: "score", header: "Puntaje", align: "right" },
      ],
      data: sampleData,
    });

    document.body.appendChild(el);
    await tick();

    expect(el.textContent).toContain("Nombre");
    expect(el.textContent).toContain("Puntaje");
    expect(el.textContent).toContain("Alice");
    expect(el.textContent).toContain("Bob");
    expect(el.textContent).toContain("Charlie");
  });

  test("ordena columnas al hacer clic en cabecera sortable", async () => {
    const el = DataGrid({
      columns: [
        { key: "name", header: "Nombre", sortable: true },
        { key: "score", header: "Puntaje", sortable: true },
      ],
      data: sampleData,
    });

    document.body.appendChild(el);
    await tick();

    const scoreHeader = el.querySelectorAll("th")[1] as HTMLElement;
    // Clic para ordenar asc
    scoreHeader.click();
    await tick();

    let rows = el.querySelectorAll("tbody tr");
    expect(rows[0].textContent).toContain("Charlie"); // score 78

    // Clic para ordenar desc
    scoreHeader.click();
    await tick();

    rows = el.querySelectorAll("tbody tr");
    expect(rows[0].textContent).toContain("Bob"); // score 92
  });

  test("filtra por búsqueda cuando searchable=true", async () => {
    const el = DataGrid({
      columns: [
        { key: "name", header: "Nombre" },
        { key: "score", header: "Puntaje" },
      ],
      data: sampleData,
      searchable: true,
    });

    document.body.appendChild(el);
    await tick();

    const searchInput = el.querySelector('input[type="text"]') as HTMLInputElement;
    expect(searchInput).not.toBeNull();

    searchInput.value = "ali";
    searchInput.dispatchEvent(new Event("input"));
    await tick();

    const rows = el.querySelectorAll("tbody tr");
    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain("Alice");
  });
});
