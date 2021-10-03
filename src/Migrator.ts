import _ from "underscore"
import Finder from "./Finder"
import Messages from "./Messages"
import Persister from "./Persister"
import fs from 'fs'

export default class MigrationService {
  private persister: Persister
  private finder: Finder
  private config: Record<string, string>
  private target: string | number
  constructor(persister: Persister, finder: Finder, config: Record<string, string>, target: string | number) {
    this.persister = persister
    this.config = config
    this.finder = finder
    this.target = target
  }
  public async migrate(): Promise<number> {
    return new Promise((r,j) => {
      const migrations = this.finder.getScripts(this.finder.getScriptDir())
      if (!migrations.length) {
        console.error(Messages.NO_MIGRATION_SCRIPTS.red)

        j()
      } else {
        this.getCurVersion()
          .then((cv) => {
            if (!this.target) {
              const max = _.max(migrations, (item) => {
                return item.targetVersion
              }) as { baseVersion: number, targetVersion: number, path: string }
              this.target = max.targetVersion
            } else if (this.target == '+1') {
              this.target = cv + 1
            } else if (this.target == -1) {
              if (cv == 1) {
                console.error(Messages.NO_MORE_ROLLBACK.red)
                
                return j()
              }

              this.target = cv - 1
            }

            console.log((Messages.CURRENT_VERSION + cv).cyan)
            console.log((Messages.TARGET_VERSION + this.target).cyan)

            if (cv == this.target) {
              console.log(Messages.ALREADY_MIGRATED.yellow)

              return r(cv)
            }

            let direction: number

            if (cv < this.target) {
              direction = 1
            } else {
              direction = -1
            }

            this._executeScript(cv, direction, migrations)
              .then(async () => {
                try {
                  const exists = await this.checkSchema()
                  if (exists) {
                    return this.updateVersion(this.target as number)
                  } else return
                } catch (error) {
                  j(error)
                }
              })
              .then(() => {
                r(this.target as number)
              })
              .catch((err) => j(err))

          })
          .catch((err) => j(err))
      }
    })
  }
  private async _executeScript(cv: number, direction: number, migrations: { baseVersion: number, targetVersion: number, path: string }[]): Promise<void> {
    return new Promise((r,j) => {
      const nextVersion = cv + direction
      const file = migrations.find(i => i.baseVersion == cv && i.targetVersion == nextVersion)
      if (!file) {
        console.error((Messages.FILE_NOT_FOUND + cv + "-" + nextVersion + ".sql").red)

        return j()
      } else {
        const fileContent = this.read(file.path)
        this.persister.query(fileContent)
          .then(() => {
            console.log("--------------------------------------------------".grey)
            console.log(fileContent.white)
            console.log((cv + "-" + nextVersion + ".sql executed").green)
            console.log("--------------------------------------------------".grey)

            cv += direction

            if (cv == this.target) {
              r()
            } else {
              this._executeScript(cv, direction, migrations)
                .then(() => {
                  r()
                })
                .catch((err) => {
                  r(err)
                })
            }
          })
          .catch((err) => j(err))
      }
    })
  }
  public read(path: string): string {
    return fs.readFileSync(path, 'utf-8')
  }
  public async getCurVersion(): Promise<number> {
    return new Promise((r,j) => {
      this.checkTable()
        .then((exists) => {
          if (!exists) {
            console.warn(Messages.FIRST_INITIALIZE.yellow)
            this.createVersionTable()
              .then(() => r(1))
              .catch((err) => j(err))
          } else {
            this.getVersion()
              .then((cv) => {
                r(cv)
              })
              .catch((err) => j(err))
          }
        })
        .catch((err) => j(err))
    })
  }
  public async checkTable(): Promise<boolean> {
    return new Promise((r,j) => {
      const schema = this.config.schema
      this.persister.query(`SELECT EXISTS(SELECT * FROM information_schema.tables WHERE ${schema ? `table_schema = '${schema}' AND ` : ""}table_name = 'version') as value;`)
        .then((res) => r((res.rows[0] as any).value))
        .catch((err) => j(err))
    })
  }
  public async checkSchema(): Promise<boolean> {
    return new Promise((r,j) => {
      const schema = this.config.schema
      if (schema) {
        this.persister.query(`SELECT EXISTS(SELECT * FROM information_schema.tables WHERE table_schema = '${schema}') as value;`)
          .then((res) => r((res.rows[0] as any).value))
          .catch((err) => j(err))
      } else {
        r(true)
      }
    })
  }
  public async createSchema(): Promise<void> {
    return new Promise((r,j) => {
      const schema = this.config.schema
      this.persister.query(`CREATE SCHEMA IF NOT EXISTS ${schema};`)
        .then(() => r())
        .catch((err) => j(err))
    })
  }
  public async createVersionTable(): Promise<void> {
    return new Promise((r,j) => {
      const schema = this.config.schema
      if (schema) {
        this.checkSchema()
          .then(async (res) => {
            if (!res) await this.createSchema()
              .then(() => {
                this.persister.query(`CREATE TABLE ${schema}.version (value INT); INSERT INTO ${schema}.version(value) VALUES(1);`)
                  .then(() => r())
                  .catch((err) => j(err))
              })
              .catch((err) => j(err))
          })
          .catch((err) => j(err))
      } else {
        this.persister.query(`CREATE TABLE version (value INT);INSERT INTO version(value) VALUES(1);`)
          .then(() => r())
          .catch((err) => j(err))
      }
    })
  }
  public async getVersion(): Promise<number> {
    return new Promise((r,j) => {
      const schema = this.config.schema
      this.persister.query(`SELECT value FROM ${schema ? `${schema}.` : ""}version;`)
        .then((res) => r((res.rows[0] as any).value))
        .catch((err) => j(err))
    })
  }
  public async updateVersion(version: number): Promise<void> {
    return new Promise((r,j) => {
      const schema = this.config.schema
      this.persister.query(`UPDATE ${schema ? `${schema}.` : ""}version SET value = ${version};`)
        .then(() => r())
        .catch((err) => j(err))
    })
  }
}
