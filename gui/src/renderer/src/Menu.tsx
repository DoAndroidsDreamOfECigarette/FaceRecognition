import React from "react";

interface MenuProps {
  onStartCamera: () => void;
  onStartRegister: () => void;
  onStartDelete: () => void;
  onStartLogs: () => void;
  onStartStatistics: () => void;
}

function Menu({ onStartCamera, onStartRegister, onStartDelete, onStartLogs, onStartStatistics }: MenuProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      width: '100vw',
      padding: '40px',
      boxSizing: 'border-box'
    }}>
      <h1 style={{
        fontSize: '32px',
        fontWeight: 700,
        marginBottom: '8px',
        background: 'linear-gradient(135deg, #6988e6, #a78bfa)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        人脸识别系统
      </h1>
      <p style={{
        fontSize: '15px',
        color: 'var(--ev-c-text-2)',
        marginBottom: '48px'
      }}>
        基于深度学习的实时人脸识别与注册平台
      </p>

      <div style={{
        display: 'flex',
        gap: '24px',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        <div
          onClick={onStartCamera}
          style={{
            width: '220px',
            padding: '32px 24px',
            borderRadius: '16px',
            backgroundColor: 'var(--ev-c-black-soft)',
            border: '1px solid var(--ev-c-gray-3)',
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'all 0.2s ease',
            userSelect: 'none'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#6988e6'
            e.currentTarget.style.transform = 'translateY(-4px)'
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(105,136,230,0.15)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--ev-c-gray-3)'
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>&#128249;</div>
          <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: 'var(--ev-c-text-1)' }}>
            开始识别
          </div>
          <div style={{ fontSize: '13px', color: 'var(--ev-c-text-2)', lineHeight: '1.5' }}>
            开启摄像头，实时检测并识别已注册的人脸
          </div>
        </div>

        <div
          onClick={onStartRegister}
          style={{
            width: '220px',
            padding: '32px 24px',
            borderRadius: '16px',
            backgroundColor: 'var(--ev-c-black-soft)',
            border: '1px solid var(--ev-c-gray-3)',
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'all 0.2s ease',
            userSelect: 'none'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#a78bfa'
            e.currentTarget.style.transform = 'translateY(-4px)'
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(167,139,250,0.15)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--ev-c-gray-3)'
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>&#128100;</div>
          <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: 'var(--ev-c-text-1)' }}>
            添加信息
          </div>
          <div style={{ fontSize: '13px', color: 'var(--ev-c-text-2)', lineHeight: '1.5' }}>
            上传人脸照片并录入姓名，注册到人脸库中
          </div>
        </div>

        <div
          onClick={onStartDelete}
          style={{
            width: '220px',
            padding: '32px 24px',
            borderRadius: '16px',
            backgroundColor: 'var(--ev-c-black-soft)',
            border: '1px solid var(--ev-c-gray-3)',
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'all 0.2s ease',
            userSelect: 'none'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#f87171'
            e.currentTarget.style.transform = 'translateY(-4px)'
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(248,113,113,0.15)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--ev-c-gray-3)'
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>&#128465;</div>
          <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: 'var(--ev-c-text-1)' }}>
            管理人脸库
          </div>
          <div style={{ fontSize: '13px', color: 'var(--ev-c-text-2)', lineHeight: '1.5' }}>
            查看已注册的人脸信息，删除不需要的记录
          </div>
        </div>

        <div
          onClick={onStartLogs}
          style={{
            width: '220px',
            padding: '32px 24px',
            borderRadius: '16px',
            backgroundColor: 'var(--ev-c-black-soft)',
            border: '1px solid var(--ev-c-gray-3)',
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'all 0.2s ease',
            userSelect: 'none'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#22c55e'
            e.currentTarget.style.transform = 'translateY(-4px)'
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(34,197,94,0.15)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--ev-c-gray-3)'
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>&#128203;</div>
          <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: 'var(--ev-c-text-1)' }}>
            识别记录
          </div>
          <div style={{ fontSize: '13px', color: 'var(--ev-c-text-2)', lineHeight: '1.5' }}>
            查看历史识别记录，了解识别情况与相似度
          </div>
        </div>

        <div
          onClick={onStartStatistics}
          style={{
            width: '220px',
            padding: '32px 24px',
            borderRadius: '16px',
            backgroundColor: 'var(--ev-c-black-soft)',
            border: '1px solid var(--ev-c-gray-3)',
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'all 0.2s ease',
            userSelect: 'none'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#f59e0b'
            e.currentTarget.style.transform = 'translateY(-4px)'
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(245,158,11,0.15)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--ev-c-gray-3)'
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>&#128200;</div>
          <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: 'var(--ev-c-text-1)' }}>
            数据统计
          </div>
          <div style={{ fontSize: '13px', color: 'var(--ev-c-text-2)', lineHeight: '1.5' }}>
            查看识别统计数据，了解整体识别情况
          </div>
        </div>
      </div>
    </div>
  )
}

export default Menu