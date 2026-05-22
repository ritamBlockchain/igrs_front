'use client';

import { useEffect, useState } from "react";
import { ExternalLink, Layers, Shield, Database, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { useData } from "@/context/DataContext";

export default function AnchorsPage() {
  const { batches, batchesLoading, refreshBatches, latestAnchor, stats } = useData();
  const [page, setPage] = useState(1);
  const limit = 10;

  // Fetch batches on mount
  useEffect(() => {
    refreshBatches(page, limit, 'anchored');
  }, [refreshBatches, page]);

  const anchoredTotal = stats?.anchored_batches || 0;

  return (
    <div className="animate-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><h1>⛓️ Blockchain Anchors</h1><p>L2 public verification via Polygon Amoy Testnet</p></div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button 
            onClick={() => refreshBatches(page, limit, 'anchored')} 
            disabled={batchesLoading}
            className="btn btn-outline"
            style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={14} style={{ animation: batchesLoading ? 'spin 1s linear infinite' : undefined }} />
            Refresh
          </button>
          <span className="badge badge-info" style={{ fontSize: 12, padding: '6px 14px' }}>● Polygon Amoy</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { icon: <Layers size={20} />, label: 'Total Batches', val: stats?.total_batches || 0 },
          { icon: <Shield size={20} />, label: 'Anchored', val: stats?.anchored_batches || 0 },
          { icon: <Database size={20} />, label: 'Anchored Records', val: batches.reduce((sum, b) => sum + (b.records_count || 0), 0) },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--blue-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue-600)' }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--slate-400)', textTransform: 'uppercase' }}>{s.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--slate-800)' }}>{batchesLoading ? '-' : s.val}</div>
            </div>
          </div>
        ))}
      </div>

      {latestAnchor && (
        <div className="card" style={{ padding: 20, marginBottom: 24, background: 'var(--success-bg)', border: '1px solid var(--success)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--success)', marginBottom: 4 }}>✓ Latest Anchor</div>
              <div style={{ fontSize: 12, color: 'var(--slate-600)' }}>
                Anchored at: {new Date(latestAnchor.anchored_at).toLocaleString()}
              </div>
              <div className="mono" style={{ fontSize: 11, marginTop: 4, color: 'var(--slate-500)' }}>
                Tx: {latestAnchor.tx_hash}
              </div>
            </div>
            <a 
              href={latestAnchor.explorer_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-primary"
              style={{ fontSize: 12 }}
            >
              View on Polygonscan <ExternalLink size={12} />
            </a>
          </div>
        </div>
      )}

      {/* Results count */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 13, color: 'var(--slate-500)' }}>
          {batchesLoading ? 'Loading...' : `Showing ${anchoredTotal > 0 ? (page - 1) * limit + 1 : 0} to ${Math.min(page * limit, anchoredTotal)} of ${anchoredTotal} anchored batches`}
        </div>
      </div>

      {batchesLoading ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ color: 'var(--slate-500)' }}>Loading batches from Fabric...</div>
        </div>
      ) : batches.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ color: 'var(--slate-500)' }}>No anchored batches found</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {batches.map((b, i) => (
            <div key={b.batch_id} className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--blue-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue-600)', fontWeight: 700, fontSize: 13 }}>{(page - 1) * limit + i + 1}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>Batch {b.batch_id}</div>
                  <div style={{ fontSize: 11, color: 'var(--success)', fontWeight: 600 }}>{b.status?.toUpperCase() || 'ANCHORED'}</div>
                </div>
              </div>
              {b.tx_hash && (
                <a 
                  href={`https://amoy.polygonscan.com/tx/${b.tx_hash}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-outline" 
                  style={{ fontSize: 12 }}
                >
                  Polygonscan <ExternalLink size={12} />
                </a>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: 16, background: 'var(--slate-50)', borderRadius: 10 }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--slate-400)', textTransform: 'uppercase', marginBottom: 4 }}>Merkle Root</div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--slate-600)', wordBreak: 'break-all' }}>{b.merkle_root}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--slate-400)', textTransform: 'uppercase', marginBottom: 4 }}>Records</div>
                <div style={{ fontSize: 11, color: 'var(--slate-600)' }}>{b.records_count} records</div>
                {b.tx_hash && (
                  <div className="mono" style={{ fontSize: 10, color: 'var(--slate-500)', marginTop: 4, wordBreak: 'break-all' }}>
                    Tx: {b.tx_hash.substring(0, 30)}...
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        </div>
      )}

      {/* Pagination Controls */}
      {anchoredTotal > limit && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
          <div style={{ fontSize: 13, color: 'var(--slate-500)' }}>
            Page {page} of {Math.max(1, Math.ceil(anchoredTotal / limit))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-outline"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || batchesLoading}
              style={{ padding: '6px 12px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <button
              className="btn btn-outline"
              onClick={() => setPage(p => Math.min(Math.ceil(anchoredTotal / limit), p + 1))}
              disabled={page >= Math.ceil(anchoredTotal / limit) || batchesLoading}
              style={{ padding: '6px 12px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
