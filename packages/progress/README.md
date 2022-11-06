## Introduction

Rewrite [rollup-plugin-progress](https://github.com/jkuri/rollup-plugin-progress) in typescript.

## @rollup/plugin-progress

Show current module being transpiled by the rollup bundler.

<img src="https://cloud.githubusercontent.com/assets/1796022/20893960/02d1b622-bb14-11e6-8ef5-dd5282248ecb.gif">

### Installation

```shell
npm i -D @rollup/plugin-progress
```

### Usage

Include the following in the rollup config

```typescript
import { defineConfig } from 'rollup';
import progress from '@rollup/plugin-progress';

const rollupConfig = defineConfig({
  plugins: [
    progress({
      clearLine: false // default: true
    })
  ]
});

export default rollupConfig;
```
