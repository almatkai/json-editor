# JSON Editor for Tezbar

Format, filter, minify, escape, and convert JSON without leaving Tezbar.

## Features

- Pretty-print and minify JSON.
- Filter with safe paths such as `.users[0].name` and `["key-with-dashes"]`.
- Convert results to YAML, TypeScript interfaces, or Go structs.
- Copy every result from the action panel.

The upstream extension's executable JavaScript filter was intentionally replaced with a non-evaluating path parser so pasted filter text cannot run code.

## Compatibility

- Windows: built and exercised in Tezbar on Windows 11.
- macOS: uses only cross-platform Node.js and Raycast APIs and retains the upstream macOS-compatible command design.
- Linux: not currently declared.

## Local verification

```powershell
pnpm install
pnpm typecheck
pnpm test
```

## Credits

Adapted for Tezbar from Raycast's MIT-licensed `json-editor` extension at upstream commit `6734d85992290066fd31a7f5bee3cca3d3545a1a`. Original author and contributor remain credited in `package.json`.
