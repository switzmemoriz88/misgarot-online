// ==========================================
// ShapeNode Component - צורות על הקנבס
// ==========================================

import React from 'react';
import { Rect, Circle, Line, RegularPolygon, Star, Group } from 'react-konva';
import Konva from 'konva';
import { ShapeElement } from '../types';

interface ShapeNodeProps {
  element: ShapeElement;
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

export const ShapeNode: React.FC<ShapeNodeProps> = ({
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
  const commonProps = {
    fill: element.fill,
    stroke: element.stroke,
    strokeWidth: element.strokeWidth,
    shadowColor: element.shadow?.color,
    shadowBlur: element.shadow?.blur,
    shadowOffsetX: element.shadow?.offsetX,
    shadowOffsetY: element.shadow?.offsetY,
    dash: element.strokeStyle === 'dashed' 
      ? [10, 5] 
      : element.strokeStyle === 'dotted' 
        ? [2, 2] 
        : undefined,
  };

  const renderShape = () => {
    switch (element.shapeType) {
      case 'rectangle':
        return (
          <Rect
            width={width}
            height={height}
            cornerRadius={element.cornerRadius || 0}
            {...commonProps}
          />
        );

      case 'circle':
        // Render as ellipse that fits in the bounding box
        const radiusX = width / 2;
        const radiusY = height / 2;
        return (
          <Circle
            x={radiusX}
            y={radiusY}
            radiusX={radiusX}
            radiusY={radiusY}
            {...commonProps}
          />
        );

      case 'triangle':
        return (
          <Line
            points={[
              width / 2, 0,  // Top
              width, height, // Bottom right
              0, height,     // Bottom left
            ]}
            closed={true}
            {...commonProps}
          />
        );

      case 'star':
        return (
          <Star
            x={width / 2}
            y={height / 2}
            numPoints={5}
            innerRadius={Math.min(width, height) / 4}
            outerRadius={Math.min(width, height) / 2}
            {...commonProps}
          />
        );

      case 'polygon':
        const sides = element.sides || 6;
        return (
          <RegularPolygon
            x={width / 2}
            y={height / 2}
            sides={sides}
            radius={Math.min(width, height) / 2}
            {...commonProps}
          />
        );

      case 'line':
        return (
          <Line
            points={[0, height / 2, width, height / 2]}
            {...commonProps}
            fill={undefined}
          />
        );

      case 'arrow':
        const arrowSize = Math.min(width, height) * 0.2;
        return (
          <Line
            points={[0, height / 2, width - arrowSize, height / 2]}
            pointerLength={arrowSize}
            pointerWidth={arrowSize}
            {...commonProps}
            fill={element.stroke || element.fill}
          />
        );

      default:
        return (
          <Rect
            width={width}
            height={height}
            {...commonProps}
          />
        );
    }
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
      {renderShape()}
    </Group>
  );
};
