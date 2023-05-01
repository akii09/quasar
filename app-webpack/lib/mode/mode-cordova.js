import fs from 'node:fs'
import fse from 'fs-extra'

import appPaths from '../app-paths.js'
import { log, warn, fatal } from '../helpers/logger.js'
import { spawnSync } from '../helpers/spawn.js'
import { ensureWWW, ensureConsistency } from '../cordova/ensure-consistency.js'

export class Mode {
  get isInstalled () {
    return fs.existsSync(appPaths.cordovaDir)
  }

  async add (target) {
    if (this.isInstalled) {
      warn('Cordova support detected already. Aborting.')
      return
    }

    const pkg = JSON.parse(
      fs.readFileSync(appPaths.resolve.app('package.json'), 'utf-8')
    )
    const appName = pkg.productName || pkg.name || 'Quasar App'

    if (/^[0-9]/.test(appName)) {
      warn(
        'App product name cannot start with a number. '
        + 'Please change the "productName" prop in your /package.json then try again.'
      )
      return
    }

    const { default: inquirer } = await import('inquirer')

    console.log()
    const answer = await inquirer.prompt([ {
      name: 'appId',
      type: 'input',
      message: 'What is the Cordova app id?',
      default: 'org.cordova.quasar.app',
      validate: appId => (appId ? true : 'Please fill in a value')
    } ])

    log('Creating Cordova source folder...')

    spawnSync(
      'cordova',
      [ 'create', 'src-cordova', answer.appId, appName ],
      { cwd: appPaths.appDir },
      () => {
        fatal('There was an error trying to install Cordova support')
      }
    )

    ensureWWW(true)

    log('Cordova support was installed')
    log(`App name was taken from package.json: "${ appName }"`)
    log()
    warn('If you want a different App name then remove Cordova support, edit productName field from package.json then add Cordova support again.')
    warn()

    console.log(' ⚠️  WARNING!')
    console.log(' ⚠️  If developing for iOS, it is HIGHLY recommended that you install the Ionic Webview Plugin.')
    console.log(' ⚠️  Please refer to docs: https://quasar.dev/quasar-cli/developing-cordova-apps/preparation')
    console.log(' ⚠️  --------')
    console.log()

    if (!target) {
      console.log()
      console.log(' No Cordova platform has been added yet as these get installed on demand automatically when running "quasar dev" or "quasar build".')
      log()
      return
    }

    this.addPlatform(target)
  }

  hasPlatform (target) {
    return fs.existsSync(appPaths.resolve.cordova(`platforms/${ target }`))
  }

  addPlatform (target) {
    ensureConsistency()

    if (this.hasPlatform(target)) {
      return
    }

    log(`Adding Cordova platform "${ target }"`)
    spawnSync(
      'cordova',
      [ 'platform', 'add', target ],
      { cwd: appPaths.cordovaDir },
      () => {
        warn(`There was an error trying to install Cordova platform "${ target }"`)
        process.exit(1)
      }
    )
  }

  remove () {
    if (!this.isInstalled) {
      warn('No Cordova support detected. Aborting.')
      return
    }

    fse.removeSync(appPaths.cordovaDir)
    log('Cordova support was removed')
  }
}
