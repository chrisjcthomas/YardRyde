import { useEffect } from 'react';

function Toast({ message, isVisible, onClose, duration = 3000 }) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 60,
      animation: 'slideUp 0.3s ease-out'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '16px 24px',
        backgroundColor: '#17a14e',
        color: 'white',
        borderRadius: '9999px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        fontWeight: 600,
        fontSize: '14px'
      }}>
        <span style={{ fontSize: '20px' }}>✓</span>
        <span>{message}</span>
        <span style={{ fontSize: '16px' }}>🚨</span>
      </div>
      
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

export default Toast;
