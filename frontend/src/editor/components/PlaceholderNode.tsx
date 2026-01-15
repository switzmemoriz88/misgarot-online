// ==========================================
// Placeholder Node - אזור לשיבוץ תמונה
// ==========================================
import { useRef, useEffect, useState } from 'react';
import { Group, Rect, Circle, Text, Image as KonvaImage, Star } from 'react-konva';
import { Transformer } from 'react-konva';
import { PlaceholderElement } from '../types';

// Store will be used for drag & drop from gallery
// import { useEditorStore } from '../store';

interface PlaceholderNodeProps {
  element: PlaceholderElement;
  isSelected: boolean;
  onSelect: (e: any) => void;
  onDragEnd: (e: any) => void;
  onTransformEnd: (e: any) => void;
}

export function PlaceholderNode({
  element,
  isSelected,
  onSelect,
  onDragEnd,
  onTransformEnd,
}: PlaceholderNodeProps) {
  const shapeRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Store functions for future use (drag & drop from gallery)

  // Load image if exists
  useEffect(() => {
    if (element.imageData?.src) {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => setImage(img);
      img.src = element.imageData.src;
    } else {
      setImage(null);
    }
  }, [element.imageData?.src]);

  // Transformer attachment
  useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  // Calculate clip function based on shape
  const getClipFunc = (ctx: any) => {
    const w = element.width;
    const h = element.height;
    
    switch (element.shape) {
      case 'circle':
        ctx.beginPath();
        ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
        ctx.closePath();
        break;
      case 'rounded':
        const radius = element.cornerRadius || 20;
        ctx.beginPath();
        ctx.moveTo(radius, 0);
        ctx.lineTo(w - radius, 0);
        ctx.quadraticCurveTo(w, 0, w, radius);
        ctx.lineTo(w, h - radius);
        ctx.quadraticCurveTo(w, h, w - radius, h);
        ctx.lineTo(radius, h);
        ctx.quadraticCurveTo(0, h, 0, h - radius);
        ctx.lineTo(0, radius);
        ctx.quadraticCurveTo(0, 0, radius, 0);
        ctx.closePath();
        break;
      case 'heart':
        ctx.beginPath();
        const topCurveHeight = h * 0.3;
        ctx.moveTo(w / 2, topCurveHeight);
        // Top left curve
        ctx.bezierCurveTo(
          w / 2, topCurveHeight * 0.5,
          0, topCurveHeight * 0.5,
          0, topCurveHeight
        );
        // Left curve to bottom
        ctx.bezierCurveTo(
          0, h * 0.55,
          w / 2, h * 0.75,
          w / 2, h
        );
        // Right side
        ctx.bezierCurveTo(
          w / 2, h * 0.75,
          w, h * 0.55,
          w, topCurveHeight
        );
        // Top right curve
        ctx.bezierCurveTo(
          w, topCurveHeight * 0.5,
          w / 2, topCurveHeight * 0.5,
          w / 2, topCurveHeight
        );
        ctx.closePath();
        break;
      case 'star':
        const spikes = 5;
        const outerRadius = Math.min(w, h) / 2;
        const innerRadius = outerRadius * 0.4;
        const cx = w / 2;
        const cy = h / 2;
        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
          const radius = i % 2 === 0 ? outerRadius : innerRadius;
          const angle = (i * Math.PI) / spikes - Math.PI / 2;
          const x = cx + Math.cos(angle) * radius;
          const y = cy + Math.sin(angle) * radius;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        break;
      default: // rectangle
        ctx.beginPath();
        ctx.rect(0, 0, w, h);
        ctx.closePath();
    }
  };

  // Render background shape
  const renderShape = () => {
    const shapeProps = {
      width: element.width,
      height: element.height,
      fill: isDragOver ? '#e0e7ff' : element.fill,
      stroke: isDragOver ? '#6366f1' : element.stroke,
      strokeWidth: element.strokeWidth,
      dash: element.imageData ? undefined : [10, 5],
    };

    switch (element.shape) {
      case 'circle':
        return (
          <Circle
            x={element.width / 2}
            y={element.height / 2}
            radiusX={element.width / 2}
            radiusY={element.height / 2}
            {...shapeProps}
            width={undefined}
            height={undefined}
          />
        );
      case 'star':
        return (
          <Star
            x={element.width / 2}
            y={element.height / 2}
            numPoints={5}
            innerRadius={Math.min(element.width, element.height) * 0.2}
            outerRadius={Math.min(element.width, element.height) / 2}
            fill={isDragOver ? '#e0e7ff' : element.fill}
            stroke={isDragOver ? '#6366f1' : element.stroke}
            strokeWidth={element.strokeWidth}
            dash={element.imageData ? undefined : [10, 5]}
          />
        );
      default:
        return (
          <Rect
            {...shapeProps}
            cornerRadius={element.shape === 'rounded' ? (element.cornerRadius || 20) : 0}
          />
        );
    }
  };

  // Render image with clipping
  const renderImage = () => {
    if (!image || !element.imageData) return null;

    const { offsetX = 0, offsetY = 0, scale = 1 } = element.imageData;
    
    // Calculate image dimensions to cover the placeholder
    const imgRatio = image.width / image.height;
    const placeholderRatio = element.width / element.height;
    
    let imgWidth, imgHeight;
    if (imgRatio > placeholderRatio) {
      imgHeight = element.height * scale;
      imgWidth = imgHeight * imgRatio;
    } else {
      imgWidth = element.width * scale;
      imgHeight = imgWidth / imgRatio;
    }

    // Center the image
    const x = (element.width - imgWidth) / 2 + offsetX;
    const y = (element.height - imgHeight) / 2 + offsetY;

    return (
      <Group clipFunc={getClipFunc}>
        <KonvaImage
          image={image}
          x={x}
          y={y}
          width={imgWidth}
          height={imgHeight}
        />
      </Group>
    );
  };

  // Render placeholder text
  const renderPlaceholderText = () => {
    if (element.imageData) return null;
    
    return (
      <Text
        text={element.label || 'גרור תמונה לכאן'}
        x={0}
        y={element.height / 2 - 10}
        width={element.width}
        align="center"
        fontSize={14}
        fontFamily="Heebo, sans-serif"
        fill="#9ca3af"
      />
    );
  };

  return (
    <>
      <Group
        ref={shapeRef}
        x={element.x}
        y={element.y}
        width={element.width}
        height={element.height}
        rotation={element.rotation}
        scaleX={element.scaleX}
        scaleY={element.scaleY}
        opacity={element.opacity}
        draggable={!element.isLocked}
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={onDragEnd}
        onTransformEnd={onTransformEnd}
        onDragOver={() => setIsDragOver(true)}
        onDragLeave={() => setIsDragOver(false)}
      >
        {/* Background Shape */}
        {renderShape()}
        
        {/* Image if exists */}
        {renderImage()}
        
        {/* Placeholder Text */}
        {renderPlaceholderText()}
      </Group>

      {/* Transformer */}
      {isSelected && !element.isLocked && (
        <Transformer
          ref={transformerRef}
          rotateEnabled={true}
          enabledAnchors={[
            'top-left',
            'top-right',
            'bottom-left',
            'bottom-right',
            'middle-left',
            'middle-right',
            'top-center',
            'bottom-center',
          ]}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 50 || newBox.height < 50) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
}

export default PlaceholderNode;
