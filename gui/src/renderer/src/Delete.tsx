import React, { useEffect, useState } from 'react';

interface DeleteProps {
  onBack: () => void;
}

const Delete: React.FC<DeleteProps> = ({ onBack }) => {
  const [names, setNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNames = async () => {
    try {
      const res = await fetch('http://127.0.0.1:5000/face_list');
      const data = await res.json();
      setNames(data.names || []);
    } catch (err) {
      console.error('获取人脸列表失败', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNames();
  }, []);

  const handleDelete = async (name: string) => {
    if (!confirm(`确定要删除"${name}"吗？`)) return;
    const formData = new FormData();
    formData.append('name', name);
    try {
      const res = await fetch('http://127.0.0.1:5000/delete_face', {
        method: 'DELETE',
        body: formData
      });
      const data = await res.json();
      if (data.error) {
        alert('删除失败：' + data.error);
      } else {
        setNames(prev => prev.filter(n => n !== name));
      }
    } catch (err) {
      console.error('删除请求失败', err);
      alert('删除失败，请检查后端服务');
    }
  };

  return (
    <div style={{
      padding: '40px',
      maxWidth: '600px',
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
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--ev-c-text-1)' }}>管理人脸库</h2>
      </div>

      {loading ? (
        <div style={{ color: 'var(--ev-c-text-2)', textAlign: 'center', marginTop: '40px' }}>加载中...</div>
      ) : names.length === 0 ? (
        <div style={{ color: 'var(--ev-c-text-2)', textAlign: 'center', marginTop: '40px' }}>人脸库为空</div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {names.map(name => (
            <div
              key={name}
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
              <span style={{ fontSize: '15px', color: 'var(--ev-c-text-1)' }}>{name}</span>
              <button
                onClick={() => handleDelete(name)}
                style={{
                  padding: '4px 12px',
                  backgroundColor: 'transparent',
                  color: '#ef4444',
                  border: '1px solid #ef4444',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = '#ef4444';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#ef4444';
                }}
              >
                删除
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Delete;
