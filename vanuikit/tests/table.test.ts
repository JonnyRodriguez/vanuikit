import { describe, test, expect } from "bun:test";
import van from "vanjs-core";
import { Table, DataGrid } from "../src/components/table.js";

const tick = () => new Promise((r) => setTimeout(r, 0));

describe("Table / DataGrid", () => {
  const sampleData = [
    { id: 1, name: "Alice", score: 85 },
    { id: 2, name: "Bob", score: 92 },
    { id: 3, name: "Charlie", score: 78 },
  ];

  test("renders headers and rows with data", async () => {
    const el = Table({
      columns: [
        { key: "name", header: "Name" },
        { key: "score", header: "Score", align: "right" },
      ],
      data: sampleData,
    });

    document.body.appendChild(el);
    await tick();

    expect(el.textContent).toContain("Name");
    expect(el.textContent).toContain("Score");
    expect(el.textContent).toContain("Alice");
    expect(el.textContent).toContain("Bob");
    expect(el.textContent).toContain("Charlie");
  });

  test("sorts columns when clicking a sortable header", async () => {
    const el = DataGrid({
      columns: [
        { key: "name", header: "Name", sortable: true },
        { key: "score", header: "Score", sortable: true },
      ],
      data: sampleData,
    });

    document.body.appendChild(el);
    await tick();

    const scoreHeader = el.querySelectorAll("th")[1] as HTMLElement;
    // Click to sort asc
    scoreHeader.click();
    await tick();

    let rows = el.querySelectorAll("tbody tr");
    expect(rows[0].textContent).toContain("Charlie"); // score 78

    // Click to sort desc
    scoreHeader.click();
    await tick();

    rows = el.querySelectorAll("tbody tr");
    expect(rows[0].textContent).toContain("Bob"); // score 92
  });

  test("filters by search when searchable=true", async () => {
    const el = DataGrid({
      columns: [
        { key: "name", header: "Name" },
        { key: "score", header: "Score" },
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

  test("keeps the search input element while typing (no re-creation → no lost focus)", async () => {
    const el = DataGrid({
      columns: [
        { key: "name", header: "Name" },
        { key: "score", header: "Score" },
      ],
      data: sampleData,
      searchable: true,
    }) as HTMLElement;

    document.body.appendChild(el);
    await tick();

    const input = el.querySelector('input[type="text"]') as HTMLInputElement;
    expect(input).not.toBeNull();
    input.focus();

    for (const val of ["a", "al", "ali"]) {
      input.value = val;
      input.dispatchEvent(new Event("input"));
      await tick();
      // The same node must remain mounted (re-creation would drop focus).
      expect(el.contains(input)).toBe(true);
      expect(el.querySelector('input[type="text"]')).toBe(input);
    }
  });

  test("search input survives typing inside a reactive loading container (page pattern)", async () => {
    const loading = van.state(true);
    const el = van.tags.div(() => {
      if (loading.val) return van.tags.span("loading");
      return DataGrid({
        columns: [
          { key: "name", header: "Name" },
          { key: "score", header: "Score" },
        ],
        data: sampleData,
        searchable: true,
      });
    }) as HTMLElement;

    document.body.appendChild(el);
    await tick();
    expect(el.textContent).toContain("loading");

    loading.val = false;
    await tick();

    const input = el.querySelector('input[type="text"]') as HTMLInputElement;
    expect(input).not.toBeNull();
    input.focus();

    for (const val of ["a", "al", "ali"]) {
      input.value = val;
      input.dispatchEvent(new Event("input"));
      await tick();
      expect(el.contains(input)).toBe(true);
      expect(el.querySelector('input[type="text"]')).toBe(input);
    }
  });
});
