/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** Generated Types - Root Name - Name used for the root generated type. */
  "rootName": string,
  /** Generated Types - Prefix - Optional prefix for generated TypeScript interfaces. */
  "prefix": string
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `edit-json` command */
  export type EditJson = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `edit-json` command */
  export type EditJson = {}
}

