// ==========================================
// Preview Modal - תצוגה מקדימה
// ==========================================

import React, { useState, useEffect } from 'react';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  stageRef: React.RefObject<any>;
}

type DeviceType = 'desktop' | 'tablet' | 'mobile';

const DEVICE_SIZES: Record<DeviceType, { width: number; height: number; label: string; icon: string }> = {
  desktop: { width: 1200, height: 800, label: 'מחשב', icon: '🖥️' },
  tablet: { width: 768, height: 1024, label: 'טאבלט', icon: '📱' },
  mobile: { width: 375, height: 667, label: 'טלפון', icon: '📲' },
};

export const PreviewModal: React.FC<PreviewModalProps> = ({ isOpen, onClose, stageRef }) => {
  const [previewImage, setPreviewImage] = useState<string>('');
  const [selectedDevice, setSelectedDevice] = useState<DeviceType>('desktop');
  const [isLoading, setIsLoading] = useState(true);
  const [zoom, setZoom] = useState(1);

  // Generate preview image when modal opens
  useEffect(() => {
    if (isOpen && stageRef.current) {
      setIsLoading(true);
      
      // Small delay to ensure canvas is ready
      setTimeout(() => {
        try {
          const dataURL = stageRef.current.toDataURL({
            pixelRatio: 2,
            mimeType: 'image/png',
          });
          setPreviewImage(dataURL);
        } catch (error) {
          console.error('Failed to generate preview:', error);
        } finally {
          setIsLoading(false);
        }
      }, 100);
    }
  }, [isOpen, stageRef]);

  // Calculate display size based on device
  const getDisplaySize = () => {
    const device = DEVICE_SIZES[selectedDevice];
    const maxWidth = window.innerWidth * 0.7;
    const maxHeight = window.innerHeight * 0.7;
    
    let scale = Math.min(
      maxWidth / device.width,
      maxHeight / device.height
    ) * zoom;
    
    return {
      width: device.width * scale,
      height: device.height * scale,
    };
  };

  const displaySize = getDisplaySize();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="bg-white rounded-xl shadow-2xl max-w-[95vw] max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-gray-800">תצוגה מקדימה</h2>
            
            {/* Device Selector */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              {(Object.entries(DEVICE_SIZES) as [DeviceType, typeof DEVICE_SIZES[DeviceType]][]).map(([device, config]) => (
                <button
                  key={device}
                  onClick={() => setSelectedDevice(device)}
                  className={`
                    px-3 py-1.5 rounded-md text-sm transition-colors flex items-center gap-1
                    ${selectedDevice === device
                      ? 'bg-white shadow text-indigo-600'
                      : 'text-gray-600 hover:text-gray-800'
                    }
                  `}
                  title={config.label}
                >
                  <span>{config.icon}</span>
                  <span className="hidden sm:inline">{config.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg px-2 py-1">
              <button
                onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                className="p-1 hover:bg-gray-200 rounded"
                disabled={zoom <= 0.5}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <span className="text-sm text-gray-600 min-w-[50px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom(Math.min(2, zoom + 0.25))}
                className="p-1 hover:bg-gray-200 rounded"
                disabled={zoom >= 2}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 p-8 bg-gray-100 flex items-center justify-center overflow-auto">
          {/* Device Frame */}
          <div
            className={`
              relative bg-gray-800 rounded-3xl p-3 shadow-2xl transition-all duration-300
              ${selectedDevice === 'mobile' ? 'rounded-[2rem]' : ''}
            `}
            style={{
              width: displaySize.width + 24,
              height: displaySize.height + 24,
            }}
          >
            {/* Screen */}
            <div
              className="bg-white rounded-2xl overflow-hidden relative"
              style={{
                width: displaySize.width,
                height: displaySize.height,
              }}
            >
              {isLoading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                  <div className="flex flex-col items-center gap-3">
                    <svg className="animate-spin w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="text-gray-500 text-sm">טוען תצוגה מקדימה...</span>
                  </div>
                </div>
              ) : (
                <img
                  src={previewImage}
                  alt="תצוגה מקדימה"
                  className="w-full h-full object-contain"
                  style={{ background: 'repeating-conic-gradient(#f3f4f6 0% 25%, transparent 0% 50%) 50% / 20px 20px' }}
                />
              )}
            </div>

            {/* Device Notch (for mobile) */}
            {selectedDevice === 'mobile' && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-gray-800 rounded-b-xl" />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-500">
            {DEVICE_SIZES[selectedDevice].label}: {DEVICE_SIZES[selectedDevice].width} × {DEVICE_SIZES[selectedDevice].height} px
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
            >
              סגור
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;
