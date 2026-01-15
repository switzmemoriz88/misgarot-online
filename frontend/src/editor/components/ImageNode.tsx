// ==========================================
// ImageNode Component - תמונה על הקנבס
// ==========================================

import React, { useEffect, useState, useRef } from 'react';
import { Image, Group, Rect } from 'react-konva';
import Konva from 'konva';
import { ImageElement } from '../types';

interface ImageNodeProps {
  element: ImageElement;
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  draggable: boolean;
  onClick: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onTransformEnd: (e: Konva.KonvaEventObject<Event>) => void;
}

export const ImageNode: React.FC<ImageNodeProps> = ({
  element,
  id,
  x,
  y,
  width,
  height,
  rotation,
  opacity,
  draggable,
  onClick,
  onDragMove,
  onDragEnd,
  onTransformEnd,
}) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imageRef = useRef<Konva.Image>(null);

  // Load image
  useEffect(() => {
    if (!element.src) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      setImage(img);
      setIsLoading(false);
      setHasError(false);
    };

    img.onerror = () => {
      setHasError(true);
      setIsLoading(false);
    };

    img.src = element.src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [element.src]);

  // Apply filters
  useEffect(() => {
    if (!imageRef.current || !image) return;

    const filters: Array<typeof Konva.Filters.Brighten> = [];
    
    if (element.filters?.brightness !== 0) {
      filters.push(Konva.Filters.Brighten);
    }
    if (element.filters?.contrast !== 0) {
      filters.push(Konva.Filters.Contrast);
    }
    if (element.filters?.saturation !== 0) {
      // Note: Konva doesn't have built-in saturation, using HSL
      filters.push(Konva.Filters.HSL);
    }
    if (element.filters?.blur && element.filters.blur > 0) {
      filters.push(Konva.Filters.Blur);
    }
    if (element.filters?.grayscale) {
      filters.push(Konva.Filters.Grayscale);
    }

    imageRef.current.cache();
    imageRef.current.filters(filters);

    if (element.filters?.brightness !== undefined) {
      imageRef.current.brightness(element.filters.brightness / 100);
    }
    if (element.filters?.contrast !== undefined) {
      imageRef.current.contrast(element.filters.contrast / 100);
    }
    if (element.filters?.saturation !== undefined) {
      imageRef.current.saturation(element.filters.saturation / 100);
    }
    if (element.filters?.blur !== undefined) {
      imageRef.current.blurRadius(element.filters.blur);
    }

    imageRef.current.getLayer()?.batchDraw();
  }, [image, element.filters]);

  // Calculate crop/fit
  const getImageProps = () => {
    if (!image) return {};

    const imgWidth = image.width;
    const imgHeight = image.height;
    const aspectRatio = imgWidth / imgHeight;
    const boxAspectRatio = width / height;
    const objectFit = element.objectFit || 'cover';

    let cropX = 0;
    let cropY = 0;
    let cropWidth = imgWidth;
    let cropHeight = imgHeight;

    switch (objectFit) {
      case 'cover':
        if (aspectRatio > boxAspectRatio) {
          // Image is wider
          cropWidth = imgHeight * boxAspectRatio;
          cropX = (imgWidth - cropWidth) / 2;
        } else {
          // Image is taller
          cropHeight = imgWidth / boxAspectRatio;
          cropY = (imgHeight - cropHeight) / 2;
        }
        break;
      case 'contain':
        // No crop needed, just scale
        break;
      case 'fill':
        // Stretch to fill
        break;
    }

    return {
      crop: objectFit === 'cover' ? {
        x: cropX,
        y: cropY,
        width: cropWidth,
        height: cropHeight,
      } : undefined,
    };
  };

  return (
    <Group
      id={id}
      x={x}
      y={y}
      width={width}
      height={height}
      rotation={rotation}
      opacity={opacity}
      draggable={draggable}
      onClick={onClick}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      onTransformEnd={onTransformEnd}
    >
      {/* Placeholder/Loading state */}
      {(isLoading || hasError) && (
        <Rect
          width={width}
          height={height}
          fill={hasError ? '#fee2e2' : '#f3f4f6'}
          stroke={hasError ? '#ef4444' : '#d1d5db'}
          strokeWidth={1}
          cornerRadius={element.borderRadius || 0}
        />
      )}

      {/* Border/Background */}
      {element.borderWidth && element.borderWidth > 0 && (
        <Rect
          width={width}
          height={height}
          stroke={element.borderColor || '#000000'}
          strokeWidth={element.borderWidth}
          cornerRadius={element.borderRadius || 0}
          listening={false}
        />
      )}

      {/* Image */}
      {image && !hasError && (
        <Image
          ref={imageRef}
          image={image}
          width={width}
          height={height}
          cornerRadius={element.borderRadius || 0}
          {...getImageProps()}
        />
      )}

      {/* Shadow (if needed) */}
      {element.shadow && element.shadow.blur > 0 && (
        <Rect
          width={width}
          height={height}
          shadowColor={element.shadow.color}
          shadowBlur={element.shadow.blur}
          shadowOffsetX={element.shadow.offsetX}
          shadowOffsetY={element.shadow.offsetY}
          shadowOpacity={1}
          listening={false}
          fill="transparent"
        />
      )}
    </Group>
  );
};
