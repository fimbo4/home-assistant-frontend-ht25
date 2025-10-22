import "../support/static-path";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { nothing } from "lit";
import { HuiTodoListCard } from "../../src/panels/lovelace/cards/hui-todo-list-card";
import { TodoSortMode } from "../../src/data/todo";

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
