// IMPORTANT: define __STATIC_PATH__ before importing HA resources
import { nothing } from "lit";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { HuiTodoListCard } from "../../../../src/panels/lovelace/cards/hui-todo-list-card";
import { TodoListEntityFeature, TodoSortMode } from "../../../../src/data/todo";
import "../../../support/static-path";

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
  it("renders delete icon where DELETE TODOITEM is supported", async () => {
    const el = createEl();
    (el as any).hass = makeHass(TodoListEntityFeature.DELETE_TODO_ITEM);
    el.setConfig({ type: "todo-list", entity: "todo.sample" });
    (el as any)._items = [
      { uid: "1", summary: "Milk", status: "needs_action" },
    ];

    await el.updateComplete;

    expect(el.shadowRoot!.querySelector(".deleteItemButton")).toBeTruthy();
  });

  it("clicking on trash does not trigger edit (stopPropagation)", async () => {
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

  it("optimistic UI and rollback when delete fails", async () => {
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

const mockHass = {
  localize: (key: string) => key,
  states: {},
  callService: vi.fn(),
  connection: { subscribeMessage: vi.fn() },
  locale: { language: "en" },
} as any;

describe("hui-todo-list-card basic behavior", () => {
  let element: HuiTodoListCard;

  beforeEach(() => {
    element = new HuiTodoListCard();
    element.hass = mockHass;
    (element as any)._config = { entity: "todo.test" } as any;
    (element as any)._perListSort = new Map();

    // Mock localStorage
    const store: Record<string, string> = {};
    global.localStorage = {
      getItem: (k: string) => (k in store ? store[k] : null),
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
      clear: () => {
        Object.keys(store).forEach((k) => delete store[k]);
      },
    } as any;
  });

  it("_toggleSorting updates config and writes localStorage", () => {
    (element as any)._entityId = "todo.test";
    (element as any)._config = { display_order: TodoSortMode.NONE } as any;

    (element as any)._toggleSorting(TodoSortMode.ALPHA_ASC);

    expect((element as any)._config!.display_order).toBe(
      TodoSortMode.ALPHA_ASC
    );
    expect(
      localStorage.getItem(`todo-sort:${(element as any)._entityId}`)
    ).toBe(TodoSortMode.ALPHA_ASC);
  });

  it("_handlePrimaryMenuAction dispatches to the proper handlers", () => {
    const spySort = vi.spyOn(element as any, "_toggleSorting");
    const spyReorder = vi.spyOn(element as any, "_toggleReorder");

    (element as any)._handlePrimaryMenuAction({ detail: { index: 0 } });
    expect(spyReorder).toHaveBeenCalled();

    (element as any)._handlePrimaryMenuAction({ detail: { index: 1 } });
    expect(spySort).toHaveBeenCalledWith(TodoSortMode.ALPHA_ASC);
    (element as any)._handlePrimaryMenuAction({ detail: { index: 1 } });
    expect(spySort).toHaveBeenCalledWith(TodoSortMode.ALPHA_DESC);

    (element as any)._handlePrimaryMenuAction({ detail: { index: 2 } });
    expect(spySort).toHaveBeenCalledWith(TodoSortMode.DUEDATE_ASC);
    (element as any)._handlePrimaryMenuAction({ detail: { index: 2 } });
    expect(spySort).toHaveBeenCalledWith(TodoSortMode.DUEDATE_DESC);
  });

  it("_todoListSupportsSorting returns true for known modes and false otherwise", () => {
    expect((element as any)._todoListSupportsSorting(TodoSortMode.NONE)).toBe(
      true
    );
    expect(
      (element as any)._todoListSupportsSorting(TodoSortMode.ALPHA_ASC)
    ).toBe(true);
    expect(
      (element as any)._todoListSupportsSorting(TodoSortMode.ALPHA_DESC)
    ).toBe(true);
    expect(
      (element as any)._todoListSupportsSorting(TodoSortMode.DUEDATE_ASC)
    ).toBe(true);
    expect(
      (element as any)._todoListSupportsSorting(TodoSortMode.DUEDATE_DESC)
    ).toBe(true);
    expect(
      (element as any)._todoListSupportsSorting("some_unknown" as any)
    ).toBe(false);
  });

  it("_renderMenu returns a template when features are supported, otherwise nothing", () => {
    (element as any)._todoListSupportsFeature = () => true;
    const tpl = (element as any)._renderMenu({} as any, false);
    expect(tpl).not.toBe(nothing);

    (element as any)._todoListSupportsFeature = () => false;
    const noneTpl = (element as any)._renderMenu({} as any, false);
    expect(noneTpl).toBe(nothing);
  });

  it("setConfig restores saved sort from localStorage", () => {
    const key = `todo-sort:todo.test`;
    localStorage.setItem(key, TodoSortMode.ALPHA_DESC as any);

    element.setConfig({ entity: "todo.test" } as any);

    expect((element as any)._config!.display_order).toBe(
      TodoSortMode.ALPHA_DESC
    );
  });

  it("willUpdate saves old entity sort and restores new entity sort from localStorage", () => {
    (element as any)._config = { display_order: TodoSortMode.ALPHA_ASC } as any;
    (element as any)._entityId = "todo.new";

    localStorage.setItem(
      `todo-sort:todo.new`,
      TodoSortMode.DUEDATE_DESC as any
    );

    // Simulate willUpdate where old entity was 'todo.old'
    const changed = new Map();
    changed.set("_entityId", "todo.old");

    // Ensure the element appears to have updated previously
    (element as any).hasUpdated = true;
    (element as any).willUpdate(changed);

    expect(localStorage.getItem("todo-sort:todo.old")).toBe(
      TodoSortMode.ALPHA_ASC
    );

    expect((element as any)._config!.display_order).toBe(
      TodoSortMode.DUEDATE_DESC
    );
  });
});
