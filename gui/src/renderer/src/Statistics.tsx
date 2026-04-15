import React, { useEffect, useState } from 'react';

interface StatisticsProps {
  onBack: () => void;
}

interface Stats {
  total_recognitions: number;
  total_identified: number;
  top_persons: { name: string; count: number }[];
  today_count: number;
}

const Statistics: React.FC<StatisticsProps> = ({ onBack }) => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('http://127.0.0.1:5000/statistics');
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error('获取统计数据失败', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const maxCount = stats?.top_persons && stats.top_persons.length > 0
    ? Math.max(...stats.top_persons.map(p => p.count))
    : 0;

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
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--ev-c-text-1)' }}>数据统计</h2>
      </div>

      {loading ? (
        <div style={{ color: 'var(--ev-c-text-2)', textAlign: 'center', marginTop: '40px' }}>加载中...</div>
      ) : !stats ? (
        <div style={{ color: 'var(--ev-c-text-2)', textAlign: 'center', marginTop: '40px' }}>加载失败</div>
      ) : (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
            marginBottom: '32px'
          }}>
            <div style={{
              padding: '20px',
              borderRadius: '12px',
              backgroundColor: 'var(--ev-c-black-soft)',
              border: '1px solid var(--ev-c-gray-3)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '32px', fontWeight: 700, color: '#6988e6', marginBottom: '8px' }}>
                {stats.total_recognitions}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--ev-c-text-2)' }}>总识别次数</div>
            </div>
            <div style={{
              padding: '20px',
              borderRadius: '12px',
              backgroundColor: 'var(--ev-c-black-soft)',
              border: '1px solid var(--ev-c-gray-3)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '32px', fontWeight: 700, color: '#a78bfa', marginBottom: '8px' }}>
                {stats.today_count}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--ev-c-text-2)' }}>今日识别</div>
            </div>
            <div style={{
              padding: '20px',
              borderRadius: '12px',
              backgroundColor: 'var(--ev-c-black-soft)',
              border: '1px solid var(--ev-c-gray-3)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '32px', fontWeight: 700, color: '#22c55e', marginBottom: '8px' }}>
                {stats.total_identified}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--ev-c-text-2)' }}>已识别次数</div>
            </div>
          </div>

          <div style={{
            flex: 1,
            padding: '20px',
            borderRadius: '12px',
            backgroundColor: 'var(--ev-c-black-soft)',
            border: '1px solid var(--ev-c-gray-3)'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ev-c-text-1)', marginBottom: '20px' }}>
              各人物识别频率
            </h3>
            {stats.top_persons.length === 0 ? (
              <div style={{ color: 'var(--ev-c-text-2)', textAlign: 'center', paddingTop: '40px' }}>暂无数据</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {stats.top_persons.map((person, index) => {
                  const barWidth = maxCount > 0 ? (person.count / maxCount) * 100 : 0;
                  const colors = ['#6988e6', '#a78bfa', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#8b5cf6'];
                  const color = colors[index % colors.length];
                  return (
                    <div key={person.name} style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{
                        width: '80px',
                        fontSize: '14px',
                        color: 'var(--ev-c-text-1)',
                        textAlign: 'right',
                        paddingRight: '12px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {person.name}
                      </div>
                      <div style={{
                        flex: 1,
                        height: '24px',
                        backgroundColor: 'var(--ev-c-gray-3)',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        position: 'relative'
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${barWidth}%`,
                          backgroundColor: color,
                          borderRadius: '4px',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                      <div style={{
                        width: '50px',
                        fontSize: '14px',
                        color: 'var(--ev-c-text-2)',
                        paddingLeft: '12px',
                        textAlign: 'right'
                      }}>
                        {person.count}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Statistics;