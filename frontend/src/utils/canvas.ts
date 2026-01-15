// ==========================================
// Canvas Utilities - פונקציות עזר לקנבס
// ==========================================

import { CANVAS_SIZES, CanvasSizeKey } from '../config';

/**
 * קבלת גודל קנבס לפי סוג
 */
export const getCanvasSize = (type: CanvasSizeKey) => {
  return CANVAS_SIZES[type];
};

/**
 * חישוב זום אוטומטי לפי גודל מיכל
 */
export const calculateAutoZoom = (
  canvasWidth: number,
  canvasHeight: number,
  containerWidth: number,
  containerHeight: number,
  padding: number = 40
): number => {
  const availableWidth = containerWidth - padding * 2;
  const availableHeight = containerHeight - padding * 2;
  
  const scaleX = availableWidth / canvasWidth;
  const scaleY = availableHeight / canvasHeight;
  
  return Math.min(scaleX, scaleY, 1); // לא יותר מ-100%
};

/**
 * המרת קואורדינטות מסך לקנבס
 */
export const screenToCanvas = (
  screenX: number,
  screenY: number,
  stageX: number,
  stageY: number,
  zoom: number
): { x: number; y: number } => {
  return {
    x: (screenX - stageX) / zoom,
    y: (screenY - stageY) / zoom,
  };
};

/**
 * המרת קואורדינטות קנבס למסך
 */
export const canvasToScreen = (
  canvasX: number,
  canvasY: number,
  stageX: number,
  stageY: number,
  zoom: number
): { x: number; y: number } => {
  return {
    x: canvasX * zoom + stageX,
    y: canvasY * zoom + stageY,
  };
};

/**
 * בדיקה אם נקודה בתוך מלבן
 */
export const isPointInRect = (
  pointX: number,
  pointY: number,
  rectX: number,
  rectY: number,
  rectWidth: number,
  rectHeight: number
): boolean => {
  return (
    pointX >= rectX &&
    pointX <= rectX + rectWidth &&
    pointY >= rectY &&
    pointY <= rectY + rectHeight
  );
};

/**
 * חישוב מרכז של אלמנט
 */
export const getElementCenter = (
  x: number,
  y: number,
  width: number,
  height: number
): { x: number; y: number } => {
  return {
    x: x + width / 2,
    y: y + height / 2,
  };
};

/**
 * Snap to grid
 */
export const snapToGrid = (value: number, gridSize: number): number => {
  return Math.round(value / gridSize) * gridSize;
};

/**
 * יצירת bounding box מאלמנטים מרובים
 */
export const getBoundingBox = (
  elements: Array<{ x: number; y: number; width: number; height: number }>
): { x: number; y: number; width: number; height: number } | null => {
  if (elements.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const el of elements) {
    minX = Math.min(minX, el.x);
    minY = Math.min(minY, el.y);
    maxX = Math.max(maxX, el.x + el.width);
    maxY = Math.max(maxY, el.y + el.height);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
};
