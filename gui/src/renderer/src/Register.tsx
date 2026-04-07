import React, { useState } from 'react';

interface RegisterProps {
  onBack: () => void;
}

const Register: React.FC<RegisterProps> = ({ onBack }) => {
  const [name, setName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRegister = async () => {
    if (!name.trim()) {
      alert('请输入姓名');
      return;
    }
    if (!selectedFile) {
      alert('请上传照片');
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('file', selectedFile);

    try {
      const res = await fetch('http://127.0.0.1:5000/register', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.error) {
        alert('注册失败：' + data.error);
      } else if (data.message) {
        alert('注册成功：' + data.message);
        setName('');
        setSelectedFile(null);
        setPreviewUrl(null);
      } else {
        alert('注册失败，未知响应');
      }
    } catch (err) {
      console.error('注册请求失败', err);
      alert('注册失败，请检查后端服务是否运行');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
      <h2>注册人脸</h2>
      <div
        style={{
          width: '150px',
          height: '150px',
          border: '2px dashed #ccc',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '20px auto',
          cursor: 'pointer',
          backgroundImage: previewUrl ? `url(${previewUrl})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        onClick={() => document.getElementById('fileInput')?.click()}
      >
        {!previewUrl && <span style={{ fontSize: '48px', color: '#aaa' }}>+</span>}
      </div>
      <input
        id="fileInput"
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleImageChange}
      />
      <input
        type="text"
        placeholder="姓名"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ width: '80%', padding: '8px', margin: '10px 0', fontSize: '16px' }}
      />
      <br />
      <button onClick={handleRegister} style={{ padding: '8px 20px', fontSize: '16px', marginRight: '10px' }}>
        注册
      </button>
      <button onClick={onBack} style={{ padding: '8px 20px', fontSize: '16px' }}>
        返回
      </button>
    </div>
  );
};

export default Register;