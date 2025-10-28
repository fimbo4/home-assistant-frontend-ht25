import { beforeAll } from "vitest";

beforeAll(() => {
  global.window = {} as any;
  global.navigator = {} as any;

  global.__DEMO__ = false;
  (global as any).__STATIC_PATH__ = "";
});
