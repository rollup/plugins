export function isUrl(str) {
  try {
    return !!new URL(str);
  } catch (_) {
    return false;
  }
}

export function isConditions(exports) {
  return typeof exports === 'object' && Object.keys(exports).every((k) => !k.startsWith('.'));
}

export function isMappings(exports) {
  return typeof exports === 'object' && !isConditions(exports);
}

export function isMixedExports(exports) {
  const keys = Object.keys(exports);
  return keys.some((k) => k.startsWith('.')) && keys.some((k) => !k.startsWith('.'));
}

export function createBaseErrorMsg(importSpecifier, importer) {
  return `Could not resolve import "${importSpecifier}" in ${importer}`;
}

export function createErrorMsg(context, reason, internal) {
  const { importSpecifier, importer, pkgJsonPath } = context;
  const base = createBaseErrorMsg(importSpecifier, importer);
  const field = internal ? 'imports' : 'exports';
  return `${base} using ${field} defined in ${pkgJsonPath}.${reason ? ` ${reason}` : ''}`;
}

export class ResolveError extends Error {}

export class InvalidConfigurationError extends ResolveError {
  constructor(context, reason) {
    super(createErrorMsg(context, `Invalid "exports" field. ${reason}`));
  }
}

export class InvalidModuleSpecifierError extends ResolveError {
  constructor(context, internal) {
    super(createErrorMsg(context, internal));
  }
}

export class InvalidPackageTargetError extends ResolveError {
  constructor(context, reason) {
    super(createErrorMsg(context, reason));
  }
}
