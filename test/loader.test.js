import compiler from "./compiler";
import fs from "fs";
import path from "path";

const getParentModule = modules => {
  return modules.find(m => m.name.indexOf("?") < 0);
};

it("should deny when there is no option.", async () => {
  const sourceFileName = "./fixtures/foo.js";
  const status = await compiler(sourceFileName, {});
  expect(status.hasErrors()).toBe(true);
  const errorMessage = status.toJson().errors[0];
  expect(errorMessage).toMatch(/no option/i);
});

it("should not include `export`.", async () => {
  const sourceFileName = "./fixtures/foo.js";
  const status = await compiler(sourceFileName, {
    tag: "foo",
    ids: ["a", "b"]
  });
  const parentModule = getParentModule(status.toJson().modules);
  expect(parentModule.source).not.toMatch(/export/);
});

it("should fork.", async () => {
  const sourceFileName = "./fixtures/foo.js";

  const status1 = await compiler(sourceFileName, {
    tag: "foo",
    ids: ["a"]
  });
  expect(status1.toJson().modules).toHaveLength(2);

  const status2 = await compiler(sourceFileName, {
    tag: "foo",
    ids: ["a", "b"]
  });
  expect(status2.toJson().modules).toHaveLength(3);
});

it("should import child requests in parent's source", async () => {
  const sourceFileName = "./fixtures/foo.js";

  const status1 = await compiler(sourceFileName, {
    tag: "foo",
    ids: ["a"]
  });
  const parentModule1 = getParentModule(status1.toJson().modules);
  expect(parentModule1.source).toMatch(/import ".*?\?fork-tag=foo&fork-id=a";/);

  const status2 = await compiler(sourceFileName, {
    tag: "foo",
    ids: ["a", "b"]
  });
  const parentModule2 = getParentModule(status2.toJson().modules);
  expect(parentModule2.source).toMatch(/import "[^"]*?\?fork-tag=foo&fork-id=a";/);
  expect(parentModule2.source).toMatch(/import "[^"]*?\?fork-tag=foo&fork-id=b";/);
});

it("should keep the source in forked stream.", async () => {
  const sourceFileName = "./fixtures/foo.js";
  const originalSource = fs.readFileSync(path.join(__dirname, sourceFileName)).toString();

  const status1 = await compiler(sourceFileName, {
    tag: "foo",
    ids: ["a"]
  });
  const forkedModule1 = status1.toJson().modules.find(m => m.name.indexOf("id=a") > -1);
  expect(forkedModule1.source).toBe(originalSource);

  const status2 = await compiler(sourceFileName, {
    tag: "foo",
    ids: ["a", "b"]
  });
  const forkedModule2a = status2.toJson().modules.find(m => m.name.indexOf("fork-id=a") > -1);
  expect(forkedModule2a.source).toBe(originalSource);
  const forkedModule2b = status2.toJson().modules.find(m => m.name.indexOf("fork-id=b") > -1);
  expect(forkedModule2b.source).toBe(originalSource);
});
