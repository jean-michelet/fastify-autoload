'use strict'

const { exec } = require('node:child_process');

const major = Number(process.version.slice(1).split('.')[0]);
const loaderArg = major < 18  ? '--loader=ts-node/esm' : '--import=ts-node/esm';

const args = [
  'tap',
  `--node-arg=${loaderArg}`,
  '--node-arg=--experimental-specifier-resolution=node',
  '--no-coverage',
  'test/typescript-esm/*.ts'
];

const child = exec(args.join(' '), {
  shell: true,
  env: {
    ...process.env,
    TS_NODE_COMPILER_OPTIONS: JSON.stringify({
      module: 'ESNext',
      target: 'ES2020',
      allowJs: false,
      moduleResolution: 'node',
      esModuleInterop: true
    })
  }
});

child.stdout.pipe(process.stdout);
child.stderr.pipe(process.stderr);
child.once('close', process.exit);
