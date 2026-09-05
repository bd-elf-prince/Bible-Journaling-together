#!/usr/bin/env node
// ==================================================
// 스크립트 이름: CommentBible 운영 읽기 전용 preflight
// 버전: 1.0.0
// 작성일: 2026-09-05
// 변경사항: commentbible.com·runtime·Supabase API·무효 action gateway·공개 행수 확인
// 용도: 운영 변경 전 장애 재현과 롤백 기준 수집
// 사용자 입력 필요: 없음
// ==================================================

import {
  extractProductionConfig,
  publicResult,
  safeError,
  timedFetch,
} from './commentbible-production-preflight-lib.mjs';

const ORIGIN = 'https://commentbible.com';
const TABLES = ['board_posts_public', 'discussion_comments_public', 'comments'];

async function status(url, init) {
  try {
    const response = await timedFetch(fetch, url, init);
    return response.status;
  } catch {
    return 0;
  }
}

async function countRows(baseUrl, key, table) {
  try {
    const response = await timedFetch(fetch, `${baseUrl}/rest/v1/${table}?select=id&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: 'count=exact' },
    });
    const range = response.headers.get('content-range') || '';
    const total = range.match(/\/(\d+|\*)$/)?.[1] || null;
    return { status: response.status, count: total === '*' || total === null ? null : Number(total) };
  } catch {
    return { status: 0, count: null };
  }
}

try {
  const [siteResponse, runtimeResponse, readerResponse] = await Promise.all([
    timedFetch(fetch, `${ORIGIN}/`),
    timedFetch(fetch, `${ORIGIN}/data/runtime-config.json`),
    timedFetch(fetch, `${ORIGIN}/reader-app.js`),
  ]);
  const [runtime, readerSource] = await Promise.all([runtimeResponse.json(), readerResponse.text()]);
  const config = extractProductionConfig(readerSource);
  const headers = { apikey: config.key, Authorization: `Bearer ${config.key}` };
  const apiStatus = await status(`${config.url}/rest/v1/`, { headers });

  // 등록되지 않은 action은 DB 쓰기 전에 400이어야 한다. 콘텐츠 mutation은 발생하지 않는다.
  const gatewayStatus = await status(`${config.url}/functions/v1/${config.gateway}`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json', Origin: ORIGIN },
    body: JSON.stringify({
      action: '__read_only_preflight__',
      payload: {},
      idempotency_key: 'commentbible_preflight_no_write_0001',
    }),
  });
  const counts = Object.fromEntries(await Promise.all(TABLES.map(async table => [
    table,
    await countRows(config.url, config.key, table),
  ])));

  console.log(JSON.stringify(publicResult({
    siteStatus: siteResponse.status,
    runtime,
    projectRef: config.projectRef,
    gateway: config.gateway,
    apiStatus,
    gatewayStatus,
    counts,
  }), null, 2));
} catch (error) {
  console.error(JSON.stringify({ checkedAt: new Date().toISOString(), mutationCount: 0, error: safeError(error) }, null, 2));
  process.exitCode = 1;
}

// ==================================================
// 스크립트 끝
// 스크립트 이름: CommentBible 운영 읽기 전용 preflight
// 버전: 1.0.0
// ==================================================
