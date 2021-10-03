import path from "path"
import fs from 'fs'

export default class Finder {
  private path: string
  private files: { name: string, path: string }[]
  constructor(path = ".") {
    this.path = path
    this.files = this.getAllFiles(path)
  }
  public getAllFiles(p: string): { name: string, path: string }[] {
    const dir = fs.readdirSync(p)
    let files: { name: string, path: string }[] = []
    for (const file of dir) {
      const fp = path.resolve(p + "/", file)
      if (fp.includes("node_modules")) continue
      const stat = fs.statSync(fp)
      if (stat.isDirectory()) {
        files = files.concat(this.getAllFiles(fp))
      } else if (stat.isFile()) {
        files.push({
          name: file,
          path: p, 
        })
      }
    }

    return files
  }
  public getScriptDir(): string {
    return this.files.find(i => i.name.toLowerCase() === '.ani-migrate')?.path
  }
  public getConfig(): string {
    const item = this.files.find(i => i.name.toLowerCase() === '.ani-migrate')

    return path.resolve(item.path, item.name)
  }
  public getScripts(dir: string): { baseVersion: number, targetVersion: number, path: string }[] {
    const files = this.files.filter(i => i.path.includes(dir) && i.name.toLowerCase().endsWith(".sql") && i.name.includes("-"))
    const scripts: { baseVersion: number, targetVersion: number, path: string }[] = []
    for (const file of files) {
      const split = file.name
        .toLowerCase()
        .replace(".sql", "")
        .split("-")

      const b = parseInt(split[0])
      const t = parseInt(split[1])

      if (Math.abs(b - t) !== 1) continue
      scripts.push({
        baseVersion: b,
        targetVersion: t,
        path: path.resolve(file.path, file.name), 
      })
    }

    return scripts
  }
}
