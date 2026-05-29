import express from "express";
import { createServer as createViteServer } from "vite";
import { Client } from "pg";
import path from "path";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize SQLite Database
  const db = await open({
    filename: './workspace.db',
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS workspace_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      api_key TEXT,
      db_host TEXT,
      db_port TEXT,
      db_name TEXT,
      db_user TEXT,
      db_pw TEXT,
      query_type TEXT,
      ai_optimization_mode TEXT,
      user_question TEXT,
      generated_sql TEXT,
      bookmarked_tables TEXT,
      selected_fields TEXT
    )
  `);

  // Insert default row if not exists
  await db.run(`INSERT OR IGNORE INTO workspace_settings (id) VALUES (1)`);

  // Migrate: add columns if missing
  const extraCols = ['table_comparisons', 'table_previews', 'bookmark_aliases', 'saved_relationships', 'active_tables', 'table_date_columns'];
  for (const col of extraCols) {
    try { await db.run(`ALTER TABLE workspace_settings ADD COLUMN ${col} TEXT`); } catch (e) {}
  }

  // Field relationships table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS field_relationships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_table TEXT NOT NULL,
      source_field TEXT NOT NULL,
      target_table TEXT NOT NULL,
      target_field TEXT NOT NULL,
      similarity REAL DEFAULT 0,
      confidence TEXT DEFAULT 'auto',
      verified INTEGER DEFAULT 0,
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(source_table, source_field, target_table, target_field)
    )
  `);

  // Table presets table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS table_presets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      tables TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Settings API
  app.get("/api/settings", async (req, res) => {
    try {
      const row = await db.get("SELECT * FROM workspace_settings WHERE id = 1");
      res.json(row || {});
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/settings", async (req, res) => {
    const { api_key, db_host, db_port, db_name, db_user, db_pw, query_type, ai_optimization_mode, user_question, generated_sql, bookmarked_tables, selected_fields, table_comparisons, table_previews, bookmark_aliases, saved_relationships, active_tables, table_date_columns } = req.body;
    try {
      // Check if column exists, if not add it (simple migration)
      try {
        await db.run(`ALTER TABLE workspace_settings ADD COLUMN ai_optimization_mode TEXT`);
      } catch (e) {}
      try {
        await db.run(`ALTER TABLE workspace_settings ADD COLUMN selected_fields TEXT`);
      } catch (e) {}
      try {
        await db.run(`ALTER TABLE workspace_settings ADD COLUMN bookmarked_tables TEXT`);
      } catch (e) {}
      try {
        await db.run(`ALTER TABLE workspace_settings ADD COLUMN table_comparisons TEXT`);
      } catch (e) {}
      try {
        await db.run(`ALTER TABLE workspace_settings ADD COLUMN table_previews TEXT`);
      } catch (e) {}
      try {
        await db.run(`ALTER TABLE workspace_settings ADD COLUMN bookmark_aliases TEXT`);
      } catch (e) {}
      try {
        await db.run(`ALTER TABLE workspace_settings ADD COLUMN saved_relationships TEXT`);
      } catch (e) {}
      try {
        await db.run(`ALTER TABLE workspace_settings ADD COLUMN active_tables TEXT`);
      } catch (e) {}
      try {
        await db.run(`ALTER TABLE workspace_settings ADD COLUMN table_date_columns TEXT`);
      } catch (e) {}

      await db.run(`
        UPDATE workspace_settings SET
          api_key = ?, db_host = ?, db_port = ?, db_name = ?, db_user = ?, db_pw = ?, query_type = ?, ai_optimization_mode = ?, user_question = ?, generated_sql = ?, bookmarked_tables = ?, selected_fields = ?, table_comparisons = ?, table_previews = ?, bookmark_aliases = ?, saved_relationships = ?, active_tables = ?, table_date_columns = ?
        WHERE id = 1
      `, [
        api_key || '', 
        db_host || '', 
        db_port || '', 
        db_name || '', 
        db_user || '', 
        db_pw || '', 
        query_type || '', 
        ai_optimization_mode || 'smart',
        user_question || '', 
        generated_sql || '', 
        JSON.stringify(bookmarked_tables || []),
        JSON.stringify(selected_fields || {}),
        JSON.stringify(table_comparisons || []),
        JSON.stringify(table_previews || {}),
        JSON.stringify(req.body.bookmark_aliases || {}),
        JSON.stringify(req.body.saved_relationships || []),
        JSON.stringify(active_tables || []),
        JSON.stringify(table_date_columns || {})
      ]);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API routes
  app.post("/api/schema", async (req, res) => {
    const { host, port, database, user, password } = req.body;
    try {
      const client = new Client({ host, port, database, user, password });
      await client.connect();
      
      const query = `
        SELECT table_schema, table_name, column_name, data_type
        FROM information_schema.columns
        WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
        AND table_schema !~ '^pg_'
        ORDER BY table_schema, table_name;
      `;
      const result = await client.query(query);

      const schemaDict: Record<string, string[]> = {};
      const tables = new Set<string>();
      
      for (const row of result.rows) {
        const fullTableName = `${row.table_schema}.${row.table_name}`;
        tables.add(fullTableName);
        if (!schemaDict[fullTableName]) {
          schemaDict[fullTableName] = [];
        }
        schemaDict[fullTableName].push(`${row.column_name} (${row.data_type})`);
      }

      for (const table of Object.keys(schemaDict)) {
        schemaDict[table].sort();
      }

      await client.end();

      let schemaText = "";
      for (const [table, cols] of Object.entries(schemaDict)) {
        schemaText += `Table: ${table}\nColumns: ${cols.join(", ")}\n\n`;
      }

      res.json({ schema: schemaText, schemaDict });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/foreign-keys", async (req, res) => {
    const { host, port, database, user, password } = req.body;
    try {
      const client = new Client({ host, port, database, user, password });
      await client.connect();

      const result = await client.query(`
        SELECT
          tc.table_schema,
          tc.table_name,
          kcu.column_name,
          ccu.table_schema AS foreign_table_schema,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name,
          tc.constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema NOT IN ('information_schema', 'pg_catalog')
          AND tc.table_schema !~ '^pg_'
        ORDER BY tc.table_schema, tc.table_name, kcu.ordinal_position
      `);

      await client.end();

      const foreignKeys = result.rows.map((row: any) => ({
        source_table: `${row.table_schema}.${row.table_name}`,
        source_column: row.column_name,
        target_table: `${row.foreign_table_schema}.${row.foreign_table_name}`,
        target_column: row.foreign_column_name,
        constraint_name: row.constraint_name,
      }));

      res.json({ foreignKeys });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/sample-data", async (req, res) => {
    const { host, port, database, user, password, table, orderBy } = req.body;
    try {
      const client = new Client({ host, port, database, user, password });
      await client.connect();
      
      const [schema, tableName] = table.split('.');
      const qi = (s: string) => `"${s.replace(/"/g, '""')}"`;
      const sampleQuery = orderBy
        ? `SELECT * FROM ${qi(schema)}.${qi(tableName)} ORDER BY ${qi(orderBy)} DESC LIMIT 1`
        : `SELECT * FROM "${schema}"."${tableName}" LIMIT 1`;
      const sampleResult = await client.query(sampleQuery);
      
      await client.end();
      
      res.json({ sampleData: sampleResult.rows[0] || null });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/query", async (req, res) => {
    const { host, port, database, user, password, sql } = req.body;
    try {
      if (!sql || typeof sql !== 'string') {
        return res.status(400).json({ error: 'SQL query is required' });
      }

      const client = new Client({ host, port, database, user, password });
      await client.connect();

      const statements = sql.split(';').map((s) => s.trim()).filter((s) => s.length > 0);
      const results: { table: string; fields: string[]; rows: any[] }[] = [];

      for (const statement of statements) {
        try {
          const result = await client.query(statement);
          const tableMatch = statement.match(/FROM\s+([^\s;,)]+)/i);
          const table = tableMatch ? tableMatch[1] : '';
          const fields = Array.isArray(result?.fields) ? result.fields.map((f) => f.name) : [];
          const rows = Array.isArray(result?.rows) ? result.rows : [];
          results.push({ table, fields, rows });
        } catch (stmtErr: any) {
          results.push({ table: '', fields: [], rows: [] });
          console.error(`Statement error: ${stmtErr.message}\nSQL: ${statement}`);
        }
      }

      await client.end();
      res.json({ results });
    } catch (error: any) {
      console.error('Query route error:', error);
      res.status(500).json({ error: error.message, stack: error.stack });
    }
  });

  // ─── Field Relationship APIs ─────────────────────────────────────────────

  app.get("/api/field-relationships", async (req, res) => {
    try {
      const rows = await db.all("SELECT * FROM field_relationships ORDER BY similarity DESC");
      res.json({ relationships: rows });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/field-relationships", async (req, res) => {
    const { source_table, source_field, target_table, target_field, similarity, confidence } = req.body;
    try {
      await db.run(`
        INSERT OR REPLACE INTO field_relationships (source_table, source_field, target_table, target_field, similarity, confidence, verified)
        VALUES (?, ?, ?, ?, ?, ?, 1)
      `, [source_table, source_field, target_table, target_field, similarity || 0, confidence || 'manual']);
      const row = await db.get("SELECT * FROM field_relationships WHERE source_table = ? AND source_field = ? AND target_table = ? AND target_field = ?",
        [source_table, source_field, target_table, target_field]);
      res.json({ success: true, relationship: row });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/field-relationships/:id", async (req, res) => {
    try {
      await db.run("DELETE FROM field_relationships WHERE id = ?", [req.params.id]);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ─── Table Comments (한글 코멘트 포함) ─────────────────────────────────

  app.post("/api/table-comments", async (req, res) => {
    const { host, port, database, user, password } = req.body;
    try {
      const client = new Client({ host, port, database, user, password });
      await client.connect();

      const result = await client.query(`
        SELECT
          c.table_schema, c.table_name, c.column_name, c.data_type,
          pg_catalog.col_description(
            (c.table_schema || '.' || c.table_name)::regclass::oid,
            c.ordinal_position::int
          ) AS column_comment,
          (SELECT pg_catalog.obj_description(
            (c.table_schema || '.' || c.table_name)::regclass::oid
          )) AS table_comment
        FROM information_schema.columns c
        WHERE c.table_schema NOT IN ('information_schema', 'pg_catalog')
        AND c.table_schema !~ '^pg_'
        ORDER BY c.table_schema, c.table_name, c.ordinal_position
      `);

      await client.end();

      const comments: Record<string, { table_comment: string | null; columns: Record<string, { type: string; comment: string | null }> }> = {};

      for (const row of result.rows) {
        const key = `${row.table_schema}.${row.table_name}`;
        if (!comments[key]) {
          comments[key] = { table_comment: row.table_comment || null, columns: {} };
        }
        comments[key].columns[row.column_name] = {
          type: row.data_type,
          comment: row.column_comment || null,
        };
      }

      res.json({ comments });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ─── Field Similarity (필드명 + 코멘트 기반 유사도) ────────────────────

  function normalizeFieldName(name: string): string {
    return name.toLowerCase()
      .replace(/[_\-]/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .trim();
  }

  function getTokens(name: string): string[] {
    return normalizeFieldName(name).split(/\s+/).filter(t => t.length > 0);
  }

  function jaccardSimilarity(a: string[], b: string[]): number {
    const setA = new Set(a);
    const setB = new Set(b);
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    return union.size === 0 ? 0 : intersection.size / union.size;
  }

  function fieldSimilarity(name1: string, comment1: string | null, name2: string, comment2: string | null): { score: number; method: string } {
    const norm1 = normalizeFieldName(name1);
    const norm2 = normalizeFieldName(name2);

    // Exact match
    if (norm1 === norm2) return { score: 1, method: 'exact' };

    const tokens1 = getTokens(name1);
    const tokens2 = getTokens(name2);

    // Token Jaccard
    const jaccard = jaccardSimilarity(tokens1, tokens2);
    if (jaccard >= 0.5) return { score: jaccard, method: 'token' };

    // Check if one token set is subset of the other (e.g. "id" vs "order_id")
    const smaller = tokens1.length <= tokens2.length ? tokens1 : tokens2;
    const larger = tokens1.length > tokens2.length ? tokens1 : tokens2;
    if (smaller.every(t => larger.includes(t)) && smaller.length > 0) {
      return { score: 0.6 + (smaller.length / larger.length) * 0.3, method: 'subset' };
    }

    // Comment-based match (for Korean / descriptions)
    if (comment1 && comment2) {
      const c1 = comment1.toLowerCase();
      const c2 = comment2.toLowerCase();
      if (c1 === c2) return { score: 0.9, method: 'comment_exact' };
      const cTokens1 = c1.split(/\s+/).filter(t => t.length > 1);
      const cTokens2 = c2.split(/\s+/).filter(t => t.length > 1);
      const cJaccard = jaccardSimilarity(cTokens1, cTokens2);
      if (cJaccard >= 0.5) return { score: cJaccard * 0.8, method: 'comment' };
    }

    // Levenshtein-based fallback
    const maxLen = Math.max(norm1.length, norm2.length);
    if (maxLen === 0) return { score: 0, method: 'none' };
    const dist = levenshtein(norm1, norm2);
    const levScore = 1 - dist / maxLen;
    if (levScore >= 0.7) return { score: levScore, method: 'fuzzy' };

    return { score: 0, method: 'none' };
  }

  function levenshtein(a: string, b: string): number {
    const m = a.length, n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i][j] = a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
    return dp[m][n];
  }

  app.post("/api/field-similarity", async (req, res) => {
    const { host, port, database, user, password, table, field } = req.body;
    if (!table || !field) {
      return res.status(400).json({ error: 'table and field are required' });
    }
    try {
      const client = new Client({ host, port, database, user, password });
      await client.connect();

      // Get all columns with comments
      const result = await client.query(`
        SELECT
          c.table_schema, c.table_name, c.column_name, c.data_type,
          pg_catalog.col_description(
            (c.table_schema || '.' || c.table_name)::regclass::oid,
            c.ordinal_position::int
          ) AS column_comment,
          (SELECT pg_catalog.obj_description(
            (c.table_schema || '.' || c.table_name)::regclass::oid
          )) AS table_comment
        FROM information_schema.columns c
        WHERE c.table_schema NOT IN ('information_schema', 'pg_catalog')
        AND c.table_schema !~ '^pg_'
        ORDER BY c.table_schema, c.table_name, c.ordinal_position
      `);

      await client.end();

      // Find similarity against the target field
      const fieldComment = result.rows.find(
        (r: any) => `${r.table_schema}.${r.table_name}` === table && r.column_name === field
      );

      const targetName = field;
      const targetComment = fieldComment?.column_comment || null;
      const targetTableComment = fieldComment?.table_comment || null;

      const similarities: any[] = [];

      for (const row of result.rows) {
        const rowTable = `${row.table_schema}.${row.table_name}`;
        if (rowTable === table && row.column_name === field) continue;

        const { score, method } = fieldSimilarity(
          row.column_name, row.column_comment || null,
          targetName, targetComment
        );

        if (score > 0.3) {
          similarities.push({
            table: rowTable,
            field: row.column_name,
            type: row.data_type,
            table_comment: row.table_comment || null,
            column_comment: row.column_comment || null,
            similarity: Math.round(score * 100) / 100,
            method,
          });
        }
      }

      // Sort by similarity descending
      similarities.sort((a, b) => b.similarity - a.similarity);

      res.json({
        target: { table, field, comment: targetComment, table_comment: targetTableComment },
        suggestions: similarities.slice(0, 50),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ─── Field Value Overlap (값 기반 중복 확인) ──────────────────────────

  app.post("/api/field-value-overlap", async (req, res) => {
    const { host, port, database, user, password, source_table, source_field, target_table, target_field } = req.body;
    try {
      const client = new Client({ host, port, database, user, password });
      await client.connect();

      const [srcSchema, srcTable] = source_table.split('.');
      const [tgtSchema, tgtTable] = target_table.split('.');

      // Check overlap count
      const overlapResult = await client.query(`
        SELECT COUNT(*) AS overlap_count
        FROM "${srcSchema}"."${srcTable}" s
        WHERE EXISTS (
          SELECT 1 FROM "${tgtSchema}"."${tgtTable}" t
          WHERE t."${target_field}" = s."${source_field}"
        )
      `);

      // Get source total
      const srcCount = await client.query(`SELECT COUNT(*) AS c FROM "${srcSchema}"."${srcTable}"`);
      const tgtCount = await client.query(`SELECT COUNT(*) AS c FROM "${tgtSchema}"."${tgtTable}"`);

      await client.end();

      const overlapCount = parseInt(overlapResult.rows[0].overlap_count, 10);
      const sourceTotal = parseInt(srcCount.rows[0].c, 10);
      const targetTotal = parseInt(tgtCount.rows[0].c, 10);

      res.json({
        source_table,
        source_field,
        target_table,
        target_field,
        overlap_count: overlapCount,
        source_total: sourceTotal,
        target_total: targetTotal,
        source_overlap_pct: sourceTotal > 0 ? Math.round((overlapCount / sourceTotal) * 10000) / 100 : 0,
        target_overlap_pct: targetTotal > 0 ? Math.round((overlapCount / targetTotal) * 10000) / 100 : 0,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ─── Search Suggestions (한글 포함 전체 검색) ─────────────────────────

  app.post("/api/search-fields", async (req, res) => {
    const { host, port, database, user, password, query } = req.body;
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: 'query is required' });
    }
    try {
      const client = new Client({ host, port, database, user, password });
      await client.connect();

      const result = await client.query(`
        SELECT
          c.table_schema, c.table_name, c.column_name, c.data_type,
          pg_catalog.col_description(
            (c.table_schema || '.' || c.table_name)::regclass::oid,
            c.ordinal_position::int
          ) AS column_comment,
          (SELECT pg_catalog.obj_description(
            (c.table_schema || '.' || c.table_name)::regclass::oid
          )) AS table_comment
        FROM information_schema.columns c
        WHERE c.table_schema NOT IN ('information_schema', 'pg_catalog')
        AND c.table_schema !~ '^pg_'
          AND (c.column_name ILIKE $1
            OR pg_catalog.obj_description(
              (c.table_schema || '.' || c.table_name)::regclass::oid
            ) ILIKE $1
            OR pg_catalog.col_description(
              (c.table_schema || '.' || c.table_name)::regclass::oid,
              c.ordinal_position::int
            ) ILIKE $1)
        ORDER BY c.table_schema, c.table_name, c.ordinal_position
        LIMIT 100
      `, [`%${query}%`]);

      await client.end();

      const results: any[] = result.rows.map((row: any) => ({
        table: `${row.table_schema}.${row.table_name}`,
        field: row.column_name,
        type: row.data_type,
        column_comment: row.column_comment || null,
        table_comment: row.table_comment || null,
      }));

      res.json({ results });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ─── Table Presets API ─────────────────────────────────────────────────

  app.post("/api/table-presets", async (req, res) => {
    const { name, tables } = req.body;
    if (!name || !Array.isArray(tables)) {
      return res.status(400).json({ error: 'name and tables array required' });
    }
    try {
      const result = await db.run(
        `INSERT INTO table_presets (name, tables) VALUES (?, ?)`,
        [name, JSON.stringify(tables)]
      );
      res.json({ id: result.lastID, name, tables });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/table-presets", async (req, res) => {
    try {
      const rows = await db.all("SELECT id, name, created_at FROM table_presets ORDER BY created_at DESC");
      res.json(rows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/table-presets/:id", async (req, res) => {
    try {
      const row = await db.get("SELECT * FROM table_presets WHERE id = ?", [req.params.id]);
      if (!row) return res.status(404).json({ error: 'not found' });
      row.tables = JSON.parse(row.tables);
      res.json(row);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/table-presets/:id", async (req, res) => {
    try {
      await db.run("DELETE FROM table_presets WHERE id = ?", [req.params.id]);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ─── Vite middleware ────────────────────────────────────────────────────
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
