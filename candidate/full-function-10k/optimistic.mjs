export class OptimisticState {
  constructor(rows = []) { this.rows = structuredClone(rows); this.pending = new Map(); }
  begin({ id, row }) { const snapshot = structuredClone(this.rows); this.rows.unshift({ ...structuredClone(row), id, pending: true }); this.pending.set(id, snapshot); return id; }
  commit(id, serverRow) { this.rows = this.rows.map(row => row.id === id ? { ...structuredClone(serverRow), pending: false } : row); this.pending.delete(id); }
  rollback(id) { const snapshot = this.pending.get(id); if (snapshot) this.rows = snapshot; this.pending.delete(id); }
}
