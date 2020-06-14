import 'v8-compile-cache'
import { PerformanceObserver, performance } from 'perf_hooks'

import cac from 'cac'
import { bold } from 'chalk'
import consola from 'consola'

import { version } from '../package.json'

import { build, BuildCommandOptions } from './commands/build'
import { changelog } from './commands/changelog'
import { dev, DevCommandOptions } from './commands/dev'
import { run as runFile } from './commands/run'

const obs = new PerformanceObserver(items => {
  const { duration, name } = items.getEntries()[0]
  const seconds = (duration / 1000).toFixed(1)
  const time = duration > 1000 ? seconds + 's' : Math.round(duration) + 'ms'
  consola.success(`${name} in ${bold(time)}`)
})
obs.observe({ entryTypes: ['measure'] })

const cli = cac('siroc')

const run = async <A extends (...args: any[]) => Promise<void>>(
  type: string,
  action: A,
  ...args: Parameters<A>
) => {
  performance.mark(`Start ${type}`)
  await action(...args).catch(err => {
    consola.error(err)
    process.exit(1)
  })
  performance.mark(`Stop ${type}`)
  performance.measure(`Finished ${type}`, `Start ${type}`, `Stop ${type}`)
}

cli
  .command('build [...packages]', 'Bundle input files')
  .option('-w, --watch', 'Watch files in bundle and rebuild on changes', {
    default: false,
  })
  .option('--dev', 'Build development bundle (only CJS)', {
    default: false,
  })
  .example(bin => `  ${bin} build`)
  .example(bin => `  ${bin} build @siroc/cli -w`)
  .action((packages: string[], options: BuildCommandOptions) =>
    run('building', build, { ...options, packages })
  )

cli
  .command('changelog', 'Generate changelog')
  .action(() => run('changelog', changelog))

cli
  .command('dev [...packages]', 'Generate package stubs for quick development')
  .example(bin => `  ${bin} dev`)
  .example(bin => `  ${bin} dev @siroc/cli -w`)
  .action((packages: string[], options: DevCommandOptions) =>
    run('stubbing', dev, { ...options, packages })
  )

cli
  .command('run <file> [...args]', 'Run Node script')
  .allowUnknownOptions()
  .option('-w, --workspaces', 'Run command in all yarn workspaces.')
  .option('-s, --sequential', 'Run sequentially rather than in paralle.')
  .example(bin => `  ${bin} src/test.ts`)
  .example(bin => `  ${bin} --workspaces ls`)
  .action((file, args, options) =>
    run('running', runFile, { file, args, options })
  )

cli.version(version)
cli.help()

cli.parse()

process.on('unhandledRejection', err => {
  consola.error(err)
  process.exit(1)
})
