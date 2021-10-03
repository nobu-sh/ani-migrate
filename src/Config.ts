import fs from 'fs'

export default class Config {
  private path: string
  private config: Record<string, string> = {}
  constructor(path: string) {
    this.path = path
    const read = fs.readFileSync(path, 'utf-8')
    const split = read.split(/(\n|\r)/g).filter(i => i.length && !i.trim().startsWith("#"))
    for (const item of split) {
      const split = item.split("=")
      this.config[split[0].trim().toLowerCase()] = split[1]?.trim()
    }
  }
  public read(): Record<string, string> {
    return this.config
  }
}
