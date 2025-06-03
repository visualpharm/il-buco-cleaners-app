// D1 Database types for Cloudflare Workers
interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  run<T = unknown>(): Promise<D1Result<T>>;
  all<T = unknown>(): Promise<D1Result<T>>;
  first<T = unknown>(colName?: string): Promise<T | null>;
}

interface D1Result<T = unknown> {
  results?: T[];
  success: boolean;
  error?: string;
  meta: any;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  dump(): Promise<ArrayBuffer>;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec<T = unknown>(query: string): Promise<{ count: number; duration: number }>;
}

// This will be injected by the Cloudflare runtime
declare global {
  // eslint-disable-next-line no-var
  var __D1_BETA__DB: D1Database | undefined;
}

export class D1Client {
  private db: D1Database;

  constructor(db?: D1Database) {
    // Try passed 'db' argument first (e.g., for testing or specific DI)
    // Then try 'globalThis.DB' which is how Wrangler exposes bindings named "DB" in Edge Runtime
    // Then try 'process.env.DB' as another common way bindings might be exposed, even in some Edge environments
    // Then try 'globalThis.__D1_BETA__DB' as a fallback for older conventions
    const d1Binding = db ||
                      (globalThis as any).DB ||
                      (typeof process !== 'undefined' && process.env && (process.env as any).DB) ||
                      (globalThis as any).__D1_BETA__DB;

    if (d1Binding) {
      this.db = d1Binding;
    } else {
      // If still not found, it means the binding isn't available in the environment.
      throw new Error(
        'D1 database binding "DB" not found. Searched in `db` parameter, `globalThis.DB`, `process.env.DB`, and `globalThis.__D1_BETA__DB`. ' +
        'Ensure your application is run with `wrangler dev` (or `wrangler pages dev`) ' +
        'and the binding "DB" is correctly configured in `wrangler.toml` and made available to the runtime.'
      );
    }
  }

  async query<T = any>(
    query: string, 
    params: any[] = []
  ): Promise<{ results?: T[]; meta: any }> {
    try {
      let stmt = this.db.prepare(query);
      if (params.length > 0) {
        stmt = stmt.bind(...params);
      }
      const result = await stmt.all<T>();
      return {
        results: result.results || [],
        meta: result.meta
      };
    } catch (error) {
      console.error('D1 query error:', error);
      throw error;
    }
  }

  async execute(
    query: string, 
    params: any[] = []
  ): Promise<{ success: boolean; meta: any }> {
    try {
      let stmt = this.db.prepare(query);
      if (params.length > 0) {
        stmt = stmt.bind(...params);
      }
      const result = await stmt.run();
      return { 
        success: result.success, 
        meta: result.meta 
      };
    } catch (error) {
      console.error('D1 execute error:', error);
      throw error;
    }
  }

  async getOne<T = any>(
    query: string, 
    params: any[] = []
  ): Promise<T | null> {
    try {
      let stmt = this.db.prepare(query);
      if (params.length > 0) {
        stmt = stmt.bind(...params);
      }
      return await stmt.first<T>();
    } catch (error) {
      console.error('D1 getOne error:', error);
      throw error;
    }
  }
}

// Export a new instance each time for debugging purposes
// let d1Instance: D1Client | null = null; // Singleton removed

export const getD1Client = (db?: D1Database): D1Client => {
  // if (!d1Instance) { // Singleton removed
  //   d1Instance = new D1Client(db);
  // }
  // return d1Instance; // Singleton removed
  return new D1Client(db); // Always create a new instance
};

// For backward compatibility
// This will now also return a new instance each time d1 is accessed via this export.
export const d1 = getD1Client();
