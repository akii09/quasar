#!/usr/bin/env node

import '../lib/node-version-check.js'

import { version } from '../lib/version.js'
import { log, warn } from '../lib/helpers/logger.js'

const commands = [
  'dev',
  'build',
  'clean',
  'inspect',
  'describe',
  'ext',
  'run',
  'mode',
  'info',
  'new',
  'test',
  'help'
]

let cmd = process.argv[ 2 ]

if (cmd) {
  if (cmd.length === 1) {
    const mapToCmd = {
      d: 'dev',
      b: 'build',
      e: 'ext',
      r: 'run',
      c: 'clean',
      m: 'mode',
      i: 'info',
      n: 'new',
      t: 'test',
      h: 'help'
    }
    cmd = mapToCmd[ cmd ]
  }

  if (commands.includes(cmd)) {
    process.argv.splice(2, 1)
  }
  else {
    if (cmd === '-v' || cmd === '--version') {
      console.log(
        `@quasar/app-vite ${ version }`
        + (process.env.QUASAR_CLI_VERSION ? ` (@quasar/cli ${ process.env.QUASAR_CLI_VERSION })` : '')
      )
      process.exit(0)
    }

    if (cmd === '-h' || cmd === '--help') {
      cmd = 'help'
    }
    else if (cmd.indexOf('-') === 0) {
      warn('Command must come before the options')
      cmd = 'help'
    }
    else {
      log(`Looking for Quasar App Extension "${ process.argv[ 2 ] }" command${ (process.argv[ 3 ] && (' "' + process.argv[ 3 ] + '"')) || '' }`)

      const exit = process.exit
      process.exit = (code, reason) => {
        if (reason === 'ext-missing') {
          import('../lib/cmd/help.js')
          exit(0)
        }
        else {
          exit(code)
        }
      }

      cmd = 'run'
    }
  }
}
else {
  cmd = 'help'
}

import(`../lib/cmd/${ cmd }.js`)
