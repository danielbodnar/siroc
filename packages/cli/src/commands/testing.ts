import { join } from 'path'

import { Package } from '@siroc/core'
import { bold, gray } from 'chalk'
import consola from 'consola'

const runJest = (pkg: Package) => {
  let jestConfig
  try {
    jestConfig = join(
      require.resolve('@siroc/jest-preset'),
      '../jest.config.js'
    )
    const { stdout } = pkg.execInteractive(
      'yarn',
      `jest --passWithNoTests -c ${jestConfig}`
    )
    if (stdout) stdout.pipe(process.stdout)
  } catch (e) {
    if (!jestConfig) {
      consola.error(`Couldn't resolve jest config.\n`, gray(e))
    } else {
      consola.error(`Error running ${bold('jest')} -c ${jestConfig}\n`, gray(e))
    }
  }
}

const runEslint = (pkg: Package) => {
  let eslintConfig
  try {
    eslintConfig = join(
      require.resolve('@siroc/eslint-config'),
      '../.eslintrc.js'
    )
    const { stdout } = pkg.execInteractive(
      'yarn',
      `eslint -c ${eslintConfig} --ext .js,.ts .`
    )
    if (stdout) stdout.pipe(process.stdout)
  } catch (e) {
    if (!eslintConfig) {
      consola.error(`Couldn't resolve eslint config.\n`, gray(e))
    } else {
      consola.error(
        `Error running ${bold('eslint')} -c ${eslintConfig}\n`,
        gray(e)
      )
    }
  }
}

const commands = {
  jest: runJest,
  eslint: runEslint,
} as const

export type Command = keyof typeof commands

interface CommandOptions {
  command: Command
  packages: string[]
  options?: Record<string, any>
}

export async function test({ packages, command }: CommandOptions) {
  const rootPackage = new Package()

  if (packages.length) {
    const workspacePackages = await rootPackage.getWorkspacePackages(packages)
    workspacePackages.forEach(async pkg => commands[command](pkg))
  } else {
    commands[command](rootPackage)
  }
}
