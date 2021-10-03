#!/usr/bin/env node

import colors from 'colors'
import _ from 'underscore'

global._ = _
colors.setTheme({
  verbose: "cyan",
  info: "green",
  warn: "yellow",
  error: "red",
})

import Persister from './Persister'
import validate from './Validator'
import messages from './Messages'
import Finder from './Finder'
import Config from './Config'
import MigrationService from './Migrator'

// First argument : connectionString (mandatory)
// Second argument : target version (optional)
const args = process.argv.slice(2)
const isvalid = validate(args)

if (!isvalid) process.exit(1)

const finder = new Finder()
const scriptDir = finder.getScriptDir()

if (!scriptDir) {
  console.error(messages.MIGRATION_SCRIPT_NOT_FOUND.red)
  process.exit(1)
}

let curV = 0

const configHandler = new Config(finder.getConfig())
const config = configHandler.read()

const persister = new Persister(args[0])
persister.connect()
  .then(() => {
    const migrator = new MigrationService(persister, finder, config, args[1])

    try {
      return migrator.migrate()
    } catch (error) {
      console.error(error)
      process.exit(1)
    }
  })
  .then((v) => {
    curV = v

    return persister.query("COMMIT")
  })
  .then(() => {
    persister.closeConnection()

    console.log("--------------------------------------------------".grey)
    console.log((messages.MIGRATION_COMPLETED + curV).green)

    process.exit(0)
  })
  .catch(async (err) => {
    if (err) console.error((messages.MIGRATION_ERROR + err).red)

    await persister.closeConnection()

    process.exit(1)
  })
