// 스크립트 이름: CommentBible optimistic 상태 도우미
// 버전: 1.0.0
// 작성일: 2026-08-14
// 변경사항: commit·rollback 상태 계약 추가
// 용도: optimistic UI 장애 복구 검증
// 사용자 입력 필요: 없음
export class OptimisticState {
  constructor(rows = []) { this.rows = structuredClone(rows); this.pending = new Map(); }
  begin({ id, row }) { const snapshot = structuredClone(this.rows); this.rows.unshift({ ...structuredClone(row), id, pending: true }); this.pending.set(id, snapshot); return id; }
  commit(id, serverRow) { this.rows = this.rows.map(row => row.id === id ? { ...structuredClone(serverRow), pending: false } : row); this.pending.delete(id); }
  rollback(id) { const snapshot = this.pending.get(id); if (snapshot) this.rows = snapshot; this.pending.delete(id); }
}
// 스크립트 끝 — CommentBible optimistic 상태 도우미 1.0.0
