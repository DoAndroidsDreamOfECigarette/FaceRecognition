import React, { useEffect, useState } from 'react';

interface RecognitionLogsProps {
  onBack: () => void;
}

interface LogEntry {
  id: number;
  name: string;
  similarity: number;
  timestamp: string;
  status: string;
}

const PAGE_SIZE = 10;

const RecognitionLogs: React.FC<RecognitionLogsProps> = ({ onBack }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchLogs = async (pageNum: number) => {
    setLoading(true);
    try {
      const offset = (pageNum - 1) * PAGE_SIZE;
      const res = await fetch(`http://127.0.0.1:5000/recognize_logs?limit=${PAGE_SIZE}&offset=${offset}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('获取识别记录失败', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(page);
  }, [page]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const getStatusLabel = (status: string) => {
    const map: Record<string, { label: string; color: string }> = {
      success: { label: '成功', color: '#22c55e' },
      unknown: { label: '未知', color: '#f59e0b' },
      empty: { label: '空库', color: '#94a3b8' },
      error: { label: '错误', color: '#ef4444' }
    };
    return map[status] || { label: status, color: '#94a3b8' };
  };

  return (
    <div style={{
      padding: '40px',
      maxWidth: '800px',
      margin: '0 auto',
      height: '100vh',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
        <button
          onClick={onBack}
          style={{
            padding: '6px 14px',
            backgroundColor: 'var(--ev-c-gray-3)',
            color: 'var(--ev-c-text-1)',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            marginRight: '16px'
          }}
        >
          ← 返回
        </button>
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--ev-c-text-1)' }}>识别记录</h2>
      </div>

      {loading ? (
        <div style={{ color: 'var(--ev-c-text-2)', textAlign: 'center', marginTop: '40px' }}>加载中...</div>
      ) : logs.length === 0 ? (
        <div style={{ color: 'var(--ev-c-text-2)', textAlign: 'center', marginTop: '40px' }}>暂无识别记录</div>
      ) : (
        <>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {logs.map(log => {
              const statusInfo = getStatusLabel(log.status);
              return (
                <div
                  key={log.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--ev-c-black-soft)',
                    border: '1px solid var(--ev-c-gray-3)',
                    marginBottom: '8px'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '15px', color: 'var(--ev-c-text-1)', marginBottom: '4px' }}>
                      {log.name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--ev-c-text-2)' }}>
                      {log.timestamp}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: '14px',
                      color: log.similarity >= 0.7 ? '#22c55e' : log.similarity >= 0.5 ? '#f59e0b' : '#ef4444',
                      marginBottom: '4px'
                    }}>
                      {log.similarity.toFixed(4)}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: statusInfo.color,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: `${statusInfo.color}20`
                    }}>
                      {statusInfo.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px',
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: '1px solid var(--ev-c-gray-3)'
            }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: '6px 12px',
                  backgroundColor: page === 1 ? 'var(--ev-c-gray-3)' : 'var(--ev-c-black-soft)',
                  color: page === 1 ? 'var(--ev-c-text-2)' : 'var(--ev-c-text-1)',
                  border: '1px solid var(--ev-c-gray-3)',
                  borderRadius: '6px',
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                上一页
              </button>
              <span style={{ fontSize: '14px', color: 'var(--ev-c-text-2)' }}>
                第 {page} / {totalPages} 页
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  padding: '6px 12px',
                  backgroundColor: page === totalPages ? 'var(--ev-c-gray-3)' : 'var(--ev-c-black-soft)',
                  color: page === totalPages ? 'var(--ev-c-text-2)' : 'var(--ev-c-text-1)',
                  border: '1px solid var(--ev-c-gray-3)',
                  borderRadius: '6px',
                  cursor: page === totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RecognitionLogs;