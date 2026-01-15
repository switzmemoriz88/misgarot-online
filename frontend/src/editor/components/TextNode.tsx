// ==========================================
// TextNode Component - טקסט על הקנבס
// ==========================================

import React, { useRef, useState, useEffect } from 'react';
import { Text, Group, Rect } from 'react-konva';
import Konva from 'konva';
import { TextElement } from '../types';
import { useEditorStore } from '../store';

interface TextNodeProps {
  element: TextElement;
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

export const TextNode: React.FC<TextNodeProps> = ({
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
  const zoom = useEditorStore((state) => state.zoom);
  const updateElement = useEditorStore((state) => state.updateElement);
  const textRef = useRef<Konva.Text>(null);
  const [, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Listen for external edit trigger
  useEffect(() => {
    const handleStartEdit = (e: CustomEvent<{ id: string }>) => {
      if (e.detail.id === element.id) {
        startEditing();
      }
    };
    window.addEventListener('startTextEdit', handleStartEdit as EventListener);
    return () => window.removeEventListener('startTextEdit', handleStartEdit as EventListener);
  }, [element.id]);

  const startEditing = () => {
    setIsEditing(true);
    
    const textNode = textRef.current;
    if (!textNode) return;

    const stage = textNode.getStage();
    if (!stage) return;

    // Get the actual zoom from CSS transform (zoom is applied via CSS, not stage scale)
    const currentZoom = zoom || 0.3; // Default to 0.3 if not set
    
    // Create textarea over canvas position
    const stageBox = stage.container().getBoundingClientRect();
    
    // Get actual text height for vertical centering
    const actualTextHeight = textNode.height();
    const textMeasure = textNode.measureSize(element.text);
    const realTextHeight = textMeasure.height || actualTextHeight;
    
    // Calculate vertical offset for middle alignment
    const verticalOffset = (height - realTextHeight) / 2;
    
    // Calculate position - the element position relative to the scaled canvas
    const areaPosition = {
      x: stageBox.left + (x * currentZoom),
      y: stageBox.top + ((y + verticalOffset) * currentZoom),
    };

    // Create and style textarea
    const textarea = document.createElement('textarea');
    textarea.className = 'inline-text-editor';
    textareaRef.current = textarea;
    document.body.appendChild(textarea);

    const scaledFontSize = element.fontSize * currentZoom;
    const scaledWidth = width * currentZoom;

    textarea.value = element.text;
    textarea.style.position = 'fixed';
    textarea.style.top = `${areaPosition.y}px`;
    textarea.style.left = `${areaPosition.x}px`;
    textarea.style.width = `${Math.max(scaledWidth, 100)}px`;
    textarea.style.height = 'auto';
    textarea.style.minHeight = `${Math.max(scaledFontSize * 1.5, 30)}px`;
    textarea.style.fontSize = `${Math.max(scaledFontSize, 12)}px`;
    textarea.style.fontFamily = element.fontFamily;
    textarea.style.fontWeight = String(element.fontWeight);
    textarea.style.fontStyle = element.fontStyle;
    textarea.style.textAlign = element.textAlign;
    textarea.style.color = element.fill;
    textarea.style.border = 'none';
    textarea.style.borderRadius = '0';
    textarea.style.padding = '0';
    textarea.style.margin = '0';
    textarea.style.overflow = 'hidden';
    textarea.style.background = 'transparent';
    textarea.style.outline = 'none';
    textarea.style.resize = 'none';
    textarea.style.lineHeight = String(element.lineHeight);
    textarea.style.transformOrigin = 'left top';
    textarea.style.transform = `rotate(${rotation}deg)`;
    textarea.style.direction = element.direction || 'rtl';
    textarea.style.zIndex = '10000';
    textarea.style.boxShadow = 'none';
    textarea.style.caretColor = '#8b5cf6'; // סמן סגול
    
    // Hide text temporarily (after positioning calculated)
    textNode.hide();
    stage.batchDraw();

    // Auto-resize on input
    const autoResize = () => {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
      
      // Update canvas in real-time
      window.dispatchEvent(
        new CustomEvent('textUpdate', {
          detail: { id: element.id, text: textarea.value },
        })
      );
    };
    textarea.addEventListener('input', autoResize);

    textarea.focus();
    textarea.select();

    // Handle blur
    const handleBlur = () => {
      const newText = textarea.value;
      textarea.remove();
      textareaRef.current = null;
      textNode.show();
      stage.batchDraw();
      setIsEditing(false);

      // Final update
      if (newText !== element.text) {
        window.dispatchEvent(
          new CustomEvent('textUpdate', {
            detail: { id: element.id, text: newText },
          })
        );
      }
    };

    textarea.addEventListener('blur', handleBlur);

    // Handle escape and enter
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        // Restore original text
        window.dispatchEvent(
          new CustomEvent('textUpdate', {
            detail: { id: element.id, text: element.text },
          })
        );
        textarea.blur();
      }
      // Allow Enter for new lines (Shift+Enter works too)
      // Only close on Ctrl+Enter or Cmd+Enter
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        textarea.blur();
      }
    });
  };

  // Handle double click for inline editing
  const handleDblClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    startEditing();
  };

  // Get text decoration
  const getTextDecoration = () => {
    if (!element.textDecoration || element.textDecoration === 'none') {
      return undefined;
    }
    return element.textDecoration;
  };

  // Track initial values when transform starts
  const transformStartRef = useRef({
    fontSize: element.fontSize,
    width: width,
    height: height,
  });
  
  // Smooth scaling - let Konva handle visuals, we calculate in onTransformEnd
  const handleTransform = () => {
    // Don't interfere with Konva's transform - just let it scale visually
    // We'll fix everything in onTransformEnd
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
      onTransformStart={() => {
        // Save initial values when transform starts
        transformStartRef.current = {
          fontSize: element.fontSize,
          width: element.width,
          height: element.height,
        };
      }}
      onTransform={handleTransform}
      onTransformEnd={(e) => {
        const node = e.target;
        const textNode = textRef.current;
        
        // Get scale values
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        const scale = (scaleX + scaleY) / 2;
        
        // Calculate final values from START values
        const startValues = transformStartRef.current;
        const newFontSize = Math.max(12, Math.min(400, Math.round(startValues.fontSize * scale)));
        const newWidth = Math.max(80, Math.round(startValues.width * scale));
        const newHeight = Math.max(40, Math.round(startValues.height * scale));
        
        // Reset scales
        node.scaleX(1);
        node.scaleY(1);
        node.width(newWidth);
        node.height(newHeight);
        
        if (textNode) {
          textNode.scaleX(1);
          textNode.scaleY(1);
          textNode.fontSize(newFontSize);
          textNode.width(newWidth);
          textNode.height(newHeight);
        }
        
        // Update the store with final values
        updateElement(element.id, {
          fontSize: newFontSize,
          width: newWidth,
          height: newHeight,
        });
        
        // Let Canvas handle the transform end
        onTransformEnd(e);
      }}
      onDblClick={handleDblClick}
    >
      {/* Background for text (if needed for selection) */}
      <Rect
        width={width}
        height={height}
        fill="transparent"
      />
      
      {/* Stroke layer - rendered FIRST (behind fill) for outer stroke effect */}
      {element.strokeWidth && element.strokeWidth > 0 && element.stroke && (
        <Text
          text={element.text}
          fontSize={element.fontSize}
          fontFamily={element.fontFamily}
          fontStyle={`${element.fontStyle} ${element.fontWeight}`}
          fill="transparent"
          stroke={element.stroke}
          strokeWidth={(element.strokeWidth || 0) * 2}
          width={width}
          height={height}
          align={element.textAlign}
          verticalAlign="middle"
          lineHeight={element.lineHeight}
          letterSpacing={element.letterSpacing}
          textDecoration={getTextDecoration()}
          wrap="word"
          ellipsis={false}
        />
      )}
      
      {/* Text fill layer - rendered SECOND (on top) */}
      <Text
        ref={textRef}
        text={element.text}
        fontSize={element.fontSize}
        fontFamily={element.fontFamily}
        fontStyle={`${element.fontStyle} ${element.fontWeight}`}
        fill={element.fill}
        width={width}
        height={height}
        align={element.textAlign}
        verticalAlign="middle"
        lineHeight={element.lineHeight}
        letterSpacing={element.letterSpacing}
        textDecoration={getTextDecoration()}
        wrap="word"
        ellipsis={false}
        shadowEnabled={element.shadow?.enabled || false}
        shadowColor={element.shadow?.color || '#000000'}
        shadowBlur={element.shadow?.blur || 0}
        shadowOffsetX={element.shadow?.offsetX || 0}
        shadowOffsetY={element.shadow?.offsetY || 0}
      />
    </Group>
  );
};
