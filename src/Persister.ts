import {
  Client,
  QueryResult,
} from 'pg'

export default class Persister {
  private connectionString: string
  private pg: Client
  constructor(connectionString: string) {
    this.connectionString = connectionString
    this.pg = new Client(connectionString)
  }
  public async connect(): Promise<void> {
    return new Promise((r, j) => {
      this.pg.connect((err) => {
        if (err) j(err)
        else r()
      })
    })
  }
  public async query<R extends any>(sql: string, ...params: unknown[]): Promise<QueryResult<R>> {
    return new Promise((r, j) => {
      this.pg.query(sql, params, (err, res) => {
        if (err) j(err)
        else r(res)
      })
    })
  }
  public async closeConnection(): Promise<void> {
    return new Promise((r, j) => {
      this.pg.end((err) => {
        if (err) j(err)
        else r()
      })
    })
  }
}
