import { Action, ActionPanel, Form, getPreferenceValues } from "@raycast/api";
import { useEffect, useState } from "react";

import {
  escapeJson,
  filterJson,
  jsonToGo,
  jsonToTypeScript,
  jsonToYaml,
  minifyJson,
  type JsonValue,
} from "./lib/json";

type Preferences = { rootName?: string; prefix?: string };

export default function Command() {
  const [input, setInput] = useState("");
  const [path, setPath] = useState("");
  const [output, setOutput] = useState("");
  const [value, setValue] = useState<JsonValue | undefined>();
  const [error, setError] = useState("");
  const preferences = getPreferenceValues<Preferences>();

  useEffect(() => {
    if (!input.trim()) {
      setOutput("");
      setValue(undefined);
      setError("");
      return;
    }
    const result = filterJson(input, path);
    setOutput(result.output);
    setValue(result.value);
    setError(result.error ?? "");
  }, [input, path]);

  const hasResult = value !== undefined && !error;
  const rootName = preferences.rootName?.trim() || "RootObject";
  const prefix = preferences.prefix?.trim() ?? "I";

  return (
    <Form
      navigationTitle="JSON Editor"
      actions={
        hasResult ? (
          <ActionPanel>
            <Action.CopyToClipboard title="Copy Formatted JSON" content={output} />
            <Action.CopyToClipboard title="Copy Minified JSON" content={minifyJson(value)} />
            <Action.CopyToClipboard title="Copy Escaped JSON" content={escapeJson(value)} />
            <Action.CopyToClipboard title="Convert to YAML" content={jsonToYaml(value)} />
            <Action.CopyToClipboard
              title="Convert to TypeScript"
              content={jsonToTypeScript(value, rootName, prefix)}
            />
            <Action.CopyToClipboard title="Convert to Go" content={jsonToGo(value, rootName)} />
          </ActionPanel>
        ) : null
      }
    >
      <Form.TextArea id="input" title="Input" placeholder="Paste JSON here..." value={input} onChange={setInput} />
      <Form.TextField
        id="path"
        title="Filter Path"
        placeholder='.users[0].name or ["key-with-dashes"]'
        value={path}
        onChange={setPath}
        error={error || undefined}
      />
      <Form.Description text="Safe paths support dotted properties, numeric indexes, and quoted bracket keys." />
      <Form.Separator />
      <Form.TextArea id="output" title="Result" value={output} onChange={setOutput} />
    </Form>
  );
}
