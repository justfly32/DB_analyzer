/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Database, MessageSquare, Code2, Play, Loader2, AlertCircle, Settings, Server, User, Lock, Check, Table, Download, Save, ChevronDown, ChevronRight, ChevronLeft, Star, Copy, Search, CheckSquare, Link, Trash2, X } from 'lucide-react';

export default function App() {
  // Sidebar Navigation State
  const [activeMenu, setActiveMenu] = useState<'settings' | 'generator' | 'query' | 'preview' | 'relationships' | 'tables'>('settings');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Settings State
  const [dbHost, setDbHost] = useState('localhost');
  const [dbPort, setDbPort] = useState('5432');
  const [dbName, setDbName] = useState('');
  const [dbUser, setDbUser] = useState('');
  const [dbPw, setDbPw] = useState('');
  
  // DB Connection State
  const [schemaInfo, setSchemaInfo] = useState('');
  const [schemaDict, setSchemaDict] = useState<Record<string, string[]>>({});
  const [sampleDataDict, setSampleDataDict] = useState<Record<string, any>>({});
  const [loadingSamples, setLoadingSamples] = useState<Record<string, boolean>>({});
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [bookmarkedTables, setBookmarkedTables] = useState<Set<string>>(new Set());
  const [selectedFields, setSelectedFields] = useState<Record<string, string[]>>({});
  const [previewTables, setPreviewTables] = useState<Set<string>>(new Set());
  const [tablePreviews, setTablePreviews] = useState<Record<string, Record<string, any>>>({});
  const [isBatchFetching, setIsBatchFetching] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [dbError, setDbError] = useState('');
  const [dbSuccess, setDbSuccess] = useState(false);
  
  // Generator State
  const [queryType, setQueryType] = useState<'standard' | 'grafana'>('grafana');
  const [generatedSql, setGeneratedSql] = useState('');
  
  // Query State
  const [isQuerying, setIsQuerying] = useState(false);
  const [queryError, setQueryError] = useState('');
  const [queryResults, setQueryResults] = useState<{ results: { table?: string; fields: string[], rows: any[] }[] } | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [activeTables, setActiveTables] = useState<string[]>([]);
  const [selectedDateColumns, setSelectedDateColumns] = useState<Record<string, string>>({});
  const [bookmarkAliases, setBookmarkAliases] = useState<Record<string, string>>({});
  const [tableFilter, setTableFilter] = useState('');
  const [sortBySelection, setSortBySelection] = useState(false);
  const [sampleErrors, setSampleErrors] = useState<Record<string, string>>({});
  const [tmSampleData, setTmSampleData] = useState<Record<string, any>>({});
  const [tmLoadingSamples, setTmLoadingSamples] = useState<Record<string, boolean>>({});
  const [tmSampleErrors, setTmSampleErrors] = useState<Record<string, string>>({});
  const [editingAlias, setEditingAlias] = useState<string | null>(null);
  const [savedRelationships, setSavedRelationships] = useState<any[]>([]);
  const [foreignKeys, setForeignKeys] = useState<{ source_table: string; source_column: string; target_table: string; target_column: string; constraint_name: string }[]>([]);
  const [relAiPrompt, setRelAiPrompt] = useState('');
  const [tablePresets, setTablePresets] = useState<{ id: number; name: string; created_at: string }[]>([]);
  const [presetName, setPresetName] = useState('');
  const [presetLoadId, setPresetLoadId] = useState<number | ''>('');
  const [fieldFilter, setFieldFilter] = useState('');
  const [tableNotFilter, setTableNotFilter] = useState('');
  const [fieldNotFilter, setFieldNotFilter] = useState('');
  const [filterMode, setFilterMode] = useState<'or' | 'and'>('or');
  const [fieldFilterMode, setFieldFilterMode] = useState<'or' | 'and'>('or');

  // Relationship Analysis State
  const [relTargetTable, setRelTargetTable] = useState('');
  const [relTargetField, setRelTargetField] = useState('');
  const [relSuggestions, setRelSuggestions] = useState<any[]>([]);
  const [relSearchQuery, setRelSearchQuery] = useState('');
  const [relSearchResults, setRelSearchResults] = useState<any[]>([]);
  const [relVerifying, setRelVerifying] = useState<Record<string, boolean>>({});
  const [relVerificationResult, setRelVerificationResult] = useState<any>(null);
  const [relLoading, setRelLoading] = useState(false);
  const [relError, setRelError] = useState('');

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data) {
          if (data.db_host) setDbHost(data.db_host);
          if (data.db_port) setDbPort(data.db_port);
          if (data.db_name) setDbName(data.db_name);
          if (data.db_user) setDbUser(data.db_user);
          if (data.db_pw) setDbPw(data.db_pw);
          if (data.query_type) setQueryType(data.query_type as any);
          if (data.generated_sql) setGeneratedSql(data.generated_sql);
          if (data.bookmarked_tables) {
            try {
              const parsed = JSON.parse(data.bookmarked_tables);
              if (Array.isArray(parsed)) setBookmarkedTables(new Set(parsed));
            } catch (e) {}
          }
          if (data.selected_fields) {
            try {
              const parsed = JSON.parse(data.selected_fields);
              if (typeof parsed === 'object' && !Array.isArray(parsed)) setSelectedFields(parsed);
            } catch (e) {}
          }
          if (data.table_comparisons) {
            try {
              const parsed = JSON.parse(data.table_comparisons);
              if (Array.isArray(parsed)) setPreviewTables(new Set(parsed));
            } catch (e) {}
          }
          if (data.table_previews) {
            try {
              const parsed = JSON.parse(data.table_previews);
              if (typeof parsed === 'object' && !Array.isArray(parsed)) setTablePreviews(parsed);
            } catch (e) {}
          }
          if (data.bookmark_aliases) {
            try {
              const parsed = JSON.parse(data.bookmark_aliases);
              if (typeof parsed === 'object' && !Array.isArray(parsed)) setBookmarkAliases(parsed);
            } catch (e) {}
          }
          if (data.saved_relationships) {
            try {
              const parsed = JSON.parse(data.saved_relationships);
              if (Array.isArray(parsed)) setSavedRelationships(parsed);
            } catch (e) {}
          }
            if (data.active_tables) {
            try {
              const parsed = JSON.parse(data.active_tables);
              if (Array.isArray(parsed)) setActiveTables(parsed);
            } catch (e) {}
          }
          if (data.table_date_columns) {
            try {
              const parsed = JSON.parse(data.table_date_columns);
              if (typeof parsed === 'object' && !Array.isArray(parsed)) setSelectedDateColumns(parsed);
            } catch (e) {}
          }
        }
      })
      .catch(err => console.error('Failed to load settings:', err));

  // Load field relationships from SQLite
  fetch('/api/field-relationships')
    .then(res => res.json())
    .then(data => {
      if (data.relationships) setSavedRelationships(prev => {
        const existing = new Set(prev.map((r: any) => `${r.source_table}|${r.source_field}|${r.target_table}|${r.target_field}`));
        const merged = [...prev];
        for (const r of data.relationships) {
          const key = `${r.source_table}|${r.source_field}|${r.target_table}|${r.target_field}`;
          if (!existing.has(key)) {
            merged.push(r);
            existing.add(key);
          }
        }
        return merged;
      });
    })
    .catch(err => console.error('Failed to load relationships:', err));
  }, []);

  // Load presets when table manager opens
  useEffect(() => {
    if (activeMenu === 'tables') loadTablePresets();
    if (activeMenu === 'relationships' && dbName && foreignKeys.length === 0) loadForeignKeys();
  }, [activeMenu]);

  const handleConnectDb = async () => {
    if (!dbName || !dbUser || !dbPw) {
      setDbError('DB 연결 정보를 모두 입력해주세요.');
      return;
    }
    
    setIsConnecting(true);
    setDbError('');
    setDbSuccess(false);
    
    try {
      const response = await fetch('/api/schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: dbHost,
          port: parseInt(dbPort, 10),
          database: dbName,
          user: dbUser,
          password: dbPw
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect to database');
      }
      
      setSchemaInfo(data.schema);
      if (data.schemaDict) {
        setSchemaDict(data.schemaDict);
      }
      setDbSuccess(true);
      loadForeignKeys();

      // Auto switch to generator menu after success
      setTimeout(() => {
        setActiveMenu('generator');
        setDbSuccess(false); // Reset success message for next time
      }, 1500);
      
    } catch (err: any) {
      setDbError(`DB 연결 실패: ${err.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const loadForeignKeys = async () => {
    try {
      const res = await fetch('/api/foreign-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host: dbHost, port: parseInt(dbPort, 10), database: dbName, user: dbUser, password: dbPw })
      });
      const data = await res.json();
      if (res.ok && data.foreignKeys) setForeignKeys(data.foreignKeys);
    } catch (err) {
      console.error('Failed to load foreign keys:', err);
    }
  };

  const fetchSampleData = async (tableName: string, orderBy?: string) => {
    setLoadingSamples(prev => ({ ...prev, [tableName]: true }));
    setSampleErrors(prev => { const n = { ...prev }; delete n[tableName]; return n; });
    try {
      const body: any = {
        host: dbHost,
        port: parseInt(dbPort, 10),
        database: dbName,
        user: dbUser,
        password: dbPw,
        table: tableName
      };
      if (orderBy) body.orderBy = orderBy;
      const response = await fetch('/api/sample-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch sample data');
      }
      
      setSampleDataDict(prev => ({ ...prev, [tableName]: data.sampleData }));
    } catch (err: any) {
      console.error(`Failed to fetch sample data for ${tableName}:`, err);
      setSampleErrors(prev => ({ ...prev, [tableName]: err.message }));
    } finally {
      setLoadingSamples(prev => ({ ...prev, [tableName]: false }));
    }
  };

  const fetchTmSampleData = async (tableName: string, orderBy?: string) => {
    setTmLoadingSamples(prev => ({ ...prev, [tableName]: true }));
    setTmSampleErrors(prev => { const n = { ...prev }; delete n[tableName]; return n; });
    try {
      const body: any = {
        host: dbHost,
        port: parseInt(dbPort, 10),
        database: dbName,
        user: dbUser,
        password: dbPw,
        table: tableName
      };
      if (orderBy) body.orderBy = orderBy;
      const response = await fetch('/api/sample-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch sample data');
      }
      setTmSampleData(prev => ({ ...prev, [tableName]: data.sampleData }));
    } catch (err: any) {
      console.error(`Failed to fetch sample data for ${tableName}:`, err);
      setTmSampleErrors(prev => ({ ...prev, [tableName]: err.message }));
    } finally {
      setTmLoadingSamples(prev => ({ ...prev, [tableName]: false }));
    }
  };

  const handleRunQuery = async () => {
    if (!generatedSql.trim()) return;
    
    setIsQuerying(true);
    setQueryError('');
    setQueryResults(null);
    
    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: dbHost,
          port: parseInt(dbPort, 10),
          database: dbName,
          user: dbUser,
          password: dbPw,
          sql: generatedSql
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.stack || 'Failed to execute query');
      }
      
      setQueryResults({ results: data.results || [] });
    } catch (err: any) {
      setQueryError(`쿼리 실행 에러: ${err.message}`);
      console.error('handleRunQuery error:', err);
    } finally {
      setIsQuerying(false);
    }
  };

  const handleDownloadCsv = () => {
    if (!queryResults || queryResults.results.length === 0) return;
    const totalRows = queryResults.results.reduce((sum, r) => sum + r.rows.length, 0);
    if (totalRows === 0) return;

    const parts: string[] = [];
    for (let i = 0; i < queryResults.results.length; i++) {
      const { table, fields, rows } = queryResults.results[i];
      if (fields.length === 0 || rows.length === 0) continue;

      parts.push(`--- ${table || `결과 ${i + 1}`} ---`);
      parts.push(fields.join(','));

      for (const row of rows) {
        parts.push(fields.map(field => {
          let val = row[field];
          if (val === null || val === undefined) return '';
          val = String(val);
          if (val.includes(',') || val.includes('\\n') || val.includes('"')) {
            val = `"${val.replace(/"/g, '""')}"`;
          }
          return val;
        }).join(','));
      }
    }

    if (parts.length === 0) return;

    const csvContent = '\uFEFF' + parts.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `query_results_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
    document.body.appendChild(a);
    a.click();
    
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const [presetMsg, setPresetMsg] = useState('');

  const loadTablePresets = async () => {
    try {
      const res = await fetch('/api/table-presets');
      const data = await res.json();
      if (Array.isArray(data)) setTablePresets(data);
    } catch (err) {
      console.error('Failed to load presets:', err);
    }
  };

  const saveTablePreset = async () => {
    const name = presetName.trim();
    if (!name) return;
    setPresetMsg('');
    try {
      const res = await fetch('/api/table-presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, tables: activeTables })
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => ''); // read body for details
        throw new Error(errText || `HTTP ${res.status}`);
      }
      const result = await res.json();
      setPresetName('');
      setPresetMsg(`"${name}" 저장됨`);
      setTimeout(() => setPresetMsg(''), 3000);
      setTablePresets(prev => [{ id: result.id, name: result.name, created_at: new Date().toISOString() }, ...prev]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setPresetMsg(`저장 실패: ${msg}`);
      console.error('Failed to save preset:', err);
    }
  };

  const loadTablePreset = async (id: number) => {
    setPresetMsg('');
    try {
      const res = await fetch(`/api/table-presets/${id}`);
      const data = await res.json();
      if (data && Array.isArray(data.tables)) {
        setActiveTables(data.tables);
        setPresetMsg(`"${data.name}" 불러옴`);
        setTimeout(() => setPresetMsg(''), 3000);
        await handleSaveToServer();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setPresetMsg(`불러오기 실패: ${msg}`);
      console.error('Failed to load preset:', err);
    }
  };

  const deleteTablePreset = async (id: number) => {
    if (!confirm('이 프리셋을 삭제하시겠습니까?')) return;
    setPresetMsg('');
    try {
      const res = await fetch(`/api/table-presets/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setTablePresets(prev => prev.filter(p => p.id !== id));
      setPresetLoadId('');
      setPresetMsg('삭제됨');
      setTimeout(() => setPresetMsg(''), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setPresetMsg(`삭제 실패: ${msg}`);
      console.error('Failed to delete preset:', err);
    }
  };

  const handleSaveToServer = async (overrides?: { table_previews?: Record<string, Record<string, any>> }) => {
    setIsSaving(true);
    setSaveMessage('');
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          db_host: dbHost,
          db_port: dbPort,
          db_name: dbName,
          db_user: dbUser,
          db_pw: dbPw,
          query_type: queryType,
          generated_sql: generatedSql,
          bookmarked_tables: Array.from(bookmarkedTables),
          selected_fields: selectedFields,
          table_comparisons: Array.from(previewTables),
          table_previews: overrides?.table_previews ?? tablePreviews,
          bookmark_aliases: bookmarkAliases,
          saved_relationships: savedRelationships,
          active_tables: activeTables,
          table_date_columns: selectedDateColumns
        })
      });
      
      if (!response.ok) throw new Error('Failed to save');
      
      setSaveMessage('저장 완료');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setSaveMessage('저장 실패');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleTableExpand = (tableName: string) => {
    setExpandedTables(prev => {
      const next = new Set(prev);
      if (next.has(tableName)) {
        next.delete(tableName);
      } else {
        next.add(tableName);
      }
      return next;
    });
  };

  const toggleBookmark = (e: any, tableName: string) => {
    e.stopPropagation();
    setBookmarkedTables(prev => {
      const next = new Set(prev);
      if (next.has(tableName)) {
        next.delete(tableName);
      } else {
        next.add(tableName);
      }
      return next;
    });
  };

  const toggleTableSelection = (e: any, tableName: string) => {
    e.stopPropagation();
    setSelectedFields(prev => {
      const newSelected = { ...prev };
      const allCols = schemaDict[tableName] || [];
      if (newSelected[tableName] && newSelected[tableName].length === allCols.length) {
        delete newSelected[tableName];
      } else {
        newSelected[tableName] = [...allCols];
      }
      return newSelected;
    });
  };

  const toggleColumnSelection = (tableName: string, columnName: string) => {
    setSelectedFields(prev => {
      const newSelected = { ...prev };
      if (!newSelected[tableName]) {
        newSelected[tableName] = [columnName];
      } else {
        if (newSelected[tableName].includes(columnName)) {
          newSelected[tableName] = newSelected[tableName].filter(c => c !== columnName);
          if (newSelected[tableName].length === 0) {
            delete newSelected[tableName];
          }
        } else {
          newSelected[tableName] = [...newSelected[tableName], columnName];
        }
      }
      return newSelected;
    });
  };

  const handleBatchFetchPreview = async () => {
    setIsBatchFetching(true);
    try {
      await Promise.all([...previewTables].map(table => fetchSampleData(table)));
    } finally {
      setIsBatchFetching(false);
    }
  };

  const handleDownloadPreviewCsv = (table: string) => {
    const cols = schemaDict[table] || [];
    const data = sampleDataDict[table] || tablePreviews[table];
    if (!data) return;

    const headers = '컬럼명,데이터타입,값';
    const rows = cols.map(col => {
      const colName = col.split(' (')[0];
      const colType = col.split(' (')[1]?.replace(')', '') || '';
      let val = data[colName];
      val = val === null || val === undefined ? '' : String(val);
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        val = `"${val.replace(/"/g, '""')}"`;
      }
      return `${colName},${colType},${val}`;
    }).join('\n');

    const blob = new Blob(['\uFEFF' + headers + '\n' + rows], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${table.replace(/\./g, '_')}_preview.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(URL.createObjectURL(blob));
  };

  const handleDownloadAllPreviewsCsv = () => {
    const tables = [...previewTables].sort();
    const allCols: { table: string; col: string; type: string; val: string }[] = [];

    for (const table of tables) {
      const cols = schemaDict[table] || [];
      const data = sampleDataDict[table] || tablePreviews[table];
      if (!data) continue;
      for (const col of cols) {
        const colName = col.split(' (')[0];
        const colType = col.split(' (')[1]?.replace(')', '') || '';
        let val = data[colName];
        val = val === null || val === undefined ? '' : String(val);
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          val = `"${val.replace(/"/g, '""')}"`;
        }
        allCols.push({ table, col: colName, type: colType, val });
      }
    }

    if (allCols.length === 0) return;
    const header = '테이블명,컬럼명,데이터타입,값';
    const rows = allCols.map(r => `${r.table},${r.col},${r.type},${r.val}`).join('\n');
    const blob = new Blob(['\uFEFF' + header + '\n' + rows], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `all_previews_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  };

  const handleCloseAllPreviews = () => {
    setTmSampleData({});
    setTmSampleErrors({});
  };

  const handleDeletePreview = (table: string) => {
    setTablePreviews(prev => { const n = { ...prev }; delete n[table]; return n; });
    setSampleDataDict(prev => { const n = { ...prev }; delete n[table]; return n; });
  };

  const generateSqlFromFields = (): string => {
    const entries = Object.entries(selectedFields).filter(([, cols]: [string, string[]]) => cols.length > 0) as [string, string[]][];
    if (entries.length === 0) return '';

    return entries.map(([table, cols]) => {
      const sorted = [...cols].sort();
      const colNames = sorted.map(c => `  ${c.split(' (')[0]}`).join(',\n');
      return `SELECT\n${colNames}\nFROM ${table}\nLIMIT 10;`;
    }).join('\n\n');
  };

  const handleDownloadRelationsCsv = () => {
    const allTables = [...new Set([...Object.keys(schemaDict), ...Object.keys(tablePreviews)])].sort();
    const colToTables: Record<string, { table: string; type: string }[]> = {};
    for (const table of allTables) {
      for (const col of (schemaDict[table] || [])) {
        const base = col.split(' (')[0];
        const type = col.split(' (')[1]?.replace(')', '') || '';
        if (!colToTables[base]) colToTables[base] = [];
        if (!colToTables[base].some(x => x.table === table)) {
          colToTables[base].push({ table, type });
        }
      }
    }
    const common = Object.entries(colToTables).filter(([, v]) => v.length >= 2);
    if (common.length === 0) return;

    const header = '컬럼명,공유테이블수,테이블목록';
    const rows = common
      .sort((a, b) => b[1].length - a[1].length)
      .map(([col, tables]) => {
        const list = tables.map(t => `${t.table}(${t.type})`).join('; ');
        return `${col},${tables.length},"${list}"`;
      }).join('\n');

    const blob = new Blob(['\uFEFF' + header + '\n' + rows], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `table_relationships_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  };

  // --- Render Functions for Menus ---

  const renderSettings = () => (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">환경 설정</h2>
        <p className="text-gray-500 mt-1">데이터베이스 연결 정보를 설정합니다.</p>
      </div>
      
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 space-y-8">
        {/* DB Connection */}
        <div className="space-y-5">
          <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <Database size={18} className="text-blue-600" /> PostgreSQL 연결 정보
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm text-gray-600 font-medium">Host</label>
              <div className="relative">
                <Server size={16} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={dbHost}
                  onChange={(e) => setDbHost(e.target.value)}
                  className="w-full pl-10 p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm text-gray-600 font-medium">Port</label>
              <input
                type="text"
                value={dbPort}
                onChange={(e) => setDbPort(e.target.value)}
                className="w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
              />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-sm text-gray-600 font-medium">Database Name</label>
            <div className="relative">
              <Database size={16} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                value={dbName}
                onChange={(e) => setDbName(e.target.value)}
                className="w-full pl-10 p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
              />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-sm text-gray-600 font-medium">User</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                value={dbUser}
                onChange={(e) => setDbUser(e.target.value)}
                className="w-full pl-10 p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
              />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-sm text-gray-600 font-medium">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="password"
                value={dbPw}
                onChange={(e) => setDbPw(e.target.value)}
                className="w-full pl-10 p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
              />
            </div>
          </div>
          
          <button
            onClick={handleConnectDb}
            disabled={isConnecting}
            className="w-full mt-4 bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70 shadow-sm"
          >
            {isConnecting ? (
              <><Loader2 size={18} className="animate-spin" /> 연결 중...</>
            ) : (
              'DB 연결 및 구조 읽기'
            )}
          </button>
          
          {dbError && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 flex items-start gap-2 mt-4">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span className="break-all">{dbError}</span>
            </div>
          )}
          
          {dbSuccess && (
            <div className="text-sm text-green-700 bg-green-50 p-3 rounded-lg border border-green-200 flex items-center gap-2 mt-4">
              <Check size={18} /> DB 구조를 성공적으로 읽어왔습니다! (잠시 후 SQL 생성 메뉴로 이동합니다)
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderGenerator = () => {
    const genVisibleTables = Object.keys(schemaDict).filter(t => !bookmarkedTables.has(t) && (activeTables.length === 0 || activeTables.includes(t)));
    const genAllTables = [...Array.from(bookmarkedTables as Set<string>), ...genVisibleTables];
    const genAllSelected = genAllTables.length > 0 && genAllTables.every(t => {
      const cols = schemaDict[t] || [];
      const sel = selectedFields[t] || [];
      return cols.length > 0 && sel.length === cols.length;
    });

    return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">SQL 생성</h2>
        <p className="text-gray-500 mt-1">선택한 테이블과 필드로 SELECT 쿼리를 자동 생성합니다.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Column 1: Schema */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
              <Database size={20} className="text-blue-600" /> 테이블 및 필드 선택
            </h3>
          </div>
          
          {schemaInfo ? (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[650px]">
              <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={genAllSelected}
                    onChange={() => {
                      if (genAllSelected) {
                        setSelectedFields({});
                      } else {
                        const newSel: Record<string, string[]> = {};
                        for (const t of genAllTables) {
                          newSel[t] = [...(schemaDict[t] || [])];
                        }
                        setSelectedFields(newSel);
                      }
                    }}
                  />
                  {genAllSelected ? '전체 해제' : '전체 선택'}
                </label>
              </div>
              <div className="flex-1 overflow-y-auto bg-gray-50/50 p-3 space-y-6">
                {/* Bookmarked Tables Section */}
                {bookmarkedTables.size > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-2 px-1 flex items-center gap-1">
                      <Star size={10} fill="currentColor" /> 북마크된 테이블
                    </div>
                    {Array.from(bookmarkedTables as Set<string>)
                      .sort((a, b) => a.localeCompare(b))
                      .map((table: string) => {
                        const allCols = schemaDict[table] || [];
                        const selectedCols = selectedFields[table] || [];
                        const isAllSelected = selectedCols.length === allCols.length && allCols.length > 0;
                        const isPartialSelected = selectedCols.length > 0 && selectedCols.length < allCols.length;

                        return (
                          <div key={`fav-${table}`} className="bg-blue-50/30 border border-blue-100 rounded-lg overflow-hidden shadow-sm">
                            <div 
                              className="px-3 py-2.5 flex items-center justify-between cursor-pointer hover:bg-blue-50 transition-colors"
                              onClick={() => toggleTableExpand(`fav-${table}`)}
                            >
                              <div className="flex items-center gap-2 overflow-hidden">
                                <input 
                                  type="checkbox" 
                                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                  checked={isAllSelected}
                                  ref={el => { if (el) el.indeterminate = isPartialSelected; }}
                                  onChange={(e) => toggleTableSelection(e, table)}
                                  onClick={(e) => e.stopPropagation()}
                                />
                                {expandedTables.has(`fav-${table}`) ? <ChevronDown size={16} className="text-blue-400 shrink-0" /> : <ChevronRight size={16} className="text-blue-400 shrink-0" />}
                                <span className="text-sm font-semibold text-blue-900 truncate" title={table}>{table}</span>
                                {bookmarkAliases[table] && (
                                  <span className="text-[10px] text-blue-500 bg-blue-100 px-1.5 py-0.5 rounded whitespace-nowrap">{bookmarkAliases[table]}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-blue-400">{selectedCols.length}/{allCols.length}</span>
                                <button 
                                  onClick={(e) => toggleBookmark(e, table)}
                                  className="p-1 rounded hover:bg-blue-100 text-yellow-500 transition-colors"
                                >
                                  <Star size={16} fill="currentColor" />
                                </button>
                              </div>
                            </div>
                            {expandedTables.has(`fav-${table}`) && (
                              <div className="px-3 py-2 bg-white border-t border-blue-50 text-xs font-mono text-gray-600 flex flex-col gap-1">
                                <div className="flex justify-between items-center mb-1 pb-1 border-b border-gray-100">
                                  <span className="font-semibold text-gray-400">Columns</span>
                                  <div className="flex items-center gap-2">
                                    {editingAlias === table ? (
                                      <div className="flex items-center gap-1">
                                        <input
                                          type="text"
                                          className="w-28 px-2 py-0.5 text-[10px] border border-blue-300 rounded focus:ring-1 focus:ring-blue-500 outline-none bg-white font-sans"
                                          placeholder="별칭 입력..."
                                          value={bookmarkAliases[table] || ''}
                                          onChange={(e) => setBookmarkAliases(prev => ({ ...prev, [table]: e.target.value }))}
                                          autoFocus
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                        <button onClick={(e) => { e.stopPropagation(); setEditingAlias(null); }} className="text-green-600 hover:text-green-800"><Check size={12} /></button>
                                        <button onClick={(e) => { e.stopPropagation(); setBookmarkAliases(prev => { const n = { ...prev }; delete n[table]; return n; }); setEditingAlias(null); }} className="text-red-400 hover:text-red-600"><X size={12} /></button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setEditingAlias(table); }}
                                        className="text-blue-400 hover:text-blue-600 font-sans text-[10px] flex items-center gap-1"
                                      >
                                        {bookmarkAliases[table] ? '별칭 수정' : '별칭 추가'}
                                      </button>
                                    )}
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); fetchSampleData(table); }}
                                      disabled={loadingSamples[table]}
                                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1 font-sans font-medium"
                                    >
                                      {loadingSamples[table] ? <Loader2 size={12} className="animate-spin" /> : <Table size={12} />}
                                      {sampleDataDict[table] ? '샘플 다시 불러오기' : '첫 줄 불러오기'}
                                    </button>
              </div>
            </div>
                                {allCols.map((col, i) => {
                                  const sampleValue = sampleDataDict[table]?.[col.split(' (')[0]];
                                  return (
                                    <label key={i} className="flex items-center gap-2 py-1 hover:bg-blue-50 px-2 rounded cursor-pointer group">
                                      <input 
                                        type="checkbox"
                                        className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                        checked={selectedCols.includes(col)}
                                        onChange={() => toggleColumnSelection(table, col)}
                                      />
                                      <div 
                                        className="flex items-center gap-2 overflow-hidden w-full"
                                        title={sampleValue !== undefined ? `예시 데이터: ${String(sampleValue)}` : col}
                                      >
                                        <span className="truncate font-medium text-gray-700 shrink-0" title={col}>{col}</span>
                                        {sampleValue !== undefined && (
                                          <span className="text-[10px] text-blue-500 truncate italic opacity-40 group-hover:opacity-100 transition-opacity border-l border-blue-100 pl-2">
                                            {String(sampleValue)}
                                          </span>
                                        )}
                                      </div>
                                    </label>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })
                    }
                  </div>
                )}

                {/* All Tables Section */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">전체 테이블</div>
                  {Object.keys(schemaDict)
                    .filter(t => !bookmarkedTables.has(t))
                    .filter(t => activeTables.length === 0 || activeTables.includes(t))
                    .sort((a, b) => a.localeCompare(b))
                    .map(table => {
                      const allCols = schemaDict[table] || [];
                      const selectedCols = selectedFields[table] || [];
                      const isAllSelected = selectedCols.length === allCols.length && allCols.length > 0;
                      const isPartialSelected = selectedCols.length > 0 && selectedCols.length < allCols.length;

                      return (
                        <div key={`all-${table}`} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                          <div 
                            className="px-3 py-2.5 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => toggleTableExpand(`all-${table}`)}
                          >
                            <div className="flex items-center gap-2 overflow-hidden">
                              <input 
                                type="checkbox" 
                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                checked={isAllSelected}
                                ref={el => { if (el) el.indeterminate = isPartialSelected; }}
                                onChange={(e) => toggleTableSelection(e, table)}
                                onClick={(e) => e.stopPropagation()}
                              />
                              {expandedTables.has(`all-${table}`) ? <ChevronDown size={16} className="text-gray-400 shrink-0" /> : <ChevronRight size={16} className="text-gray-400 shrink-0" />}
                              <span className="text-sm font-medium text-gray-800 truncate" title={table}>{table}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400">{selectedCols.length}/{allCols.length}</span>
                              <button 
                                onClick={(e) => toggleBookmark(e, table)}
                                className={`p-1 rounded hover:bg-gray-200 transition-colors ${bookmarkedTables.has(table) ? 'text-yellow-500' : 'text-gray-300 hover:text-gray-500'}`}
                              >
                                <Star size={16} fill={bookmarkedTables.has(table) ? "currentColor" : "none"} />
                              </button>
                            </div>
                          </div>
                          {expandedTables.has(`all-${table}`) && (
                            <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 text-xs font-mono text-gray-600 flex flex-col gap-1">
                              <div className="flex justify-between items-center mb-1 pb-1 border-b border-gray-200">
                                <span className="font-semibold text-gray-500">Columns</span>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); fetchSampleData(table); }}
                                  disabled={loadingSamples[table]}
                                  className="text-blue-600 hover:text-blue-800 flex items-center gap-1 font-sans font-medium"
                                >
                                  {loadingSamples[table] ? <Loader2 size={12} className="animate-spin" /> : <Table size={12} />}
                                  {sampleDataDict[table] ? '샘플 다시 불러오기' : '첫 줄 불러오기'}
                                </button>
                              </div>
                              {allCols.map((col, i) => {
                                const sampleValue = sampleDataDict[table]?.[col.split(' (')[0]];
                                return (
                                  <label key={i} className="flex items-center gap-2 py-1 hover:bg-gray-100 px-2 rounded cursor-pointer group">
                                    <input 
                                      type="checkbox"
                                      className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                      checked={selectedCols.includes(col)}
                                      onChange={() => toggleColumnSelection(table, col)}
                                    />
                                    <div 
                                      className="flex items-center gap-2 overflow-hidden w-full"
                                      title={sampleValue !== undefined ? `예시 데이터: ${String(sampleValue)}` : col}
                                    >
                                      <span className="truncate font-medium shrink-0" title={col}>{col}</span>
                                      {sampleValue !== undefined && (
                                        <span className="text-[10px] text-blue-500 truncate italic opacity-40 group-hover:opacity-100 transition-opacity border-l border-gray-200 pl-2">
                                          {String(sampleValue)}
                                        </span>
                                      )}
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })
                  }
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 text-blue-800 text-sm p-5 rounded-xl border border-blue-100 flex flex-col items-center justify-center gap-3 h-[650px] text-center">
              <Database size={32} className="text-blue-300" />
              <p>좌측 <strong>환경 설정</strong> 메뉴에서<br/>DB를 먼저 연결해주세요.</p>
              <button 
                onClick={() => setActiveMenu('settings')}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                환경 설정으로 이동
              </button>
            </div>
          )}
        </div>
        
        {/* Column 2: Generated SQL */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
            <Code2 size={20} className="text-blue-600" /> 생성된 SQL
          </h3>
          
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">쿼리 생성 모드:</label>
                <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                  <button
                    onClick={() => setQueryType('standard')}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${queryType === 'standard' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    일반 SQL
                  </button>
                  <button
                    onClick={() => setQueryType('grafana')}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${queryType === 'grafana' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Grafana SQL
                  </button>
                </div>
              </div>
            </div>

            {/* Saved Relationship JOIN Suggestions */}
            {Object.keys(selectedFields).length > 0 && savedRelationships.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-700">
                  <Link size={12} /> 추천 JOIN (저장된 관계)
                </div>
                {savedRelationships
                  .filter((r: any) => {
                    const selectedTables = Object.keys(selectedFields);
                    return selectedTables.includes(r.source_table) && selectedTables.includes(r.target_table);
                  })
                  .map((r: any, i: number) => {
                    const srcAlias = r.source_table.split('.').pop();
                    const tgtAlias = r.target_table.split('.').pop();
                    const joinSql = `  JOIN ${r.target_table} ${tgtAlias} ON ${srcAlias}."${r.source_field}" = ${tgtAlias}."${r.target_field}"`;
                    return (
                      <div key={i} className="flex items-center justify-between gap-2">
                        <code className="text-[10px] font-mono text-blue-800 bg-blue-100 px-1.5 py-0.5 rounded flex-1 truncate">{joinSql}</code>
                        <button
                          onClick={() => {
                            const sql = `SELECT *
FROM ${r.source_table} ${srcAlias}${joinSql}
LIMIT 10;`;
                            setGeneratedSql(sql);
                          }}
                          className="px-2 py-1 bg-blue-600 text-white text-[10px] font-medium rounded hover:bg-blue-700 shrink-0"
                        >
                          적용
                        </button>
                      </div>
                    );
                  })}
                {savedRelationships.filter((r: any) => {
                  const selectedTables = Object.keys(selectedFields);
                  return selectedTables.includes(r.source_table) && selectedTables.includes(r.target_table);
                }).length === 0 && (
                  <p className="text-[10px] text-blue-500">선택한 테이블 조합에 저장된 관계가 없습니다. 관계 분석 메뉴에서 추가하세요.</p>
                )}
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">선택한 필드로 자동 생성된 쿼리</label>
              <textarea
                value={generatedSql || generateSqlFromFields()}
                onChange={(e) => setGeneratedSql(e.target.value)}
                placeholder="좌측에서 테이블과 필드를 선택하면 자동으로 SELECT 쿼리가 생성됩니다."
                className="w-full h-64 p-4 text-sm font-mono bg-gray-900 text-gray-100 border border-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y"
              />
            </div>
            
            {!generatedSql && !generateSqlFromFields() && (
              <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
                좌측 DB 구조에서 <strong>테이블</strong>과 <strong>필드</strong>를 체크하면<br/>자동으로 SELECT 쿼리가 생성됩니다.
              </div>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  const sql = generatedSql || generateSqlFromFields();
                  if (sql) {
                    navigator.clipboard.writeText(sql);
                  }
                }}
                disabled={!(generatedSql || generateSqlFromFields())}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3.5 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm text-base border border-gray-200"
              >
                <Copy size={20} /> 복사하기
              </button>
              <button
                onClick={() => {
                  const sql = generatedSql || generateSqlFromFields();
                  if (sql) {
                    setGeneratedSql(sql);
                    setActiveMenu('query');
                  }
                }}
                disabled={!(generatedSql || generateSqlFromFields())}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3.5 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm text-base"
              >
                <Play size={20} /> 데이터 조회로 보내기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  };

  const renderQuery = () => (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">데이터 조회</h2>
        <p className="text-gray-500 mt-1">생성된 SQL을 확인하고 데이터베이스에서 직접 조회합니다.</p>
      </div>
      
      <div className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between">
            <label className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <Code2 size={20} className="text-blue-600" /> 생성된 쿼리 (수정 가능)
            </label>
            <button
              onClick={() => setGeneratedSql('')}
              className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2.5 py-1 rounded transition-colors border border-red-200"
            >
              내용 지우기
            </button>
          </div>
          
          <textarea
            value={generatedSql}
            onChange={(e) => setGeneratedSql(e.target.value)}
            placeholder="SQL 쿼리가 여기에 표시됩니다. 직접 입력하거나 'SQL 생성' 메뉴에서 생성해주세요."
            className="w-full h-64 p-5 font-mono text-sm bg-gray-900 text-gray-100 border border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-y"
          />
          
          <button
            onClick={handleRunQuery}
            disabled={isQuerying || !generatedSql.trim()}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-3.5 px-8 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70 shadow-sm text-base"
          >
            {isQuerying ? (
              <><Loader2 size={20} className="animate-spin" /> 데이터베이스에서 조회 중...</>
            ) : (
              <>▶️ 이 쿼리로 데이터 조회하기</>
            )}
          </button>
          
          {queryError && (
            <div className="text-sm text-red-600 bg-red-50 p-4 rounded-lg border border-red-100 flex items-start gap-2">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span className="break-all">{queryError}</span>
            </div>
          )}
        </div>
        
        {/* Results Table */}
        {queryResults && (
          <div className="space-y-4 pb-12">
            <div className="bg-green-50 p-4 rounded-xl border border-green-200 flex items-center justify-between">
              <div className="text-green-800 text-sm flex items-center gap-2 font-medium">
                <Check size={18} /> 조회 성공! 총 {queryResults.results.reduce((s, r) => s + r.rows.length, 0)}건의 데이터가 있습니다.
              </div>
              
              <button
                onClick={handleDownloadCsv}
                disabled={queryResults.results.every(r => r.rows.length === 0)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-green-300 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={16} /> CSV로 저장
              </button>
            </div>

            <div className="space-y-6">
              {queryResults.results.map((result, idx) => (
                result.fields.length > 0 && (
                  <div key={idx} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500">
                      {result.table || `결과 ${idx + 1}`}
                    </div>
                    <div className="overflow-x-auto max-h-[500px]">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                          <tr>
                            {result.fields.map((field, i) => (
                              <th key={i} className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                {field}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {result.rows.length > 0 ? (
                            result.rows.map((row, i) => (
                              <tr key={i} className="hover:bg-gray-50 transition-colors">
                                {result.fields.map((field, j) => (
                                  <td key={j} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {row[field] !== null ? String(row[field]) : <span className="text-gray-400 italic">null</span>}
                                  </td>
                                ))}
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={result.fields.length} className="px-6 py-12 text-center text-sm text-gray-500">
                                데이터가 없습니다.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderPreview = () => {
    const previewList: string[] = [...previewTables].sort();

    const savedTables = Object.keys(tablePreviews).sort();
    const hasAnyData = previewList.some(t => sampleDataDict[t] || tablePreviews[t]);
    const allDataTables = [...new Set([...previewList, ...savedTables])].sort();

    const visibleTables = Object.keys(schemaDict)
      .filter(t => activeTables.length === 0 || activeTables.includes(t))
      .sort();
    const allSelected = visibleTables.length > 0 && visibleTables.every(t => previewTables.has(t));

    const colToTables: Record<string, string[]> = {};
    for (const table of allDataTables) {
      for (const col of (schemaDict[table] || [])) {
        const base = col.split(' (')[0];
        if (!colToTables[base]) colToTables[base] = [];
        if (!colToTables[base].includes(table)) colToTables[base].push(table);
      }
    }
    const commonCols = Object.entries(colToTables).filter(([, tables]) => tables.length >= 2);

    return (
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">데이터 미리보기</h2>
          <p className="text-gray-500 mt-1">여러 테이블의 첫 번째 행 데이터를 한눈에 확인하고 저장합니다.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Table Selector */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
                <Database size={20} className="text-blue-600" /> 테이블 선택
              </h3>
            </div>
            
            {schemaInfo ? (
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col" style={{maxHeight: '650px'}}>
                <div className="p-3 bg-gray-50 border-b border-gray-200 space-y-2">
                  <div className="flex gap-2">
                    <button
                      onClick={handleBatchFetchPreview}
                      disabled={previewTables.size === 0 || isBatchFetching}
                      className="flex-1 bg-blue-600 text-white text-sm font-medium py-2 px-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
                    >
                      {isBatchFetching ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                      선택 테이블 첫 줄 가져오기
                    </button>
                    <button
                      onClick={() => handleSaveToServer({ table_previews: { ...tablePreviews, ...sampleDataDict } })}
                      disabled={isSaving}
                      className="bg-gray-800 text-white text-sm font-medium py-2 px-3 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
                    >
                      {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      저장
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer hover:text-gray-700">
                      <input
                        type="checkbox"
                        className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={allSelected}
                        onChange={() => {
                          setPreviewTables(allSelected ? new Set() : new Set(visibleTables));
                        }}
                      />
                      {allSelected ? '전체 해제' : '전체 선택'}
                    </label>
                    <span>{previewTables.size > 0 ? `${previewTables.size}개 테이블 선택됨` : '가져올 테이블을 체크하세요'}</span>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                  {Object.keys(schemaDict)
                    .filter(t => activeTables.length === 0 || activeTables.includes(t))
                    .sort((a, b) => a.localeCompare(b)).map(table => (
                      <label key={table} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        checked={previewTables.has(table)}
                        onChange={() => {
                          setPreviewTables(prev => {
                            const next = new Set(prev);
                            if (next.has(table)) next.delete(table);
                            else next.add(table);
                            return next;
                          });
                        }}
                      />
                      <span className="text-sm text-gray-800 truncate flex-1" title={table}>{table}</span>
                      <span className="text-xs text-gray-400">{(schemaDict[table] || []).length}</span>
                      {(sampleDataDict[table] || tablePreviews[table]) && <span className="text-xs text-green-500 font-bold">✓</span>}
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 text-blue-800 text-sm p-5 rounded-xl border border-blue-100 flex flex-col items-center justify-center gap-3 h-[400px] text-center">
                <Database size={32} className="text-blue-300" />
                <p>먼저 DB 구조를 읽어와야 합니다.</p>
                <button onClick={() => setActiveMenu('settings')} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">환경 설정으로 이동</button>
              </div>
            )}
          </div>

          {/* Right: Preview Cards + Management */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
                <Search size={20} className="text-blue-600" /> 데이터 미리보기
              </h3>
              {hasAnyData && (
                <button
                  onClick={handleDownloadAllPreviewsCsv}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors shadow-sm"
                >
                  <Download size={14} /> 전체 CSV 저장
                </button>
              )}
            </div>

            {previewList.length === 0 && savedTables.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-12 text-center">
                <Database size={48} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-sm">좌측에서 테이블을 선택하고<br/>"첫 줄 가져오기"를 눌러주세요.</p>
              </div>
            ) : (
              <>
                {/* Preview Cards */}
                <div className="space-y-6 max-h-[500px] overflow-y-auto pr-1">
                  {previewList.map(table => {
                    const cols = schemaDict[table] || [];
                    const displayData = sampleDataDict[table] || tablePreviews[table];

                    return (
                      <div key={table} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Database size={16} className="text-blue-500" />
                            <h4 className="text-sm font-semibold text-gray-800">{table}</h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">{cols.length}개 컬럼</span>
                            {displayData ? (
                              <>
                                <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">데이터 있음</span>
                                <button
                                  onClick={() => handleDownloadPreviewCsv(table)}
                                  className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
                                  title="CSV 저장"
                                >
                                  <Download size={12} /> CSV
                                </button>
                              </>
                            ) : (
                              <span className="text-xs text-gray-400 italic">데이터 없음</span>
                            )}
                          </div>
                        </div>
                        {displayData ? (
                          <div className="overflow-x-auto">
                            <table className="min-w-full">
                              <thead>
                                <tr className="bg-gray-50">
                                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">컬럼명</th>
                                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">타입</th>
                                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">값 (첫 번째 행)</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {cols.map(col => {
                                  const colName = col.split(' (')[0];
                                  const colType = col.split(' (')[1]?.replace(')', '') || '';
                                  const value = displayData[colName];
                                  return (
                                    <tr key={col} className="hover:bg-gray-50 transition-colors">
                                      <td className="px-4 py-2.5 text-sm font-medium text-gray-800 whitespace-nowrap">{colName}</td>
                                      <td className="px-4 py-2.5 text-xs text-gray-400 font-mono whitespace-nowrap">{colType}</td>
                                      <td className="px-4 py-2.5 text-sm font-mono text-gray-700 break-all max-w-md">
                                        {value !== null && value !== undefined ? String(value) : <span className="text-gray-300 italic">null</span>}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="p-8 text-center text-sm text-gray-400">
                            첫 줄 데이터가 없습니다. "선택 테이블 첫 줄 가져오기"를 눌러주세요.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Saved Previews Management */}
                {savedTables.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                        <Database size={16} className="text-blue-500" /> 저장된 프리뷰 목록
                      </h4>
                      <span className="text-xs text-gray-400">총 {savedTables.length}개 테이블</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">테이블명</th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">컬럼 수</th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">상태</th>
                            <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase">액션</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {savedTables.map(table => {
                            const cols = schemaDict[table] || [];
                            const hasData = !!tablePreviews[table];
                            return (
                              <tr key={table} className="hover:bg-gray-50 transition-colors text-sm">
                                <td className="px-4 py-2.5 font-medium text-gray-800">{table}</td>
                                <td className="px-4 py-2.5 text-gray-500">{cols.length}개</td>
                                <td className="px-4 py-2.5">
                                  {hasData ? (
                                    <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">저장됨</span>
                                  ) : (
                                    <span className="text-xs text-gray-400 italic">미저장</span>
                                  )}
                                </td>
                                <td className="px-4 py-2.5 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      onClick={() => handleDownloadPreviewCsv(table)}
                                      disabled={!hasData}
                                      className="px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                      title="CSV 저장"
                                    >
                                      <Download size={12} />
                                    </button>
                                    <button
                                      onClick={() => handleDeletePreview(table)}
                                      className="px-2 py-1 bg-red-500 text-white text-xs font-medium rounded hover:bg-red-600 transition-colors"
                                      title="삭제"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Relationship Analysis */}
                {commonCols.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                          <Search size={16} className="text-purple-500" /> 테이블 관계 분석
                        </h4>
                        <p className="text-xs text-gray-400 mt-0.5">같은 이름의 컬럼을 공유하는 테이블들 — 잠재적 JOIN 키 / 관계</p>
                      </div>
                      <button
                        onClick={handleDownloadRelationsCsv}
                        className="flex items-center gap-1 px-2 py-1 bg-purple-600 text-white text-xs font-medium rounded hover:bg-purple-700 transition-colors"
                      >
                        <Download size={12} /> CSV
                      </button>
                    </div>
                    <div className="p-4 space-y-3">
                      {commonCols
                        .sort((a, b) => b[1].length - a[1].length)
                        .map(([col, tables]) => (
                          <div key={col} className="flex items-start gap-3">
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-purple-100 text-purple-700 text-xs font-bold shrink-0 mt-0.5">
                              {tables.length}
                            </span>
                            <div>
                              <span className="text-sm font-semibold text-gray-800 font-mono">{col}</span>
                              <div className="text-xs text-gray-500 mt-0.5">
                                <span className="text-gray-400">→</span>{' '}
                                {tables.map((t, i) => (
                                  <span key={t}>
                                    {i > 0 && <span className="text-gray-300 mx-1">·</span>}
                                    <span className="font-medium text-gray-700">{t}</span>
                                    <span className="text-gray-400 ml-1">({((schemaDict[t] || []).find(c => c.split(' (')[0] === col)?.split(' (')[1]?.replace(')', '')) || '?'})</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const handleFieldSearch = async () => {
    if (!relSearchQuery.trim() || !dbName) return;
    setRelLoading(true);
    setRelError('');
    try {
      const res = await fetch('/api/search-fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host: dbHost, port: parseInt(dbPort, 10), database: dbName, user: dbUser, password: dbPw, query: relSearchQuery })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRelSearchResults(data.results || []);
    } catch (err: any) {
      setRelError(err.message);
    } finally {
      setRelLoading(false);
    }
  };

  const handleFindSimilar = async () => {
    if (!relTargetTable || !relTargetField || !dbName) return;
    setRelLoading(true);
    setRelSuggestions([]);
    setRelVerificationResult(null);
    setRelError('');
    try {
      const res = await fetch('/api/field-similarity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host: dbHost, port: parseInt(dbPort, 10), database: dbName, user: dbUser, password: dbPw, table: relTargetTable, field: relTargetField })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRelSuggestions(data.suggestions || []);
    } catch (err: any) {
      setRelError(err.message);
    } finally {
      setRelLoading(false);
    }
  };

  const handleVerifyOverlap = async (targetTable: string, targetField: string) => {
    const key = `${targetTable}|${targetField}`;
    setRelVerifying(prev => ({ ...prev, [key]: true }));
    setRelVerificationResult(null);
    try {
      const res = await fetch('/api/field-value-overlap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host: dbHost, port: parseInt(dbPort, 10), database: dbName, user: dbUser, password: dbPw, source_table: relTargetTable, source_field: relTargetField, target_table: targetTable, target_field: targetField })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRelVerificationResult(data);
    } catch (err: any) {
      setRelError(err.message);
    } finally {
      setRelVerifying(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleSaveRelationship = async (targetTable: string, targetField: string, similarity: number) => {
    try {
      const res = await fetch('/api/field-relationships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_table: relTargetTable, source_field: relTargetField, target_table: targetTable, target_field: targetField, similarity, confidence: 'manual' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.relationship) {
        setSavedRelationships(prev => {
          const existing = new Set(prev.map((r: any) => `${r.source_table}|${r.source_field}|${r.target_table}|${r.target_field}`));
          const key = `${data.relationship.source_table}|${data.relationship.source_field}|${data.relationship.target_table}|${data.relationship.target_field}`;
          if (existing.has(key)) return prev.map(r =>
            `${r.source_table}|${r.source_field}|${r.target_table}|${r.target_field}` === key ? data.relationship : r
          );
          return [...prev, data.relationship];
        });
      }
    } catch (err: any) {
      setRelError(err.message);
    }
  };

  const handleDeleteRelationship = async (id: number) => {
    try {
      await fetch(`/api/field-relationships/${id}`, { method: 'DELETE' });
      setSavedRelationships(prev => prev.filter((r: any) => r.id !== id));
    } catch (err: any) {
      console.error(err);
    }
  };

  const generateJoinSql = (sourceTable: string, sourceField: string, targetTable: string, targetField: string): string => {
    const srcAlias = sourceTable.split('.').pop() || sourceTable;
    const tgtAlias = targetTable.split('.').pop() || targetTable;
    return `SELECT *
FROM ${sourceTable} ${srcAlias}
JOIN ${targetTable} ${tgtAlias}
  ON ${srcAlias}."${sourceField}" = ${tgtAlias}."${targetField}"`;
  };

  const renderRelationships = () => (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">🔗 관계 분석</h2>
        <p className="text-gray-500 mt-1">테이블 간 필드 유사도를 분석하고 공통 값 기반 관계를 저장합니다.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Search + Selection */}
        <div className="lg:col-span-5 space-y-4">
          {/* Quick Search (한글 포함) */}
          {dbName ? (
            <>
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 space-y-3">
                <h4 className="text-sm font-semibold text-gray-700">🔎 필드 검색 (한글/영문)</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={relSearchQuery}
                    onChange={(e) => setRelSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleFieldSearch()}
                    placeholder="테이블명, 컬럼명, 한글 설명 검색..."
                    className="flex-1 p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <button onClick={handleFieldSearch} disabled={relLoading} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1">
                    {relLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                    검색
                  </button>
                </div>
                {relSearchResults.length > 0 && (
                  <div className="max-h-40 overflow-y-auto space-y-1 border border-gray-100 rounded-lg p-1">
                    {relSearchResults.map((r, i) => (
                      <div key={i} className="flex items-center justify-between px-2 py-1.5 hover:bg-blue-50 rounded cursor-pointer text-xs"
                        onClick={() => { setRelTargetTable(r.table); setRelTargetField(r.field); setRelSuggestions([]); setRelVerificationResult(null); setRelSearchResults([]); setRelSearchQuery(''); }}
                      >
                        <span className="font-medium text-gray-800">{r.table}.{r.field}</span>
                        <span className="text-gray-400">{r.type}{r.column_comment ? ` · ${r.column_comment}` : ''}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Target Selection */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 space-y-3">
                <h4 className="text-sm font-semibold text-gray-700">🎯 대상 필드</h4>
                <div>
                  <label className="text-xs text-gray-500">테이블</label>
                  <select
                    value={relTargetTable}
                    onChange={(e) => { setRelTargetTable(e.target.value); setRelTargetField(''); setRelSuggestions([]); }}
                    className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white mt-1"
                  >
                    <option value="">테이블 선택</option>
                    {Object.keys(schemaDict).filter(t => activeTables.length === 0 || activeTables.includes(t)).sort().map(t => (
                      <option key={t} value={t}>{t}{bookmarkAliases[t] ? ` (${bookmarkAliases[t]})` : ''}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500">필드</label>
                  <select
                    value={relTargetField}
                    onChange={(e) => setRelTargetField(e.target.value)}
                    className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white mt-1"
                    disabled={!relTargetTable}
                  >
                    <option value="">필드 선택</option>
                    {(schemaDict[relTargetTable] || []).map(c => {
                      const name = c.split(' (')[0];
                      const type = c.split(' (')[1]?.replace(')', '') || '';
                      return <option key={name} value={name}>{name} ({type})</option>;
                    })}
                  </select>
                </div>
                <button
                  onClick={handleFindSimilar}
                  disabled={!relTargetTable || !relTargetField || relLoading}
                  className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {relLoading ? <Loader2 size={16} className="animate-spin" /> : <Link size={16} />}
                  유사 필드 찾기
                </button>
              </div>
            </>
          ) : (
            <div className="bg-blue-50 text-blue-800 text-sm p-5 rounded-xl border border-blue-100 text-center">
              환경 설정에서 DB를 먼저 연결해주세요.
            </div>
          )}

          {/* Foreign Key Relationships */}
          {foreignKeys.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2"><Link size={14} className="text-green-600" /> 외래 키 관계 (FK)</h4>
                <span className="text-xs text-gray-400">{foreignKeys.length}개</span>
              </div>
              <div className="max-h-60 overflow-y-auto p-2 space-y-1">
                {foreignKeys.map((fk, i) => (
                  <div key={i} className="flex items-start gap-2 px-2 py-2 hover:bg-green-50 rounded text-xs border border-green-100">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-800 truncate">
                        <span className="text-green-700">{fk.source_table}</span>.<span className="text-blue-700">{fk.source_column}</span>
                      </div>
                      <div className="text-gray-400 text-[10px] flex items-center gap-1">
                        <span className="text-green-600">→</span>{' '}
                        <span className="text-green-700">{fk.target_table}</span>.<span className="text-blue-700">{fk.target_column}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const sql = generateJoinSql(fk.source_table, fk.source_column, fk.target_table, fk.target_column);
                        setGeneratedSql(sql);
                        setActiveMenu('generator');
                      }}
                      className="px-2 py-1 bg-green-600 text-white text-[10px] font-medium rounded hover:bg-green-700 transition-colors shrink-0"
                    >
                      JOIN SQL
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Saved Relationships */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2"><Save size={14} /> 저장된 관계</h4>
              <span className="text-xs text-gray-400">{savedRelationships.length}개</span>
            </div>
            <div className="max-h-60 overflow-y-auto p-2 space-y-1">
              {savedRelationships.length === 0 ? (
                <div className="text-xs text-gray-400 text-center py-4">저장된 관계가 없습니다.</div>
              ) : (
                savedRelationships.map((r: any, i: number) => (
                  <div key={r.id || i} className="flex items-start gap-2 px-2 py-2 hover:bg-gray-50 rounded text-xs border border-gray-100">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-800 truncate">{r.source_table}.{r.source_field}</div>
                      <div className="text-gray-400 text-[10px]">↔ {r.target_table}.{r.target_field}</div>
                      <div className="flex gap-2 mt-1">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">유사도: {Math.round(r.similarity * 100)}%</span>
                        {r.verified === 1 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-50 text-green-600">값 검증됨</span>}
                      </div>
                    </div>
                    <button onClick={() => handleDeleteRelationship(r.id)} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded shrink-0" title="삭제">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* AI Prompt */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2"><span className="text-purple-500">🤖</span> AI 프롬프트</h4>
              <button
                onClick={() => {
                  const tables = Object.keys(schemaDict).sort();
                  let prompt = `다음 PostgreSQL 데이터베이스의 스키마와 관계 정보를 분석해주세요.\n\n`;
                  prompt += `## 테이블 목록\n`;
                  for (const t of tables) {
                    const cols = (schemaDict[t] || []).sort();
                    prompt += `- ${t}: ${cols.join(', ')}\n`;
                  }
                  if (foreignKeys.length > 0) {
                    prompt += `\n## 외래 키 관계 (FK)\n`;
                    for (const fk of foreignKeys) {
                      prompt += `- ${fk.source_table}.${fk.source_column} → ${fk.target_table}.${fk.target_column}\n`;
                    }
                  }
                  const colToTables: Record<string, string[]> = {};
                  for (const t of tables) {
                    for (const c of (schemaDict[t] || [])) {
                      const base = c.split(' (')[0];
                      if (!colToTables[base]) colToTables[base] = [];
                      if (!colToTables[base].includes(t)) colToTables[base].push(t);
                    }
                  }
                  const common = Object.entries(colToTables).filter(([, ts]) => ts.length >= 2);
                  if (common.length > 0) {
                    prompt += `\n## 같은 이름의 컬럼을 가진 테이블들\n`;
                    for (const [col, ts] of common) {
                      prompt += `- ${col}: ${ts.join(', ')}\n`;
                    }
                  }
                  if (savedRelationships.length > 0) {
                    prompt += `\n## 저장된 관계\n`;
                    for (const r of savedRelationships) {
                      prompt += `- ${r.source_table}.${r.source_field} ↔ ${r.target_table}.${r.target_field} (유사도: ${Math.round(r.similarity * 100)}%)\n`;
                    }
                  }
                  prompt += `\n## 요청\n`;
                  prompt += `1. 각 테이블 간의 관계를 1:1, 1:N, N:M 중에서 설명해주세요.\n`;
                  prompt += `2. 유용한 JOIN 쿼리 예제를 3-5개 알려주세요.\n`;
                  prompt += `3. 특정 데이터를 조회하려면 어떤 테이블들을 어떻게 연결해야 하는지 알려주세요.\n`;
                  prompt += `4. 데이터 분석 관점에서 유용한 인사이트를 알려주세요.\n`;
                  setRelAiPrompt(prompt);
                }}
                className="text-xs px-2 py-1 rounded font-medium bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200"
              >
                생성
              </button>
            </div>
            {relAiPrompt && (
              <div className="p-2">
                <textarea
                  value={relAiPrompt}
                  onChange={e => setRelAiPrompt(e.target.value)}
                  className="w-full h-40 p-2.5 text-xs font-mono bg-gray-900 text-gray-100 border border-gray-800 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={() => { navigator.clipboard.writeText(relAiPrompt); }}
                  className="mt-1.5 w-full py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-lg transition-colors"
                >
                  클립보드에 복사
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Results */}
        <div className="lg:col-span-7 space-y-4">
          {relError && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" /> {relError}
            </div>
          )}

          {relVerificationResult && (
            <div className={`p-4 rounded-xl border ${relVerificationResult.overlap_count > 0 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  {relVerificationResult.overlap_count > 0 ? <Check size={16} className="text-green-600" /> : <AlertCircle size={16} className="text-yellow-600" />}
                  값 중복 확인 결과
                </h4>
                <button onClick={() => setRelVerificationResult(null)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
              </div>
              <div className="mt-2 text-xs space-y-1 text-gray-700">
                <p><strong>{relVerificationResult.source_table}.{relVerificationResult.source_field}</strong> ↔ <strong>{relVerificationResult.target_table}.{relVerificationResult.target_field}</strong></p>
                <p>일치하는 값: <strong>{relVerificationResult.overlap_count}</strong>개
                  (source: {relVerificationResult.source_overlap_pct}% / target: {relVerificationResult.target_overlap_pct}%)</p>
                <p>Source 전체: {relVerificationResult.source_total}건 · Target 전체: {relVerificationResult.target_total}건</p>
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => handleSaveRelationship(relVerificationResult.target_table, relVerificationResult.target_field, 
                    relSuggestions.find(s => s.table === relVerificationResult.target_table && s.field === relVerificationResult.target_field)?.similarity || 0.5)}
                  className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  이 관계 저장
                </button>
              </div>
            </div>
          )}

          {/* Suggestions */}
          {relSuggestions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
                  <Link size={20} className="text-blue-600" /> 유사 필드 추천
                </h3>
                <span className="text-xs text-gray-400">총 {relSuggestions.length}개</span>
              </div>
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {relSuggestions.map((item, i) => {
                  const pct = Math.round(item.similarity * 100);
                  return (
                    <div key={i} className={`bg-white border rounded-xl shadow-sm p-4 ${pct >= 80 ? 'border-green-200' : pct >= 50 ? 'border-blue-200' : 'border-gray-200'}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              pct >= 80 ? 'bg-green-100 text-green-700' : pct >= 50 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                            }`}>{pct}%</span>
                            <span className="text-sm font-semibold text-gray-800">{item.table}</span>
                            <span className="text-xs text-gray-400">{item.method}</span>
                          </div>
                          <div className="mt-1.5 flex items-center gap-3">
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-blue-700">{item.field}</code>
                            <span className="text-xs text-gray-400">{item.type}</span>
                          </div>
                          {item.column_comment && <p className="text-xs text-gray-500 mt-1">📝 {item.column_comment}</p>}
                          {item.table_comment && <p className="text-xs text-gray-400 mt-0.5">테이블: {item.table_comment}</p>}
                        </div>
                        <div className="flex flex-col gap-1.5 shrink-0">
                          <button
                            onClick={() => handleVerifyOverlap(item.table, item.field)}
                            disabled={relVerifying[`${item.table}|${item.field}`]}
                            className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-1"
                          >
                            {relVerifying[`${item.table}|${item.field}`] ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
                            값 검증
                          </button>
                          <button
                            onClick={() => handleSaveRelationship(item.table, item.field, item.similarity)}
                            className="px-3 py-1.5 bg-gray-800 text-white text-xs font-medium rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-1"
                          >
                            <Save size={12} /> 저장
                          </button>
                          <button
                            onClick={() => {
                              const sql = generateJoinSql(relTargetTable, relTargetField, item.table, item.field);
                              setGeneratedSql(sql);
                              setActiveMenu('generator');
                            }}
                            className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
                          >
                            <Code2 size={12} /> JOIN SQL
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!relSuggestions.length && !relError && !relVerificationResult && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-12 text-center">
              <Link size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-sm">좌측에서 대상 테이블과 필드를 선택한 후<br/><strong>"유사 필드 찾기"</strong>를 눌러주세요.</p>
              {savedRelationships.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">📋 저장된 관계로 생성 가능한 JOIN</h4>
                  <div className="text-left max-h-40 overflow-y-auto space-y-1">
                    {savedRelationships.map((r: any, i: number) => (
                      <div key={i} className="flex items-center justify-between px-2 py-1 hover:bg-gray-50 rounded text-xs">
                        <span className="font-mono text-gray-700 truncate">{r.source_table}.{r.source_field} ↔ {r.target_table}.{r.target_field}</span>
                        <button
                          onClick={() => {
                            const sql = generateJoinSql(r.source_table, r.source_field, r.target_table, r.target_field);
                            setGeneratedSql(sql);
                            setActiveMenu('generator');
                          }}
                          className="px-2 py-1 bg-gray-800 text-white text-[10px] font-medium rounded hover:bg-gray-700 transition-colors shrink-0 ml-2"
                        >
                          SQL
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderTableManager = () => {
    const allTables = Object.keys(schemaDict);

    const matchKeywords = (target: string, query: string, mode: 'or' | 'and'): boolean => {
      const keywords = query.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
      if (keywords.length === 0) return true;
      const t = target.toLowerCase();
      if (mode === 'and') return keywords.every(k => t.includes(k));
      return keywords.some(k => t.includes(k));
    };

    const matchTableByColumns = (table: string): boolean => {
      const keywords = fieldFilter.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
      if (keywords.length === 0) return true;
      const cols = (schemaDict[table] || []).map(c => c.toLowerCase());
      if (fieldFilterMode === 'and') return keywords.every(k => cols.some(c => c.includes(k)));
      return keywords.some(k => cols.some(c => c.includes(k)));
    };

    const notMatch = (target: string, query: string): boolean => {
      const keywords = query.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
      if (keywords.length === 0) return true;
      const t = target.toLowerCase();
      return !keywords.some(k => t.includes(k));
    };

    const notMatchByColumns = (table: string): boolean => {
      const keywords = fieldNotFilter.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
      if (keywords.length === 0) return true;
      const cols = (schemaDict[table] || []).map(c => c.toLowerCase());
      return !keywords.some(k => cols.some(c => c.includes(k)));
    };

    let filteredTables = tableFilter.trim()
      ? allTables.filter(t => matchKeywords(t, tableFilter, filterMode))
      : allTables;
    filteredTables = tableNotFilter.trim()
      ? filteredTables.filter(t => notMatch(t, tableNotFilter))
      : filteredTables;
    filteredTables = filteredTables.filter(matchTableByColumns);
    filteredTables = fieldNotFilter.trim()
      ? filteredTables.filter(notMatchByColumns)
      : filteredTables;
    const sortedTables = sortBySelection
      ? [...filteredTables].sort((a, b) => {
          const aSel = activeTables.includes(a) ? 0 : 1;
          const bSel = activeTables.includes(b) ? 0 : 1;
          return aSel - bSel;
        })
      : filteredTables;
    const allSelected = filteredTables.length > 0 && filteredTables.every(t => activeTables.includes(t));

    const toggleAll = () => {
      if (allSelected) {
        setActiveTables(prev => prev.filter(t => !filteredTables.includes(t)));
      } else {
        setActiveTables(prev => [...new Set([...prev, ...filteredTables])]);
      }
    };

    const toggleTable = (table: string) => {
      setActiveTables(prev =>
        prev.includes(table) ? prev.filter(t => t !== table) : [...prev, table]
      );
    };

    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">테이블 정리</h2>
          <p className="text-gray-500 mt-1">사용할 테이블을 선택하고 저장하세요. 선택되지 않은 테이블은 SQL 생성/데이터 미리보기에서 숨겨집니다.</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer shrink-0">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={allSelected}
                onChange={toggleAll}
              />
              <span className="text-sm font-medium text-gray-700">{allSelected ? '전체 해제' : '전체 선택'}</span>
            </label>
            <button
              onClick={() => setSortBySelection(v => !v)}
              className={`text-[11px] px-2 py-1 rounded font-medium border transition-colors shrink-0 ${
                sortBySelection
                  ? 'bg-blue-100 border-blue-300 text-blue-700'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              선택 정렬
            </button>
            <button
              onClick={() => setFilterMode(m => m === 'or' ? 'and' : 'or')}
              className={`text-[11px] px-2 py-1 rounded font-medium border transition-colors shrink-0 ${
                filterMode === 'or'
                  ? 'bg-amber-100 border-amber-300 text-amber-700'
                  : 'bg-sky-100 border-sky-300 text-sky-700'
              }`}
              title={filterMode === 'or' ? 'OR: 하나라도 일치' : 'AND: 모두 일치'}
            >
              {filterMode === 'or' ? 'OR' : 'AND'}
            </button>
            <input
              type="text"
              value={tableFilter}
              onChange={e => setTableFilter(e.target.value)}
              placeholder="테이블명 (콤마로 여러 개)"
              className="max-w-36 px-3 py-1.5 text-[13px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
            <input
              type="text"
              value={tableNotFilter}
              onChange={e => setTableNotFilter(e.target.value)}
              placeholder="제외할 테이블명"
              className="max-w-36 px-3 py-1.5 text-[13px] border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent bg-red-50/50 placeholder:text-red-300"
            />
            <span className="text-xs text-gray-500 shrink-0">선택 {activeTables.length}개{filteredTables.length < allTables.length ? ` / 표시 ${filteredTables.length}개` : ''}</span>
          </div>
          {/* Preset save/load */}
          <div className="px-4 pb-3 pt-1 bg-gray-50 flex items-center gap-2 border-b border-gray-200 flex-wrap">
            <input
              type="text"
              value={presetName}
              onChange={e => setPresetName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveTablePreset()}
              placeholder="프리셋 이름..."
              className="w-40 px-2 py-1 text-[12px] border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              onClick={saveTablePreset}
              disabled={!presetName.trim()}
              className="text-[11px] px-2 py-1 rounded font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              저장
            </button>
            <select
              value={presetLoadId}
              onChange={e => {
                const val = e.target.value;
                if (val === 'reset') {
                  setActiveTables([]);
                  setPresetLoadId('');
                  setPresetMsg('초기화됨');
                  setTimeout(() => setPresetMsg(''), 3000);
                } else {
                  setPresetLoadId(parseInt(val, 10) || '');
                }
              }}
              className="text-[12px] px-2 py-1 border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">프리셋 불러오기</option>
              <option value="reset">🔄 초기화</option>
              {tablePresets.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {presetLoadId && (
              <>
                <button
                  onClick={() => { loadTablePreset(presetLoadId as number); setPresetLoadId(''); }}
                  className="text-[11px] px-2 py-1 rounded font-medium bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                >
                  불러오기
                </button>
                <button
                  onClick={() => deleteTablePreset(presetLoadId as number)}
                  className="text-[11px] px-2 py-1 rounded font-medium bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                >
                  삭제
                </button>
              </>
            )}
            {presetMsg && (
              <span className="text-[11px] text-gray-600 ml-1">{presetMsg}</span>
            )}
            <span className="text-gray-300 mx-1">│</span>
            <button
              onClick={() => setFieldFilterMode(m => m === 'or' ? 'and' : 'or')}
              className={`text-[10px] px-1.5 py-1 rounded font-medium border transition-colors shrink-0 ${
                fieldFilterMode === 'or'
                  ? 'bg-amber-100 border-amber-300 text-amber-700'
                  : 'bg-sky-100 border-sky-300 text-sky-700'
              }`}
              title={fieldFilterMode === 'or' ? 'OR: 하나라도 일치' : 'AND: 모두 일치'}
            >
              {fieldFilterMode === 'or' ? 'OR' : 'AND'}
            </button>
            <input
              type="text"
              value={fieldFilter}
              onChange={e => setFieldFilter(e.target.value)}
              placeholder="컬럼명 (콤마로 여러 개)"
              className="w-32 px-2 py-1 text-[12px] border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <input
              type="text"
              value={fieldNotFilter}
              onChange={e => setFieldNotFilter(e.target.value)}
              placeholder="제외할 컬럼명"
              className="w-28 px-2 py-1 text-[12px] border border-red-200 rounded focus:outline-none focus:ring-2 focus:ring-red-400 bg-red-50/50 placeholder:text-red-300"
            />
            {fieldFilter && (
              <span className="text-[11px] text-amber-600 shrink-0 whitespace-nowrap">{filteredTables.length}개 일치</span>
            )}
          </div>

          <div className="max-h-[600px] overflow-y-auto">
            <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 border-b border-gray-200 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              <div className="w-16 shrink-0 text-center">사용여부</div>
              <div className="w-[280px] shrink-0">테이블명</div>
              <div className="flex-1 text-center flex items-center justify-center gap-2">
                첫줄 데이터
                {Object.keys(tmSampleData).length > 0 && (
                  <button onClick={handleCloseAllPreviews} className="text-[10px] text-red-400 hover:text-red-600 transition-colors font-normal border border-red-200 px-1.5 py-0.5 rounded">
                    전체닫기
                  </button>
                )}
              </div>
            </div>
            <div className="divide-y divide-gray-100">
            {sortedTables.map(table => {
              const isActive = activeTables.includes(table);
              const sampleData = tmSampleData[table];
              const loadingSample = tmLoadingSamples[table];
              const selCol = selectedDateColumns[table] || '';

              return (
                <div key={table} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                  <div className="w-16 shrink-0 flex items-center justify-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={isActive}
                      onChange={() => toggleTable(table)}
                    />
                  </div>
                  <div className="w-[280px] shrink-0 truncate">
                    <span className="text-sm font-medium text-gray-800 truncate" title={table}>{table}</span>
                    <span className="text-[10px] text-gray-400 ml-1">({(schemaDict[table] || []).length})</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    {tmSampleErrors[table] ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-red-500">오류: {tmSampleErrors[table]}</span>
                        <button
                          onClick={() => setTmSampleErrors(prev => { const n = { ...prev }; delete n[table]; return n; })}
                          className="text-[10px] text-red-400 hover:text-red-600"
                        >
                          ✕
                        </button>
                        <button
                          onClick={() => fetchTmSampleData(table)}
                          className="text-[11px] text-blue-600 hover:text-blue-800 font-medium"
                        >
                          재시도
                        </button>
                      </div>
                    ) : loadingSample ? (
                      <span className="text-[11px] text-gray-400">불러오는 중...</span>
                    ) : sampleData ? (
                      <div className="flex items-center gap-2">
                        <div className="flex flex-wrap gap-1 flex-1">
                          {Object.keys(sampleData).map(field => {
                            const val = sampleData[field];
                            const isSelected = selCol === field;
                            const valStr = val == null ? '' : String(val);
                            return (
                              <button
                                key={field}
                                onClick={() => {
                                  const nextSel = selCol === field ? '' : field;
                                  setSelectedDateColumns(prev => {
                                    const next = { ...prev };
                                    if (next[table] === field) delete next[table];
                                    else next[table] = field;
                                    return next;
                                  });
                                  fetchTmSampleData(table, nextSel || undefined);
                                }}
                                className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                                  isSelected
                                    ? 'bg-blue-100 border-blue-300 text-blue-700 font-medium'
                                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                }`}
                                title={field}
                              >
                                {field}: {valStr.length > 20 ? valStr.slice(0, 20) + '…' : valStr || '(null)'}
                              </button>
                            );
                          })}
                        </div>
                        <button
                          onClick={() => setTmSampleData(prev => { const n = { ...prev }; delete n[table]; return n; })}
                          className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                          title="접기"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); fetchTmSampleData(table); }}
                        disabled={tmLoadingSamples[table]}
                        className="text-[11px] text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                      >
                        {loadingSample ? <Loader2 size={12} className="animate-spin" /> : null}
                        첫줄 불러오기
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={handleSaveToServer}
          disabled={isSaving}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {isSaving ? '저장 중...' : '설정 저장'}
        </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex flex-col md:flex-row">
      
      {/* Left Sidebar Navigation */}
      <aside className={`${sidebarCollapsed ? 'md:w-16' : 'md:w-64'} w-full bg-gray-900 text-gray-300 flex flex-col h-screen sticky top-0 shadow-xl z-20 transition-all duration-200 overflow-y-auto`}>
        <div className="p-4 border-b border-gray-800 bg-gray-950 flex items-center justify-between">
          {!sidebarCollapsed && (
            <div>
              <h1 className="text-xl font-bold flex items-center gap-3 text-white">
                <span className="text-2xl">📊</span> DB 분석기
              </h1>
              <p className="text-xs text-gray-500 mt-1">Database Analyzer</p>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors ${sidebarCollapsed ? 'mx-auto' : ''}`}
            title={sidebarCollapsed ? '메뉴 펼치기' : '메뉴 접기'}
          >
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
        
        <nav className="flex-1 py-2 space-y-0.5">
          <button 
            onClick={() => setActiveMenu('settings')} 
            className={`w-full flex items-center gap-3 ${sidebarCollapsed ? 'justify-center px-2 py-3' : 'px-6 py-3.5'} text-sm font-medium transition-colors ${activeMenu === 'settings' ? 'bg-blue-600 text-white border-l-4 border-blue-400' : 'hover:bg-gray-800 hover:text-white border-l-4 border-transparent'}`}
            title={sidebarCollapsed ? '환경 설정' : undefined}
          >
            <Settings size={18} className="shrink-0" />
            {!sidebarCollapsed && <span>환경 설정</span>}
          </button>
          <button 
            onClick={() => setActiveMenu('tables')} 
            className={`w-full flex items-center gap-3 ${sidebarCollapsed ? 'justify-center px-2 py-3' : 'px-6 py-3.5'} text-sm font-medium transition-colors ${activeMenu === 'tables' ? 'bg-blue-600 text-white border-l-4 border-blue-400' : 'hover:bg-gray-800 hover:text-white border-l-4 border-transparent'}`}
            title={sidebarCollapsed ? '테이블 정리' : undefined}
          >
            <CheckSquare size={18} className="shrink-0" />
            {!sidebarCollapsed && <span>테이블 정리</span>}
          </button>
          <button 
            onClick={() => setActiveMenu('generator')} 
            className={`w-full flex items-center gap-3 ${sidebarCollapsed ? 'justify-center px-2 py-3' : 'px-6 py-3.5'} text-sm font-medium transition-colors ${activeMenu === 'generator' ? 'bg-blue-600 text-white border-l-4 border-blue-400' : 'hover:bg-gray-800 hover:text-white border-l-4 border-transparent'}`}
            title={sidebarCollapsed ? 'SQL 생성' : undefined}
          >
            <MessageSquare size={18} className="shrink-0" />
            {!sidebarCollapsed && <span>SQL 생성</span>}
          </button>
          <button 
            onClick={() => setActiveMenu('preview')} 
            className={`w-full flex items-center gap-3 ${sidebarCollapsed ? 'justify-center px-2 py-3' : 'px-6 py-3.5'} text-sm font-medium transition-colors ${activeMenu === 'preview' ? 'bg-blue-600 text-white border-l-4 border-blue-400' : 'hover:bg-gray-800 hover:text-white border-l-4 border-transparent'}`}
            title={sidebarCollapsed ? '데이터 미리보기' : undefined}
          >
            <Search size={18} className="shrink-0" />
            {!sidebarCollapsed && <span>데이터 미리보기</span>}
          </button>
          <button 
            onClick={() => setActiveMenu('relationships')} 
            className={`w-full flex items-center gap-3 ${sidebarCollapsed ? 'justify-center px-2 py-3' : 'px-6 py-3.5'} text-sm font-medium transition-colors ${activeMenu === 'relationships' ? 'bg-blue-600 text-white border-l-4 border-blue-400' : 'hover:bg-gray-800 hover:text-white border-l-4 border-transparent'}`}
            title={sidebarCollapsed ? '관계 분석' : undefined}
          >
            <Link size={18} className="shrink-0" />
            {!sidebarCollapsed && <span>관계 분석</span>}
          </button>
          <button 
            onClick={() => setActiveMenu('query')} 
            className={`w-full flex items-center gap-3 ${sidebarCollapsed ? 'justify-center px-2 py-3' : 'px-6 py-3.5'} text-sm font-medium transition-colors ${activeMenu === 'query' ? 'bg-blue-600 text-white border-l-4 border-blue-400' : 'hover:bg-gray-800 hover:text-white border-l-4 border-transparent'}`}
            title={sidebarCollapsed ? '데이터 조회' : undefined}
          >
            <Table size={18} className="shrink-0" />
            {!sidebarCollapsed && <span>데이터 조회</span>}
          </button>
        </nav>
        
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-gray-800 flex flex-col gap-2">
            <button
              onClick={handleSaveToServer}
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg text-sm font-medium transition-colors border border-gray-700 disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : (saveMessage === '저장 완료' ? <Check size={16} className="text-green-400" /> : <Save size={16} />)} 
              {saveMessage || '서버에 설정 저장'}
            </button>
            <div className="text-xs text-gray-500 text-center">
              PostgreSQL Schema Analyzer
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-gray-50/50">
        <div className="p-6 md:p-10 w-full">
          {activeMenu === 'settings' && renderSettings()}
          {activeMenu === 'generator' && renderGenerator()}
          {activeMenu === 'preview' && renderPreview()}
          {activeMenu === 'query' && renderQuery()}
          {activeMenu === 'relationships' && renderRelationships()}
          {activeMenu === 'tables' && renderTableManager()}
        </div>
      </main>
    </div>
  );
}
