import compiler, { nestedCompiler } from "./compiler";
import fs from "fs";
import path from "path";

it("should deny when there is no option.", async () => {
  const sourceFileName = "./fixtures/foo.js";
  const status = await compiler(sourceFileName, {});
  expect(status.hasErrors()).toBe(true);
  const errorMessage = status.toJson().errors[0];
  expect(errorMessage).toMatch(/ValidationError/i);
});

it("should not include `export`.", async () => {
  const sourceFileName = "./fixtures/foo.js";
  const status = await compiler(sourceFileName, {
    tag: "foo",
    ids: ["a", "b"],
  });
  const parentModule = status.toJson().modules.find((m) => m.name.indexOf("?") < 0);
  expect(parentModule.source).not.toMatch(/export/);
});

it("should fork.", async () => {
  const sourceFileName = "./fixtures/foo.js";

  const status1 = await compiler(sourceFileName, {
    tag: "foo",
    ids: ["a"],
  });
  expect(status1.toJson().modules).toHaveLength(2);

  const status2 = await compiler(sourceFileName, {
    tag: "foo",
    ids: ["a", "b"],
  });
  expect(status2.toJson().modules).toHaveLength(3);
});

it("should import child requests in parent's source", async () => {
  const sourceFileName = "./fixtures/foo.js";

  const status1 = await compiler(sourceFileName, {
    tag: "foo",
    ids: ["a"],
  });
  const parentModule1 = status1.toJson().modules.find((m) => m.name.indexOf("?") < 0);
  expect(parentModule1.source).toMatch(/import ".*?\?fork-tag=foo&fork-id=a";/);

  const status2 = await compiler(sourceFileName, {
    tag: "foo",
    ids: ["a", "b"],
  });
  const parentModule2 = status2.toJson().modules.find((m) => m.name.indexOf("?") < 0);
  expect(parentModule2.source).toMatch(/import "[^"]*?\?fork-tag=foo&fork-id=a";/);
  expect(parentModule2.source).toMatch(/import "[^"]*?\?fork-tag=foo&fork-id=b";/);
});

it("should keep the source in forked stream.", async () => {
  const sourceFileName = "./fixtures/foo.js";
  const originalSource = fs.readFileSync(path.join(__dirname, sourceFileName)).toString();

  const status1 = await compiler(sourceFileName, {
    tag: "foo",
    ids: ["a"],
  });
  const forkedModule1 = status1.toJson().modules.find((m) => m.name.indexOf("id=a") > -1);
  expect(forkedModule1.source).toBe(originalSource);

  const status2 = await compiler(sourceFileName, {
    tag: "foo",
    ids: ["a", "b"],
  });
  const forkedModule2a = status2.toJson().modules.find((m) => m.name.indexOf("?fork-tag=foo&fork-id=a") > -1);
  expect(forkedModule2a.source).toBe(originalSource);
  const forkedModule2b = status2.toJson().modules.find((m) => m.name.indexOf("?fork-tag=foo&fork-id=b") > -1);
  expect(forkedModule2b.source).toBe(originalSource);
});

it("should handle nested fork.", async () => {
  const sourceFileName = "./fixtures/foo.js";
  const originalSource = fs.readFileSync(path.join(__dirname, sourceFileName)).toString();
  const status = await nestedCompiler(sourceFileName);
  const buf = status.toJson().modules.find((m) => m.name.indexOf("1 modules") > -1);
  const grandParentModule = buf.modules.find((m) => m.name.indexOf("?") < 0);
  expect(grandParentModule.source).toMatch(/import ".*?\?fork-tag=foo&fork-id=a";/);
  const parentModule = buf.modules.find((m) => m.name.indexOf("?fork-tag=foo&fork-id=a") > -1);
  expect(parentModule.source).toMatch(/import ".*?\?fork-tag=foo&fork-id=a&fork-tag=bar&fork-id=b";/);
  const childModule = status
    .toJson()
    .modules.find((m) => m.name.indexOf("?fork-tag=foo&fork-id=a&fork-tag=bar&fork-id=b") > -1);
  expect(childModule.source).toBe(originalSource);
});
