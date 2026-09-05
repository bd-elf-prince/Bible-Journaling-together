// ==================================================
// 스크립트 이름: CommentBible 운영 읽기 전용 preflight 라이브러리
// 버전: 1.0.0
// 작성일: 2026-09-05
// 변경사항: 운영 정적 자산·runtime·Supabase 상태 판정과 민감정보 비노출 출력
// 용도: 운영 변경 전에 대상과 장애 경계를 읽기 전용으로 확인
// 사용자 입력 필요: 없음
// ==================================================

const TIMEOUT_MS = 15_000;

export function extractProductionConfig(source) {
  const url = source.match(/const\s+SUPABASE_URL\s*=\s*['"]([^'"]+)['"]/)?.[1] || '';
  const key = source.match(/const\s+SUPABASE_KEY\s*=\s*['"]([^'"]+)['"]/)?.[1] || '';
  const gateway = source.match(/const\s+WRITE_GATEWAY_FUNCTION\s*=\s*['"]([^'"]+)['"]/)?.[1] || '';
  if (!/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(url) || !key || !gateway) {
    throw new Error('production_config_not_found');
  }
  return { url, key, gateway, projectRef: new URL(url).hostname.split('.')[0] };
}

export async function timedFetch(fetchImpl, url, init = {}, timeoutMs = TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchImpl(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export function publicResult({ siteStatus, runtime, projectRef, gateway, apiStatus, gatewayStatus, counts }) {
  return {
    checkedAt: new Date().toISOString(),
    mutationCount: 0,
    site: { status: siteStatus },
    runtime,
    supabase: {
      projectRef,
      apiStatus,
      gateway,
      gatewayStatus,
      reachable: apiStatus > 0 && apiStatus < 500,
    },
    counts,
  };
}

export function safeError(error) {
  const name = error instanceof Error ? error.name : 'Error';
  const message = error instanceof Error ? error.message : String(error);
  return { name, message: message.replace(/eyJ[A-Za-z0-9._-]{20,}/g, '[REDACTED]') };
}

// ==================================================
// 스크립트 끝
// 스크립트 이름: CommentBible 운영 읽기 전용 preflight 라이브러리
// 버전: 1.0.0
// ==================================================
