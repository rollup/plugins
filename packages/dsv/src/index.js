import { extname } from 'path';

import { csvParse, tsvParse } from 'd3-dsv';
import toSource from 'tosource';
import { createFilter } from '@rollup/pluginutils';
import stripBom from 'strip-bom';

const parsers = { '.csv': csvParse, '.tsv': tsvParse };

export default function dsv(options = {}) {
  const filter = createFilter(options.include, options.exclude);

  return {
    name: 'dsv',

    transform(code, id) {
      if (!filter(id)) return null;

      const ext = extname(id);
      if (!(ext in parsers)) return null;

      let rows = parsers[ext](stripBom(code));

      if (options.processRow) {
        rows = rows.map((row) => options.processRow(row, id) || row);
      }

      return {
        code: `export default ${toSource(rows)};`,
        map: { mappings: '' }
      };
    }
  };
}
