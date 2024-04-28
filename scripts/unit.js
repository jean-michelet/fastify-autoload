'use strict'

const { exec } = require('node:child_process')

doExec('npm run unit:with-modules', {
  shell: true,
  env: {
    ...process.env,
    TS_NODE_DEV: 0
  }
})

doExec('npm run unit:with-ts-modules')

function doExec (cmd, opts = {}) {
    const child = exec(cmd, opts)
  
    child.stdout.pipe(process.stdout)
    child.stderr.pipe(process.stderr)
    child.once('close', process.exit)
  }