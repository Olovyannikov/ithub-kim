#!/usr/bin/env node
/**
 * Строит ER-диаграмму по **живой базе данных**.
 *
 * КИМ, Задание 1: «Не забудьте создать ER-диаграмму в СУБД, а затем сохранить
 * ее в своей рабочей папке проекта в любом формате». Ключевое слово —
 * «в СУБД»: диаграмма должна отражать то, что реально лежит в базе, а не то,
 * что нарисовали руками и забыли обновить.
 *
 * Скрипт читает структуру из `information_schema` через `psql`, собирает
 * описание для graphviz и рендерит в SVG и PNG.
 *
 *   pnpm erd
 *
 * На экзамене это удобство, а не обязательный путь: graphviz на площадке может
 * не оказаться. Способ «мышкой в DBeaver» описан в docs/er/README.md и
 * работает всегда.
 */
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'docs', 'er');
const SEP = '~#~';

const DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://kim:kim@localhost:5432/conferences';

/** Цвета из руководства по стилю заказчика — диаграмма тоже часть работы. */
const COLORS = {
  header: '#0d47a1',
  headerText: '#ffffff',
  row: '#ffffff',
  rowAlt: '#f8f9fa',
  border: '#6c757d',
  dim: '#6c757d',
  edge: '#007bff',
};

function psql(sql) {
  const output = execFileSync('psql', [DATABASE_URL, '-X', '-A', '-t', '-F', SEP, '-c', sql], {
    encoding: 'utf8',
    env: { ...process.env, PGCLIENTENCODING: 'UTF8' },
  });

  return output
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line) => line.split(SEP));
}

function escapeHtml(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function main() {
  // Таблицы и столбцы, кроме служебной таблицы миграций.
  const columns = psql(`
    SELECT c.table_name, c.column_name, c.data_type, c.is_nullable,
           COALESCE(c.character_maximum_length::text, '')
    FROM information_schema.columns c
    JOIN information_schema.tables t
      ON t.table_name = c.table_name AND t.table_schema = c.table_schema
    WHERE c.table_schema = 'public' AND t.table_type = 'BASE TABLE'
      AND c.table_name <> 'migrations'
    ORDER BY c.table_name, c.ordinal_position
  `);

  if (columns.length === 0) {
    throw new Error(`В базе нет таблиц. Проверьте DATABASE_URL и миграции: ${DATABASE_URL}`);
  }

  const keys = psql(`
    SELECT tc.table_name, kcu.column_name, tc.constraint_type
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON kcu.constraint_name = tc.constraint_name AND kcu.table_schema = tc.table_schema
    WHERE tc.table_schema = 'public'
      AND tc.constraint_type IN ('PRIMARY KEY', 'FOREIGN KEY', 'UNIQUE')
  `);

  const relations = psql(`
    SELECT tc.table_name, kcu.column_name, ccu.table_name, ccu.column_name, rc.delete_rule
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON kcu.constraint_name = tc.constraint_name
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
    JOIN information_schema.referential_constraints rc
      ON rc.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
  `);

  const keyMap = new Map();

  for (const [table, column, type] of keys) {
    const mark = { 'PRIMARY KEY': 'PK', 'FOREIGN KEY': 'FK', UNIQUE: 'UQ' }[type];
    const key = `${table}.${column}`;
    const current = keyMap.get(key) ?? new Set();
    current.add(mark);
    keyMap.set(key, current);
  }

  const tables = new Map();

  for (const [table, column, type, nullable, length] of columns) {
    const rows = tables.get(table) ?? [];
    const shortType = type
      .replace('character varying', 'varchar')
      .replace('timestamp with time zone', 'timestamptz')
      .replace('integer', 'int');

    rows.push({
      column,
      type: length ? `${shortType}(${length})` : shortType,
      nullable: nullable === 'YES',
      marks: [...(keyMap.get(`${table}.${column}`) ?? [])].sort().join(' '),
    });
    tables.set(table, rows);
  }

  const lines = [
    'digraph ERD {',
    '  graph [rankdir=LR, splines=polyline, nodesep=0.8, ranksep=2.2, bgcolor="white"];',
    '  node [shape=plaintext, fontname="PT Sans,Helvetica", fontsize=11];',
    `  edge [color="${COLORS.edge}", penwidth=1.4, fontname="PT Sans,Helvetica", fontsize=9];`,
    '',
  ];

  for (const [table, rows] of tables) {
    const body = rows
      .map((row, index) => {
        const background = index % 2 === 0 ? COLORS.row : COLORS.rowAlt;
        const name = row.marks ? `<B>${escapeHtml(row.column)}</B>` : escapeHtml(row.column);
        const nullable = row.nullable ? '' : ` <FONT COLOR="${COLORS.dim}">NOT NULL</FONT>`;
        // Пустой <FONT></FONT> graphviz считает синтаксической ошибкой, поэтому
        // у столбцов без ключей ячейка остаётся пустой.
        const marks = row.marks ? `<FONT COLOR="${COLORS.header}">${row.marks}</FONT>` : ' ';

        return (
          `      <TR><TD BGCOLOR="${background}" ALIGN="LEFT" PORT="${escapeHtml(row.column)}">${name}</TD>` +
          `<TD BGCOLOR="${background}" ALIGN="LEFT"><FONT COLOR="${COLORS.dim}">${escapeHtml(row.type)}</FONT>${nullable}</TD>` +
          `<TD BGCOLOR="${background}" ALIGN="LEFT">${marks}</TD></TR>`
        );
      })
      .join('\n');

    lines.push(
      `  "${table}" [label=<`,
      `    <TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0" CELLPADDING="5" COLOR="${COLORS.border}">`,
      `      <TR><TD BGCOLOR="${COLORS.header}" COLSPAN="3"><FONT COLOR="${COLORS.headerText}"><B>${escapeHtml(table)}</B></FONT></TD></TR>`,
      body,
      '    </TABLE>>];',
      '',
    );
  }

  for (const [table, column, target, targetColumn, deleteRule] of relations) {
    lines.push(
      `  "${table}":"${column}" -> "${target}":"${targetColumn}" [xlabel="ON DELETE ${deleteRule}", dir=back, arrowtail=crow, arrowhead=none];`,
    );
  }

  lines.push('}');

  await mkdir(OUT_DIR, { recursive: true });

  const dotPath = join(OUT_DIR, 'schema.dot');
  await writeFile(dotPath, `${lines.join('\n')}\n`, 'utf8');

  for (const format of ['svg', 'png']) {
    execFileSync('dot', [`-T${format}`, dotPath, '-o', join(OUT_DIR, `schema.${format}`)]);
    console.log(`  docs/er/schema.${format}`);
  }

  console.log(`\nтаблиц: ${tables.size}, связей: ${relations.length} — построено по живой базе`);
}

await main();
