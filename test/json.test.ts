import assert from "node:assert/strict";
import test from "node:test";
import { filterJson, jsonToGo, jsonToTypeScript, parseJsonPath } from "../src/lib/json";

const fixture = '{"users":[{"name":"Ada","active":true}],"key-with-dashes":42}';

test("filters safe dotted, indexed, and quoted paths", () => {
  assert.deepEqual(parseJsonPath('.users[0].name'), ["users", 0, "name"]);
  assert.equal(filterJson(fixture, '.users[0].name').output, '"Ada"');
  assert.equal(filterJson(fixture, '["key-with-dashes"]').output, "42");
});

test("rejects executable filter expressions", () => {
  assert.match(filterJson(fixture, '.users.map(x=>x.name)').error ?? "", /Expected|Invalid/);
});

test("converts JSON objects to TypeScript and Go definitions", () => {
  const parsed = JSON.parse(fixture);
  assert.match(jsonToTypeScript(parsed), /export interface IRootObject/);
  assert.match(jsonToTypeScript(parsed), /name: string/);
  assert.match(jsonToGo(parsed), /type RootObject struct/);
  assert.match(jsonToGo(parsed), /json:"users"/);
});
