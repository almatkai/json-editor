import { dump } from "js-yaml";

export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
export type FilterResult = { output: string; value?: JsonValue; error?: string };

function parseInput(input: string): JsonValue {
  try {
    return JSON.parse(input) as JsonValue;
  } catch {
    const unescaped = JSON.parse(`"${input.replace(/"/g, '\\"')}"`) as string;
    return JSON.parse(unescaped) as JsonValue;
  }
}

function parseSingleQuotedKey(value: string): string {
  return value.slice(1, -1).replace(/\\'/g, "'").replace(/\\\\/g, "\\");
}

export function parseJsonPath(path: string): Array<string | number> {
  const source = path.trim();
  if (!source) return [];
  const parts: Array<string | number> = [];
  let index = source.startsWith("$") ? 1 : 0;

  while (index < source.length) {
    if (source[index] === ".") {
      index += 1;
      const match = source.slice(index).match(/^[A-Za-z_$][\w$]*/);
      if (!match) throw new Error(`Invalid property at character ${index + 1}.`);
      parts.push(match[0]);
      index += match[0].length;
      continue;
    }
    if (source[index] === "[") {
      const end = source.indexOf("]", index + 1);
      if (end < 0) throw new Error("Missing closing bracket in filter path.");
      const raw = source.slice(index + 1, end).trim();
      if (/^\d+$/.test(raw)) parts.push(Number(raw));
      else if (raw.startsWith('"') && raw.endsWith('"')) parts.push(JSON.parse(raw) as string);
      else if (raw.startsWith("'") && raw.endsWith("'")) parts.push(parseSingleQuotedKey(raw));
      else throw new Error(`Invalid bracket key at character ${index + 1}.`);
      index = end + 1;
      continue;
    }
    throw new Error(`Expected '.' or '[' at character ${index + 1}.`);
  }
  return parts;
}

function valueAtPath(root: JsonValue, path: Array<string | number>): JsonValue {
  let current: JsonValue = root;
  for (const part of path) {
    if (Array.isArray(current) && typeof part === "number" && part < current.length) {
      current = current[part] as JsonValue;
      continue;
    }
    if (
      current !== null &&
      typeof current === "object" &&
      !Array.isArray(current) &&
      typeof part === "string" &&
      Object.prototype.hasOwnProperty.call(current, part)
    ) {
      current = current[part] as JsonValue;
      continue;
    }
    throw new Error(`Path segment ${JSON.stringify(part)} was not found.`);
  }
  return current;
}

export function filterJson(input: string, path = ""): FilterResult {
  try {
    const root = parseInput(input);
    const value = valueAtPath(root, parseJsonPath(path));
    return { value, output: JSON.stringify(value, null, 2) };
  } catch (error) {
    return { output: "", error: String((error as Error).message || "Invalid JSON") };
  }
}

export function minifyJson(value: JsonValue): string {
  return JSON.stringify(value);
}

export function escapeJson(value: JsonValue): string {
  const minified = JSON.stringify(value);
  return JSON.stringify(minified).slice(1, -1);
}

export function jsonToYaml(value: JsonValue): string {
  return dump(value, { noRefs: true, sortKeys: false, lineWidth: 100 });
}

function pascalCase(value: string): string {
  const result = value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[^A-Za-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join("");
  return /^[A-Za-z_]/.test(result) ? result : `Value${result || "Object"}`;
}

function tsProperty(value: string): string {
  return /^[A-Za-z_$][\w$]*$/.test(value) ? value : JSON.stringify(value);
}

export function jsonToTypeScript(value: JsonValue, rootName = "RootObject", prefix = "I"): string {
  const interfaces: string[] = [];
  const seen = new Set<string>();

  const typeFor = (candidate: JsonValue, suggestedName: string): string => {
    if (candidate === null) return "null";
    if (typeof candidate === "string") return "string";
    if (typeof candidate === "number") return "number";
    if (typeof candidate === "boolean") return "boolean";
    if (Array.isArray(candidate)) {
      const sample = candidate.find((item) => item !== null);
      return sample === undefined ? "unknown[]" : `${typeFor(sample, `${suggestedName}Item`)}[]`;
    }

    const interfaceName = `${prefix}${pascalCase(suggestedName)}`;
    if (!seen.has(interfaceName)) {
      seen.add(interfaceName);
      const fields = Object.entries(candidate).map(
        ([key, child]) => `  ${tsProperty(key)}: ${typeFor(child, `${suggestedName}${pascalCase(key)}`)};`,
      );
      interfaces.push(`export interface ${interfaceName} {\n${fields.join("\n")}\n}`);
    }
    return interfaceName;
  };

  const rootType = typeFor(value, rootName);
  if (interfaces.length === 0) return `export type ${pascalCase(rootName)} = ${rootType};`;
  return interfaces.reverse().join("\n\n");
}

function goField(value: string): string {
  const field = pascalCase(value);
  return /^[A-Za-z]/.test(field) ? field : `Field${field}`;
}

export function jsonToGo(value: JsonValue, rootName = "RootObject"): string {
  const declarations: string[] = [];
  const seen = new Set<string>();

  const typeFor = (candidate: JsonValue, suggestedName: string): string => {
    if (candidate === null) return "any";
    if (typeof candidate === "string") return "string";
    if (typeof candidate === "number") return "float64";
    if (typeof candidate === "boolean") return "bool";
    if (Array.isArray(candidate)) {
      const sample = candidate.find((item) => item !== null);
      return sample === undefined ? "[]any" : `[]${typeFor(sample, `${suggestedName}Item`)}`;
    }

    const structName = pascalCase(suggestedName);
    if (!seen.has(structName)) {
      seen.add(structName);
      const fields = Object.entries(candidate).map(
        ([key, child]) => `\t${goField(key)} ${typeFor(child, `${suggestedName}${pascalCase(key)}`)} \`json:"${key}"\``,
      );
      declarations.push(`type ${structName} struct {\n${fields.join("\n")}\n}`);
    }
    return structName;
  };

  const rootType = typeFor(value, rootName);
  if (declarations.length === 0) return `type ${pascalCase(rootName)} ${rootType}`;
  return declarations.reverse().join("\n\n");
}
