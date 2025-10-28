// IMPORTANT: define __STATIC_PATH__ before importing HA resources
import { describe, it, expect, vi, afterEach } from "vitest";
import type { HuiTodoListCard } from "../../../../src/panels/lovelace/cards/hui-todo-list-card";
import { TodoListEntityFeature } from "../../../../src/data/todo";

(globalThis as any).alert = (_msg?: any) => {
  /* no-op in tests */
};
(globalThis as any).__STATIC_PATH__ =
  (globalThis as any).__STATIC_PATH__ || "/";

// Dynamically import component AFTER setting __STATIC_PATH__
await import("../../../../src/panels/lovelace/cards/hui-todo-list-card");

// ---- Hass mock helpers ----
interface HassMock {
  states: Record<string, any>;
  locale: { language: string };
  themes: Record<string, unknown>;
  localize: (key: string, vars?: Record<string, any>) => string;
  connection: {
    subscribeMessage: (
      cb: (data: any) => void,
      _msg: any
    ) => Promise<() => void>;
  };
  // callService mocked per-test when needed
  callService?: (...args: any[]) => Promise<any>;
}

const makeHass = (supported: number): HassMock =>
  ({
    states: {
      "todo.sample": {
        entity_id: "todo.sample",
        state: "on",
        attributes: { supported_features: supported },
      },
    },
    locale: { language: "en" },
    themes: {},
    localize: (key: string) => key,
    connection: {
      subscribeMessage: async (_cb) => () => undefined,
    },
  }) as HassMock;

function createEl(): HuiTodoListCard {
  const el = document.createElement("hui-todo-list-card") as HuiTodoListCard;
  document.body.appendChild(el);
  return el;
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("hui-todo-list-card – inline delete", () => {
  it("renderar delete-ikon när DELETE_TODO_ITEM stöds", async () => {
    const el = createEl();
    (el as any).hass = makeHass(TodoListEntityFeature.DELETE_TODO_ITEM);
    el.setConfig({ type: "todo-list", entity: "todo.sample" });
    (el as any)._items = [
      { uid: "1", summary: "Milk", status: "needs_action" },
    ];

    await el.updateComplete;

    expect(el.shadowRoot!.querySelector(".deleteItemButton")).toBeTruthy();
  });

  it("klick på papperskorg triggar inte edit (stopPropagation)", async () => {
    const el = createEl();
    (el as any).hass = makeHass(TodoListEntityFeature.DELETE_TODO_ITEM);
    el.setConfig({ type: "todo-list", entity: "todo.sample" });
    (el as any)._items = [
      { uid: "1", summary: "Milk", status: "needs_action" },
    ];

    await el.updateComplete;

    const openSpy = vi.spyOn(el as any, "_openItem");
    el.shadowRoot!.querySelector<HTMLElement>(".deleteItemButton")!.click();
    await el.updateComplete;

    expect(openSpy).not.toHaveBeenCalled();
  });

  it("optimistisk UI och rollback när delete misslyckas", async () => {
    const el = createEl();
    const hass = makeHass(TodoListEntityFeature.DELETE_TODO_ITEM);
    hass.callService = vi.fn().mockRejectedValue(new Error("boom"));
    (el as any).hass = hass;

    el.setConfig({ type: "todo-list", entity: "todo.sample" });
    (el as any)._items = [
      { uid: "1", summary: "A", status: "needs_action" },
      { uid: "2", summary: "B", status: "needs_action" },
    ];
    await el.updateComplete;

    const before = el.shadowRoot!.querySelectorAll("ha-check-list-item").length;
    expect(before).toBe(2);

    el.shadowRoot!.querySelectorAll<HTMLElement>(
      ".deleteItemButton"
    )[0].click();
    await el.updateComplete;

    const mid = el.shadowRoot!.querySelectorAll("ha-check-list-item").length;
    expect(mid).toBe(1);

    await Promise.resolve();
    await el.updateComplete;

    const after = el.shadowRoot!.querySelectorAll("ha-check-list-item").length;
    expect(after).toBe(2);
    expect(hass.callService).toHaveBeenCalled();
  });
});
