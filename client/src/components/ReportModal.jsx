import { useState } from 'react';
import { REPORT_TYPES } from '../constants';

function ReportModal({ isOpen, onClose, onSubmit, userLocation, darkMode }) {
  const [submitting, setSubmitting] = useState(false);

  const handleReportClick = (reportType) => {
    if (submitting) return;
    
    setSubmitting(true);
    
    const reportData = {
      type: reportType.id,
      lat: userLocation?.lat || 18.0179,
      lng: userLocation?.lng || -76.8099
    };
    
    onSubmit(reportData);
    
    // Reset after a short delay
    setTimeout(() => {
      setSubmitting(false);
      onClose();
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      {/* Backdrop */}
      <div 
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)'
        }}
      />
      
      {/* Modal Card */}
      <div 
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '420px',
          backgroundColor: darkMode ? '#1e1e1e' : 'white',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0, 0, 0, 0.05)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '24px',
          borderBottom: darkMode ? '1px solid #374151' : '1px solid #f3f4f6'
        }}>
          <div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: darkMode ? '#f3f4f6' : '#111827',
              margin: 0
            }}>
              How's the ride?
            </h2>
            <p style={{
              fontSize: '14px',
              color: darkMode ? '#9ca3af' : '#6b7280',
              margin: '4px 0 0 0'
            }}>
              Share what you're experiencing
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              color: '#9ca3af',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.color = '#4b5563'}
            onMouseLeave={(e) => e.target.style.color = '#9ca3af'}
          >
            <span style={{ fontSize: '24px' }}>✕</span>
          </button>
        </div>

        {/* Report Grid */}
        <div style={{ padding: '24px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px'
          }}>
            {Object.values(REPORT_TYPES).map((reportType) => (
              <button
                key={reportType.id}
                onClick={() => handleReportClick(reportType)}
                disabled={submitting}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '24px 16px',
                  border: darkMode ? '2px solid #374151' : '2px solid #f3f4f6',
                  borderRadius: '12px',
                  backgroundColor: darkMode ? '#2a2a2a' : 'white',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  opacity: submitting ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (!submitting) {
                    e.currentTarget.style.borderColor = '#17a14e';
                    e.currentTarget.style.backgroundColor = darkMode ? 'rgba(23, 161, 78, 0.15)' : 'rgba(23, 161, 78, 0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = darkMode ? '#374151' : '#f3f4f6';
                  e.currentTarget.style.backgroundColor = darkMode ? '#2a2a2a' : 'white';
                }}
              >
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: `${reportType.color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '12px',
                  fontSize: '24px',
                  transition: 'transform 0.2s'
                }}>
                  {reportType.icon}
                </div>
                <span style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: darkMode ? '#d1d5db' : '#374151'
                }}>
                  {reportType.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          backgroundColor: darkMode ? '#252525' : '#f9fafb',
          borderTop: darkMode ? '1px solid #374151' : '1px solid #f3f4f6',
          textAlign: 'center'
        }}>
          <p style={{
            fontSize: '12px',
            color: '#9ca3af',
            margin: 0
          }}>
            Your report helps others plan their trip
          </p>
        </div>
      </div>
    </div>
  );
}

export default ReportModal;
