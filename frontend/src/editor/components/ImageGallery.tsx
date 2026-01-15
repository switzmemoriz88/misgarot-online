// ==========================================
// Image Gallery - גלריית תמונות הלקוח
// ==========================================
import { useState, useCallback, useRef } from 'react';
import { Upload, Trash2, Image as ImageIcon, X, ZoomIn, GripVertical } from 'lucide-react';
import { GalleryImage } from '../types';
import { useEditorStore } from '../store';

export function ImageGallery() {
  const { galleryImages, addGalleryImage, removeGalleryImage, clearGallery } = useEditorStore();
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [previewImage, setPreviewImage] = useState<GalleryImage | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // טיפול בהעלאת קבצים
  const handleFiles = useCallback(async (files: FileList | File[]) => {
    setIsUploading(true);
    
    const fileArray = Array.from(files);
    const imageFiles = fileArray.filter(file => file.type.startsWith('image/'));
    
    for (const file of imageFiles) {
      try {
        const image = await processImageFile(file);
        addGalleryImage(image);
      } catch (error) {
        console.error('Failed to process image:', error);
      }
    }
    
    setIsUploading(false);
  }, [addGalleryImage]);

  // עיבוד קובץ תמונה
  const processImageFile = (file: File): Promise<GalleryImage> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // יצירת thumbnail
          const canvas = document.createElement('canvas');
          const maxThumbSize = 150;
          let thumbWidth = img.width;
          let thumbHeight = img.height;
          
          if (thumbWidth > thumbHeight) {
            if (thumbWidth > maxThumbSize) {
              thumbHeight = (thumbHeight * maxThumbSize) / thumbWidth;
              thumbWidth = maxThumbSize;
            }
          } else {
            if (thumbHeight > maxThumbSize) {
              thumbWidth = (thumbWidth * maxThumbSize) / thumbHeight;
              thumbHeight = maxThumbSize;
            }
          }
          
          canvas.width = thumbWidth;
          canvas.height = thumbHeight;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, thumbWidth, thumbHeight);
          
          const galleryImage: GalleryImage = {
            id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            src: e.target?.result as string,
            thumbnailSrc: canvas.toDataURL('image/jpeg', 0.7),
            originalWidth: img.width,
            originalHeight: img.height,
            name: file.name,
            uploadedAt: Date.now(),
            size: file.size,
          };
          
          resolve(galleryImage);
        };
        
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  // Drag & Drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    
    if (e.dataTransfer.files?.length) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  // התחלת גרירה של תמונה לקנבס
  const handleImageDragStart = useCallback((e: React.DragEvent, image: GalleryImage) => {
    e.dataTransfer.setData('application/gallery-image', JSON.stringify(image));
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  // פורמט גודל קובץ
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            גלריית תמונות
          </h3>
          {galleryImages.length > 0 && (
            <button
              onClick={clearGallery}
              className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
              title="מחק הכל"
            >
              <Trash2 className="w-3 h-3" />
              נקה
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          גרור תמונות לכאן או לחץ להעלאה
        </p>
      </div>

      {/* Upload Area */}
      <div
        className={`
          m-3 p-4 border-2 border-dashed rounded-lg transition-all cursor-pointer
          ${isDraggingOver 
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400'
          }
          ${isUploading ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        
        <div className="flex flex-col items-center gap-2 text-gray-500 dark:text-gray-400">
          <Upload className={`w-8 h-8 ${isDraggingOver ? 'text-indigo-500' : ''}`} />
          <span className="text-sm text-center">
            {isUploading ? 'מעלה...' : isDraggingOver ? 'שחרר כאן' : 'העלה תמונות'}
          </span>
        </div>
      </div>

      {/* Images Grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {galleryImages.length === 0 ? (
          <div className="text-center text-gray-400 dark:text-gray-500 py-8">
            <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">אין תמונות בגלריה</p>
            <p className="text-xs mt-1">העלה תמונות כדי להתחיל</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {galleryImages.map((image) => (
              <div
                key={image.id}
                draggable
                onDragStart={(e) => handleImageDragStart(e, image)}
                className="group relative aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-indigo-500 transition-all"
              >
                {/* Thumbnail */}
                <img
                  src={image.thumbnailSrc || image.src}
                  alt={image.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                
                {/* Drag Handle Indicator */}
                <div className="absolute top-1 right-1 p-1 bg-black/50 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="w-3 h-3 text-white" />
                </div>
                
                {/* Overlay Actions */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewImage(image);
                    }}
                    className="p-2 bg-white/20 rounded-full hover:bg-white/40 transition-colors"
                    title="תצוגה מקדימה"
                  >
                    <ZoomIn className="w-4 h-4 text-white" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeGalleryImage(image.id);
                    }}
                    className="p-2 bg-red-500/50 rounded-full hover:bg-red-500/80 transition-colors"
                    title="מחק תמונה"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>
                </div>

                {/* File Info */}
                <div className="absolute bottom-0 left-0 right-0 p-1 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-[10px] text-white truncate">{image.name}</p>
                  <p className="text-[9px] text-white/70">{formatFileSize(image.size)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Images Count */}
      {galleryImages.length > 0 && (
        <div className="p-2 border-t border-gray-200 dark:border-gray-700 text-center">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {galleryImages.length} תמונות בגלריה
          </span>
        </div>
      )}

      {/* Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 p-2 text-white hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={previewImage.src}
              alt={previewImage.name}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
            <div className="mt-2 text-white text-center">
              <p className="font-medium">{previewImage.name}</p>
              <p className="text-sm text-gray-300">
                {previewImage.originalWidth} × {previewImage.originalHeight} • {formatFileSize(previewImage.size)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ImageGallery;
