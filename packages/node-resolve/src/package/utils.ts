/* eslint-disable no-await-in-loop */
import path from 'path';
import fs from 'fs';

import { fileExists } from '../fs';

function isModuleDir(current: string, moduleDirs: readonly string[]) {
  return moduleDirs.some((dir) => current.endsWith(dir));
}

export async function findPackageJson(base: string, moduleDirs: readonly string[]) {
  const { root } = path.parse(base);
  let current = base;

  while (current !== root && !isModuleDir(current, moduleDirs)) {
    const pkgJsonPath = path.join(current, 'package.json');
    if (await fileExists(pkgJsonPath)) {
      const pkgJsonString = fs.readFileSync(pkgJsonPath, 'utf-8');
      return { pkgJson: JSON.parse(pkgJsonString), pkgPath: current, pkgJsonPath };
    }
    current = path.resolve(current, '..');
  }
  return null;
}

export function isUrl(str: string) {
  try {
    return !!new URL(str);
  } catch (_) {
    return false;
  }
}

/**
 * Conditions is an export object where all keys are conditions like 'node' (aka do not with '.')
 */
export function isConditions(exports: any) {
  return typeof exports === 'object' && Object.keys(exports).every((k) => !k.startsWith('.'));
}

/**
 * Mappings is an export object where all keys start with '.
 */
export function isMappings(exports: any) {
  return typeof exports === 'object' && !isConditions(exports);
}

/**
 * Check for mixed exports, which are exports where some keys start with '.' and some do not
 */
export function isMixedExports(exports: Record<string, any>) {
  const keys = Object.keys(exports);
  return keys.some((k) => k.startsWith('.')) && keys.some((k) => !k.startsWith('.'));
}

export function createBaseErrorMsg(importSpecifier: string, importer: string) {
  return `Could not resolve import "${importSpecifier}" in ${importer}`;
}

export function createErrorMsg(context: any, reason?: string, isImports?: boolean) {
  const { importSpecifier, importer, pkgJsonPath } = context;
  const base = createBaseErrorMsg(importSpecifier, importer);
  const field = isImports ? 'imports' : 'exports';
  return `${base} using ${field} defined in ${pkgJsonPath}.${reason ? ` ${reason}` : ''}`;
}

export class ResolveError extends Error {}

export class InvalidConfigurationError extends ResolveError {
  constructor(context: any, reason?: string) {
    super(createErrorMsg(context, `Invalid "exports" field. ${reason}`));
  }
}

export class InvalidModuleSpecifierError extends ResolveError {
  constructor(context: any, isImports?: boolean, reason?: string) {
    super(createErrorMsg(context, reason, isImports));
  }
}

export class InvalidPackageTargetError extends ResolveError {
  constructor(context: any, reason?: string) {
    super(createErrorMsg(context, reason));
  }
}
