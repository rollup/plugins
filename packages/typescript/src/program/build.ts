import { PluginContext } from 'rollup';

import { buildDiagnosticReporter } from '../diagnostics/emit';
import { CreateProgramOptions, BuilderProgram } from '.';

export default function createBuildProgram(
  ts: typeof import('typescript'),
  context: PluginContext,
  { formatHost, parsedOptions, writeFile, resolveModule }: CreateProgramOptions
) {
  const createProgram = ts.createEmitAndSemanticDiagnosticsBuilderProgram;
  const reportDiagnostic = buildDiagnosticReporter(ts, context, formatHost);

  const hostOverrides: Partial<import('typescript').SolutionBuilderHostBase<BuilderProgram>> = {
    writeFile,
    /** Add helper to deal with module resolution */
    resolveModuleNames(moduleNames, containingFile) {
      return moduleNames.map((moduleName) => resolveModule(moduleName, containingFile));
    }
  }

  if (process.env.ROLLUP_WATCH === 'true') {
    const host = ts.createSolutionBuilderWithWatchHost(
      ts.sys,
      createProgram,
      reportDiagnostic
    )
    Object.assign(host, hostOverrides);

    return ts.createSolutionBuilderWithWatch(
      host,
      parsedOptions.fileNames,
      parsedOptions.options
    )
  } else {
    const host = ts.createSolutionBuilderHost(
      ts.sys,
      createProgram,
      reportDiagnostic
    )
    Object.assign(host, hostOverrides);

    return ts.createSolutionBuilder(
      host,
      parsedOptions.fileNames,
      parsedOptions.options
    )
  }
}
