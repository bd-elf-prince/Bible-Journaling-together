// ==================================================
// 스크립트 이름: CommentBible 운영 preflight 단위 테스트
// 버전: 1.0.0
// 작성일: 2026-09-05
// 변경사항: 설정 추출·공개 출력·민감정보 마스킹 검증
// 용도: 운영 preflight가 비밀값을 출력하거나 mutation으로 오인하지 않도록 회귀 방지
// 사용자 입력 필요: 없음
// ==================================================

import test from 'node:test';
import assert from 'node:assert/strict';
import { extractProductionConfig, publicResult, safeError } from '../tools/commentbible-production-preflight-lib.mjs';

test('배포 자산에서 공개 연결 정보만 추출한다', () => {
  const config = extractProductionConfig(`
    const SUPABASE_URL = 'https://abcdefghijklmnopqrst.supabase.co';
    const SUPABASE_KEY = 'publishable-test-value';
    const WRITE_GATEWAY_FUNCTION = 'write-gateway-v4';
  `);
  assert.deepEqual(config, {
    url: 'https://abcdefghijklmnopqrst.supabase.co',
    key: 'publishable-test-value',
    gateway: 'write-gateway-v4',
    projectRef: 'abcdefghijklmnopqrst',
  });
});

test('공개 결과에는 key가 없고 mutationCount는 항상 0이다', () => {
  const result = publicResult({
    siteStatus: 200,
    runtime: { mode: 'normal', writes: true },
    projectRef: 'abcdefghijklmnopqrst',
    gateway: 'write-gateway-v4',
    apiStatus: 502,
    gatewayStatus: 502,
    counts: {},
  });
  assert.equal(result.mutationCount, 0);
  assert.equal(result.supabase.reachable, false);
  assert.equal(JSON.stringify(result).includes('publishable-test-value'), false);
});

test('오류 문자열의 JWT 모양 값은 마스킹한다', () => {
  const jwtLike = ['eyJ', 'abcdefghijklmnopqrstuvwxyz', 'abcdefghijklmnopqrstuvwxyz', 'abcdefghijklmnopqrstuvwxyz'].join('.');
  const error = safeError(new Error(`failed ${jwtLike}`));
  assert.equal(error.message.includes(jwtLike), false);
  assert.match(error.message, /\[REDACTED\]/);
});

// ==================================================
// 스크립트 끝
// 스크립트 이름: CommentBible 운영 preflight 단위 테스트
// 버전: 1.0.0
// ==================================================
