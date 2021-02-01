/* eslint-disable no-await-in-loop, no-undefined */
import { pathToFileURL } from 'url';

import { isUrl, InvalidModuleSpecifierError, InvalidPackageTargetError } from './utils';

function includesInvalidSegments(pathSegments, moduleDirs) {
  return pathSegments
    .split('/')
    .slice(1)
    .some((t) => ['.', '..', ...moduleDirs].includes(t));
}

async function resolvePackageTarget(context, { target, subpath, pattern, internal }) {
  if (typeof target === 'string') {
    if (!pattern && subpath.length > 0 && !target.endsWith('/')) {
      throw new InvalidModuleSpecifierError(context);
    }

    if (!target.startsWith('./')) {
      if (internal && !['/', '../'].some((p) => target.startsWith(p)) && !isUrl(target)) {
        // this is a bare package import, remap it and resolve it using regular node resolve
        if (pattern) {
          const result = await context.resolveId(
            target.replace(/\*/g, subpath),
            context.pkgURL.href
          );
          return result ? pathToFileURL(result.location) : null;
        }

        const result = await context.resolveId(`${target}${subpath}`, context.pkgURL.href);
        return result ? pathToFileURL(result.location) : null;
      }
      throw new InvalidPackageTargetError(context, `Invalid mapping: "${target}".`);
    }

    if (includesInvalidSegments(target, context.moduleDirs)) {
      throw new InvalidPackageTargetError(context, `Invalid mapping: "${target}".`);
    }

    const resolvedTarget = new URL(target, context.pkgURL);
    if (!resolvedTarget.href.startsWith(context.pkgURL.href)) {
      throw new InvalidPackageTargetError(
        context,
        `Resolved to ${resolvedTarget.href} which is outside package ${context.pkgURL.href}`
      );
    }

    if (includesInvalidSegments(subpath, context.moduleDirs)) {
      throw new InvalidModuleSpecifierError(context);
    }

    if (pattern) {
      return resolvedTarget.href.replace(/\*/g, subpath);
    }
    return new URL(subpath, resolvedTarget).href;
  }

  if (Array.isArray(target)) {
    let lastError;
    for (const item of target) {
      try {
        const resolved = await resolvePackageTarget(context, {
          target: item,
          subpath,
          pattern,
          internal
        });

        // return if defined or null, but not undefined
        if (resolved !== undefined) {
          return resolved;
        }
      } catch (error) {
        if (!(error instanceof InvalidPackageTargetError)) {
          throw error;
        } else {
          lastError = error;
        }
      }
    }

    if (lastError) {
      throw lastError;
    }
    return null;
  }

  if (target && typeof target === 'object') {
    const { packageBrowserField, useBrowserOverrides } = context;
    let browserTarget = null;

    if (useBrowserOverrides) {
      for (const [, value] of Object.entries(target)) {
        if (packageBrowserField[value]) {
          browserTarget = value;
        }
      }
    }

    for (const [key, value] of Object.entries(target)) {
      if (key === 'default' || context.conditions.includes(key)) {
        const resolved = await resolvePackageTarget(context, {
          target: browserTarget || value,
          subpath,
          pattern,
          internal
        });

        // return if defined or null, but not undefined
        if (resolved !== undefined) {
          return resolved;
        }
      }
    }
    return undefined;
  }

  if (target === null) {
    return null;
  }

  throw new InvalidPackageTargetError(context, `Invalid exports field.`);
}

export default resolvePackageTarget;
