import "../static/staticpath";
import { describe, it, expect } from "vitest";
import { HuiTodoListCard } from "../../../../src/panels/lovelace/cards/hui-todo-list-card";
import type { TodoItem } from "../../../../src/data/todo";

describe("hui-todo-list-card - tagging system", () => {
  it("Test adding and getting tags for _generateTags", () => {
    const todoCard = new HuiTodoListCard();
    // @ts-ignore
    const items: TodoItem[2] = [
      {
        summary: "Item1",
        uid: "276f830c-af42-11f0-aa44-339830d72eaf",
        status: "needs_action",
        due: null,
        description: "#tag1",
      },
      {
        summary: "Item2",
        uid: "6d51211e-af42-11f0-aa44-339830d72eaf",
        status: "needs_action",
        due: null,
        description: "#tag2 #tag4",
      },
      {
        summary: "Item3",
        uid: "723c9ece-af42-11f0-aa44-339830d72eaf",
        status: "needs_action",
        due: null,
        description: "#tag3 #tag4",
      },
    ];
    // @ts-ignore
    todoCard._generateTags(items);
    // @ts-ignore
    const result = todoCard.tags;
    const expectedResult = new Map([
      ["276f830c-af42-11f0-aa44-339830d72eaf", ["#tag1"]],
      ["6d51211e-af42-11f0-aa44-339830d72eaf", ["#tag2", "#tag4"]],
      ["723c9ece-af42-11f0-aa44-339830d72eaf", ["#tag3", "#tag4"]],
    ]);
    // @ts-ignore
    expect(result).toStrictEqual(expectedResult);
  });

  it("Test getting only one of each tag from _getUniqueTags", () => {
    const todoCard = new HuiTodoListCard();
    // @ts-ignore
    const items: TodoItem[2] = [
      {
        summary: "Item1",
        uid: "276f830c-af42-11f0-aa44-339830d72eaf",
        status: "needs_action",
        due: null,
        description: "#tag1",
      },
      {
        summary: "Item2",
        uid: "6d51211e-af42-11f0-aa44-339830d72eaf",
        status: "needs_action",
        due: null,
        description: "#tag2 #tag4",
      },
      {
        summary: "Item3",
        uid: "723c9ece-af42-11f0-aa44-339830d72eaf",
        status: "needs_action",
        due: null,
        description: "#tag3 #tag4",
      },
    ];
    // @ts-ignore
    todoCard._generateTags(items);
    // @ts-ignore
    const result = todoCard._getUniqueTags();
    const expectedResult = new Set(["#tag1", "#tag2", "#tag3", "#tag4"]);
    expect(result).toStrictEqual(expectedResult);
  });

  it("get_uids_from_tags", () => {
    const todoCard = new HuiTodoListCard();
    // @ts-ignore
    const items: TodoItem[2] = [
      {
        summary: "Item1",
        uid: "276f830c-af42-11f0-aa44-339830d72eaf",
        status: "needs_action",
        due: null,
        description: "#tag1",
      },
      {
        summary: "Item2",
        uid: "6d51211e-af42-11f0-aa44-339830d72eaf",
        status: "needs_action",
        due: null,
        description: "#tag2 #tag4",
      },
      {
        summary: "Item3",
        uid: "723c9ece-af42-11f0-aa44-339830d72eaf",
        status: "needs_action",
        due: null,
        description: "#tag3 #tag4",
      },
    ];
    // @ts-ignore
    todoCard._generateTags(items);
    // @ts-ignore
    const result = todoCard._getUidsFromTag("#tag4");
    const expectedResult = new Set([
      "6d51211e-af42-11f0-aa44-339830d72eaf",
      "723c9ece-af42-11f0-aa44-339830d72eaf",
    ]);

    // @ts-ignore
    expect(result).toStrictEqual(expectedResult);
  });

  it("Ensure TodoItems returned _getFilteredItems correspond to input tag", () => {
    const todoCard = new HuiTodoListCard();
    // @ts-ignore
    const items: TodoItem[2] = [
      {
        summary: "Item1",
        uid: "276f830c-af42-11f0-aa44-339830d72eaf",
        status: "needs_action",
        due: null,
        description: "#tag1",
      },
      {
        summary: "Item2",
        uid: "6d51211e-af42-11f0-aa44-339830d72eaf",
        status: "needs_action",
        due: null,
        description: "#tag2 #tag4",
      },
      {
        summary: "Item3",
        uid: "723c9ece-af42-11f0-aa44-339830d72eaf",
        status: "needs_action",
        due: null,
        description: "#tag3 #tag4",
      },
    ];
    // @ts-ignore
    todoCard._generateTags(items);
    // @ts-ignore
    const result = todoCard._getFilteredItems("#tag2", items);
    const expectedResult = [
      {
        summary: "Item2",
        uid: "6d51211e-af42-11f0-aa44-339830d72eaf",
        status: "needs_action",
        due: null,
        description: "#tag2 #tag4",
      },
    ];
    expect(result).toStrictEqual(expectedResult);
  });
});
