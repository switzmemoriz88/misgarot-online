// ==========================================
// Canvas Component - React Konva
// ==========================================

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Stage, Layer, Rect, Transformer, Group, Line } from 'react-konva';
import Konva from 'konva';
import { useEditorStore } from './store';
import { CanvasElement, GalleryImage, PlaceholderElement } from './types';
import { TextNode } from './components/TextNode';
import { ImageNode } from './components/ImageNode';
import { ShapeNode } from './components/ShapeNode';
import { PlaceholderNode } from './components/PlaceholderNode';
import { useSmartGuides, Guide } from './hooks/useSmartGuides';

interface CanvasProps {
  width: number;
  height: number;
  stageRef?: React.RefObject<Konva.Stage>;
}

export const Canvas: React.FC<CanvasProps> = ({ width, height, stageRef: externalStageRef }) => {
  const internalStageRef = useRef<Konva.Stage>(null);
  const stageRef = externalStageRef || internalStageRef;
  const transformerRef = useRef<Konva.Transformer>(null);
  const selectionRectRef = useRef<Konva.Rect>(null);

  const {
    elements,
    selectedIds,
    canvasWidth,
    canvasHeight,
    zoom,
    panX,
    panY,
    showGrid,
    gridSize,
    snapToGuides,
    currentTool,
    selectElement,
    clearSelection,
    updateElement,
    saveToHistory,
    addElement,
    assignImageToPlaceholder,
    backgroundColor,
    backgroundType,
    gradientColors,
  } = useEditorStore();

  // Smart Guides
  const { calculateSnap, clearGuides } = useSmartGuides({
    elements,
    canvasWidth,
    canvasHeight,
    threshold: 8,
    enabled: snapToGuides,
  });

  // Active guides state for rendering
  const [activeGuides, setActiveGuides] = useState<Guide[]>([]);

  // Selection rectangle state
  const [selectionRect, setSelectionRect] = useState<{
    visible: boolean;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }>({
    visible: false,
    x1: 0,
    y1: 0,
    x2: 0,
    y2: 0,
  });

  // Update transformer when selection changes
  useEffect(() => {
    if (!transformerRef.current || !stageRef.current) return;

    const stage = stageRef.current;
    const nodes = selectedIds
      .map((id) => stage.findOne(`#${id}`))
      .filter(Boolean) as Konva.Node[];

    transformerRef.current.nodes(nodes);
    transformerRef.current.getLayer()?.batchDraw();
  }, [selectedIds, elements]);

  // Listen for text updates from inline editing
  useEffect(() => {
    const handleTextUpdate = (e: CustomEvent<{ id: string; text: string }>) => {
      const { id, text } = e.detail;
      updateElement(id, { text });
      saveToHistory('עדכון טקסט');
    };

    window.addEventListener('textUpdate', handleTextUpdate as EventListener);
    
    return () => {
      window.removeEventListener('textUpdate', handleTextUpdate as EventListener);
    };
  }, [updateElement, saveToHistory]);

  // Handle stage click (deselect)
  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (e.target === e.target.getStage()) {
        clearSelection();
      }
    },
    [clearSelection]
  );

  // Handle element selection
  const handleElementClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>, id: string) => {
      e.cancelBubble = true;
      const metaPressed = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;
      selectElement(id, metaPressed);
    },
    [selectElement]
  );

  // Handle drag move with smart guides
  const handleDragMove = useCallback(
    (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
      if (!snapToGuides) return;
      
      const node = e.target;
      const element = elements.find(el => el.id === id);
      if (!element) return;

      const snapResult = calculateSnap(
        id,
        node.x(),
        node.y(),
        element.width,
        element.height
      );

      // Apply snapped position
      node.x(snapResult.x);
      node.y(snapResult.y);

      // Update guides display
      setActiveGuides(snapResult.guides);
    },
    [elements, snapToGuides, calculateSnap]
  );

  // Handle drag end
  const handleDragEnd = useCallback(
    (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
      // Clear guides
      setActiveGuides([]);
      clearGuides();

      updateElement(id, {
        x: e.target.x(),
        y: e.target.y(),
      });
      saveToHistory('הזזה');
    },
    [updateElement, saveToHistory, clearGuides]
  );

  // Handle transform end
  const handleTransformEnd = useCallback(
    (id: string, e: Konva.KonvaEventObject<Event>) => {
      const node = e.target;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();

      // Reset scale
      node.scaleX(1);
      node.scaleY(1);

      // Find the element to check its type
      const element = elements.find(el => el.id === id);
      
      if (element?.type === 'text') {
        // For text elements, the fontSize was already updated in real-time by TextNode
        // Just update position and rotation, and ensure dimensions are correct
        updateElement(id, {
          x: node.x(),
          y: node.y(),
          width: Math.max(50, node.width()),
          height: Math.max(30, node.height()),
          rotation: node.rotation(),
        });
      } else {
        // For other elements, calculate dimensions from scale
        updateElement(id, {
          x: node.x(),
          y: node.y(),
          width: Math.max(5, node.width() * scaleX),
          height: Math.max(5, node.height() * scaleY),
          rotation: node.rotation(),
        });
      }
      saveToHistory('שינוי גודל');
    },
    [updateElement, saveToHistory, elements]
  );

  // Render element based on type
  const renderElement = (element: CanvasElement) => {
    if (!element.isVisible) return null;

    const commonProps = {
      id: element.id,
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
      rotation: element.rotation,
      opacity: element.opacity,
      draggable: !element.isLocked && currentTool === 'select',
      onClick: (e: Konva.KonvaEventObject<MouseEvent>) =>
        handleElementClick(e, element.id),
      onDragMove: (e: Konva.KonvaEventObject<DragEvent>) =>
        handleDragMove(element.id, e),
      onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) =>
        handleDragEnd(element.id, e),
      onTransformEnd: (e: Konva.KonvaEventObject<Event>) =>
        handleTransformEnd(element.id, e),
    };

    switch (element.type) {
      case 'text':
        return <TextNode key={element.id} element={element} {...commonProps} />;
      case 'image':
        return <ImageNode key={element.id} element={element} {...commonProps} />;
      case 'shape':
        return <ShapeNode key={element.id} element={element} {...commonProps} />;
      case 'placeholder':
        return (
          <PlaceholderNode
            key={element.id}
            element={element}
            isSelected={selectedIds.includes(element.id)}
            onSelect={(e: any) => handleElementClick(e, element.id)}
            onDragEnd={(e: any) => handleDragEnd(element.id, e)}
            onTransformEnd={(e: any) => handleTransformEnd(element.id, e)}
          />
        );
      default:
        return null;
    }
  };

  // Render grid
  const renderGrid = () => {
    if (!showGrid) return null;

    const lines = [];
    const strokeColor = '#e0e0e0';

    // Vertical lines
    for (let i = 0; i <= canvasWidth; i += gridSize) {
      lines.push(
        <Line
          key={`v-${i}`}
          points={[i, 0, i, canvasHeight]}
          stroke={strokeColor}
          strokeWidth={0.5}
          listening={false}
        />
      );
    }

    // Horizontal lines
    for (let i = 0; i <= canvasHeight; i += gridSize) {
      lines.push(
        <Line
          key={`h-${i}`}
          points={[0, i, canvasWidth, i]}
          stroke={strokeColor}
          strokeWidth={0.5}
          listening={false}
        />
      );
    }

    return <>{lines}</>;
  };

  // Render smart guides
  const renderSmartGuides = () => {
    const guidesToRender: JSX.Element[] = [];
    
    // תמיד הצג קווי מרכז כשגוררים (עדינים מאוד)
    if (activeGuides.length > 0 || selectedIds.length > 0) {
      // קו מרכז אנכי (חצי רוחב) - קו רציף עדין
      guidesToRender.push(
        <Line
          key="center-vertical-bg"
          points={[canvasWidth / 2, 0, canvasWidth / 2, canvasHeight]}
          stroke="#a78bfa"
          strokeWidth={1}
          opacity={0.2}
          dash={[]}
          listening={false}
        />
      );
      
      // קו מרכז אופקי (חצי גובה) - קו רציף עדין
      guidesToRender.push(
        <Line
          key="center-horizontal-bg"
          points={[0, canvasHeight / 2, canvasWidth, canvasHeight / 2]}
          stroke="#a78bfa"
          strokeWidth={1}
          opacity={0.2}
          dash={[]}
          listening={false}
        />
      );
    }

    // קווי הצמדה פעילים (בולטים יותר - ללא קווים מקווקווים)
    activeGuides.forEach((guide, index) => {
      const isCenterGuide = 
        (guide.type === 'vertical' && Math.abs(guide.position - canvasWidth / 2) < 2) ||
        (guide.type === 'horizontal' && Math.abs(guide.position - canvasHeight / 2) < 2);
      
      guidesToRender.push(
        <Line
          key={`guide-${index}`}
          points={
            guide.type === 'vertical'
              ? [guide.position, 0, guide.position, canvasHeight]
              : [0, guide.position, canvasWidth, guide.position]
          }
          stroke={isCenterGuide ? '#8b5cf6' : '#ec4899'}
          strokeWidth={isCenterGuide ? 2 : 1.5}
          dash={[]}
          opacity={0.8}
          listening={false}
        />
      );
      
      // הוסף עיגול קטן במרכז כאינדיקציה
      if (isCenterGuide) {
        guidesToRender.push(
          <Rect
            key={`center-indicator-${index}`}
            x={canvasWidth / 2 - 4}
            y={canvasHeight / 2 - 4}
            width={8}
            height={8}
            fill="#8b5cf6"
            cornerRadius={4}
            listening={false}
          />
        );
      }
    });

    return guidesToRender.length > 0 ? <>{guidesToRender}</> : null;
  };

  // Selection rectangle handlers
  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (currentTool !== 'select') return;
    if (e.target !== e.target.getStage()) return;

    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;

    setSelectionRect({
      visible: true,
      x1: pos.x,
      y1: pos.y,
      x2: pos.x,
      y2: pos.y,
    });
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!selectionRect.visible) return;

    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;

    setSelectionRect((prev) => ({
      ...prev,
      x2: pos.x,
      y2: pos.y,
    }));
  };

  const handleMouseUp = () => {
    if (!selectionRect.visible) return;

    const { x1, y1, x2, y2 } = selectionRect;
    const selBox = {
      x: Math.min(x1, x2),
      y: Math.min(y1, y2),
      width: Math.abs(x2 - x1),
      height: Math.abs(y2 - y1),
    };

    // Only select if rectangle is larger than a threshold
    if (selBox.width > 5 && selBox.height > 5) {
      const newSelectedIds = elements
        .filter((element) => {
          return (
            element.x >= selBox.x &&
            element.x + element.width <= selBox.x + selBox.width &&
            element.y >= selBox.y &&
            element.y + element.height <= selBox.y + selBox.height &&
            !element.isLocked
          );
        })
        .map((e) => e.id);

      if (newSelectedIds.length > 0) {
        useEditorStore.setState({ selectedIds: newSelectedIds });
      }
    }

    setSelectionRect({
      visible: false,
      x1: 0,
      y1: 0,
      x2: 0,
      y2: 0,
    });
  };

  // Handle image drop from gallery
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    const galleryImageData = e.dataTransfer.getData('application/gallery-image');
    if (!galleryImageData) return;

    try {
      const galleryImage: GalleryImage = JSON.parse(galleryImageData);
      
      // Get drop position relative to canvas
      const rect = e.currentTarget.getBoundingClientRect();
      const dropX = (e.clientX - rect.left - panX) / zoom;
      const dropY = (e.clientY - rect.top - panY) / zoom;

      // Check if dropped on a placeholder
      const placeholderAtPosition = elements.find((el): el is PlaceholderElement => {
        if (el.type !== 'placeholder') return false;
        const placeholder = el as PlaceholderElement;
        return (
          dropX >= placeholder.x &&
          dropX <= placeholder.x + placeholder.width &&
          dropY >= placeholder.y &&
          dropY <= placeholder.y + placeholder.height
        );
      });

      if (placeholderAtPosition) {
        // Assign image to placeholder
        assignImageToPlaceholder(placeholderAtPosition.id, galleryImage);
      } else {
        // Add as regular image element
        const img = new Image();
        img.onload = () => {
          const maxSize = 300;
          let imgWidth = img.width;
          let imgHeight = img.height;
          
          if (imgWidth > maxSize || imgHeight > maxSize) {
            const ratio = Math.min(maxSize / imgWidth, maxSize / imgHeight);
            imgWidth *= ratio;
            imgHeight *= ratio;
          }

          addElement({
            type: 'image',
            name: galleryImage.name,
            src: galleryImage.src,
            originalWidth: img.width,
            originalHeight: img.height,
            x: dropX - imgWidth / 2,
            y: dropY - imgHeight / 2,
            width: imgWidth,
            height: imgHeight,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            opacity: 1,
            zIndex: Date.now(),
            isLocked: false,
            isVisible: true,
            objectFit: 'cover',
          });
        };
        img.src = galleryImage.src;
      }
    } catch (error) {
      console.error('Failed to parse dropped image data:', error);
    }
  }, [elements, zoom, panX, panY, assignImageToPlaceholder, addElement]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  return (
    <div
      className="canvas-container"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      style={{
        width,
        height,
        overflow: 'hidden',
        backgroundColor: '#f5f5f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        scaleX={1}
        scaleY={1}
        x={panX}
        y={panY}
        onClick={handleStageClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <Layer>
          {/* Canvas Background */}
          <Rect
            x={0}
            y={0}
            width={canvasWidth}
            height={canvasHeight}
            fill={backgroundType === 'none' ? 'transparent' : backgroundType === 'solid' ? backgroundColor : undefined}
            fillLinearGradientStartPoint={backgroundType === 'gradient' ? { x: 0, y: 0 } : undefined}
            fillLinearGradientEndPoint={backgroundType === 'gradient' ? {
              x: canvasWidth * Math.cos(gradientColors.angle * Math.PI / 180),
              y: canvasHeight * Math.sin(gradientColors.angle * Math.PI / 180)
            } : undefined}
            fillLinearGradientColorStops={backgroundType === 'gradient' ? [0, gradientColors.start, 1, gradientColors.end] : undefined}
            shadowColor={backgroundType === 'none' ? undefined : "#000000"}
            shadowBlur={backgroundType === 'none' ? 0 : 10}
            shadowOpacity={backgroundType === 'none' ? 0 : 0.1}
            shadowOffsetX={0}
            shadowOffsetY={backgroundType === 'none' ? 0 : 4}
            listening={false}
          />

          {/* Grid */}
          {renderGrid()}

          {/* Elements */}
          <Group>
            {elements
              .sort((a, b) => a.zIndex - b.zIndex)
              .map(renderElement)}
          </Group>

          {/* Transformer - Improved UX/UI */}
          <Transformer
            ref={transformerRef}
            boundBoxFunc={(oldBox, newBox) => {
              // Limit minimum size
              if (newBox.width < 20 || newBox.height < 20) {
                return oldBox;
              }
              
              // Check if selected element is text - keep aspect ratio
              const selectedElement = elements.find(el => selectedIds.includes(el.id));
              if (selectedElement?.type === 'text') {
                // Keep aspect ratio for text
                const aspectRatio = oldBox.width / oldBox.height;
                const newWidth = newBox.width;
                const newHeight = newBox.height;
                
                // Determine which dimension changed more
                const widthDiff = Math.abs(newWidth - oldBox.width);
                const heightDiff = Math.abs(newHeight - oldBox.height);
                
                if (widthDiff > heightDiff) {
                  // Width changed more - adjust height
                  return {
                    ...newBox,
                    height: newWidth / aspectRatio,
                  };
                } else {
                  // Height changed more - adjust width
                  return {
                    ...newBox,
                    width: newHeight * aspectRatio,
                  };
                }
              }
              
              return newBox;
            }}
            rotateEnabled={true}
            enabledAnchors={[
              'top-left',
              'top-right',
              'bottom-left',
              'bottom-right',
            ]}
            // Larger, more visible handles
            anchorSize={14}
            anchorCornerRadius={7}
            // Solid border - no dashes
            borderStroke="#8b5cf6"
            borderStrokeWidth={2}
            borderDash={[]}
            // Purple theme with white fill
            anchorStroke="#8b5cf6"
            anchorStrokeWidth={2}
            anchorFill="#ffffff"
            // Rotation handle
            rotateAnchorOffset={35}
            rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
            rotationSnapTolerance={5}
            // Keep aspect ratio for text elements
            keepRatio={selectedIds.length === 1 && elements.find(el => el.id === selectedIds[0])?.type === 'text'}
            // Padding for easier selection
            padding={2}
          />

          {/* Selection Rectangle */}
          {selectionRect.visible && (
            <Rect
              ref={selectionRectRef}
              x={Math.min(selectionRect.x1, selectionRect.x2)}
              y={Math.min(selectionRect.y1, selectionRect.y2)}
              width={Math.abs(selectionRect.x2 - selectionRect.x1)}
              height={Math.abs(selectionRect.y2 - selectionRect.y1)}
              fill="rgba(99, 102, 241, 0.1)"
              stroke="#6366f1"
              strokeWidth={1}
              listening={false}
            />
          )}

          {/* Smart Guides */}
          {renderSmartGuides()}
        </Layer>
      </Stage>
    </div>
  );
};
