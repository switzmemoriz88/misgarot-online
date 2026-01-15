// ==========================================
// Smart Guides Hook - קווי עזר חכמים
// מאפשר יישור אוטומטי לאלמנטים אחרים ולמרכז הקנבס
// ==========================================

import { useState, useCallback, useMemo } from 'react';
import { CanvasElement } from '../types';

export interface Guide {
  type: 'vertical' | 'horizontal';
  position: number;
  snapPoints: { x: number; y: number }[];
}

export interface SnapResult {
  x: number;
  y: number;
  guides: Guide[];
}

interface UseSmartGuidesOptions {
  elements: CanvasElement[];
  canvasWidth: number;
  canvasHeight: number;
  threshold?: number; // מרחק הצמדה בפיקסלים
  enabled?: boolean;
}

export const useSmartGuides = ({
  elements,
  canvasWidth,
  canvasHeight,
  threshold = 5,
  enabled = true,
}: UseSmartGuidesOptions) => {
  const [guides, setGuides] = useState<Guide[]>([]);

  // חישוב כל נקודות העזר מהאלמנטים הקיימים
  const snapPoints = useMemo(() => {
    if (!enabled) return { vertical: [], horizontal: [] };

    const vertical: number[] = [];
    const horizontal: number[] = [];

    // הוספת מרכז הקנבס
    vertical.push(canvasWidth / 2);
    horizontal.push(canvasHeight / 2);

    // הוספת קצוות הקנבס
    vertical.push(0, canvasWidth);
    horizontal.push(0, canvasHeight);

    // הוספת נקודות מכל אלמנט
    elements.forEach((el) => {
      if (!el.isVisible || el.isLocked) return;

      // קצה שמאלי, מרכז, קצה ימני
      vertical.push(el.x);
      vertical.push(el.x + el.width / 2);
      vertical.push(el.x + el.width);

      // קצה עליון, מרכז, קצה תחתון
      horizontal.push(el.y);
      horizontal.push(el.y + el.height / 2);
      horizontal.push(el.y + el.height);
    });

    // הסרת כפילויות
    return {
      vertical: [...new Set(vertical)],
      horizontal: [...new Set(horizontal)],
    };
  }, [elements, canvasWidth, canvasHeight, enabled]);

  // חישוב הצמדה לאלמנט שנגרר
  const calculateSnap = useCallback(
    (
      draggedId: string,
      x: number,
      y: number,
      width: number,
      height: number
    ): SnapResult => {
      if (!enabled) {
        return { x, y, guides: [] };
      }

      const activeGuides: Guide[] = [];
      let snappedX = x;
      let snappedY = y;

      // נקודות הבדיקה של האלמנט הנגרר
      const dragPoints = {
        left: x,
        centerX: x + width / 2,
        right: x + width,
        top: y,
        centerY: y + height / 2,
        bottom: y + height,
      };

      // סינון נקודות של האלמנט הנוכחי
      const filteredVertical = snapPoints.vertical.filter((point) => {
        const element = elements.find((el) => el.id === draggedId);
        if (!element) return true;
        return !(
          Math.abs(point - element.x) < 1 ||
          Math.abs(point - (element.x + element.width / 2)) < 1 ||
          Math.abs(point - (element.x + element.width)) < 1
        );
      });

      const filteredHorizontal = snapPoints.horizontal.filter((point) => {
        const element = elements.find((el) => el.id === draggedId);
        if (!element) return true;
        return !(
          Math.abs(point - element.y) < 1 ||
          Math.abs(point - (element.y + element.height / 2)) < 1 ||
          Math.abs(point - (element.y + element.height)) < 1
        );
      });

      // בדיקת הצמדה אופקית (X)
      let bestVerticalSnap: { position: number; offset: number; diff: number } | null = null;

      for (const point of filteredVertical) {
        // threshold גדול יותר למרכז הקנבס
        const isCenterX = Math.abs(point - canvasWidth / 2) < 1;
        const currentThreshold = isCenterX ? threshold * 2 : threshold;
        
        // בדיקת קצה שמאלי
        const leftDiff = Math.abs(dragPoints.left - point);
        if (leftDiff < currentThreshold) {
          if (!bestVerticalSnap || leftDiff < bestVerticalSnap.diff) {
            bestVerticalSnap = { position: point, offset: 0, diff: leftDiff };
          }
        }

        // בדיקת מרכז - עדיפות גבוהה יותר למרכז הקנבס
        const centerDiff = Math.abs(dragPoints.centerX - point);
        if (centerDiff < currentThreshold) {
          // אם זה מרכז הקנבס, תן לו עדיפות
          const priorityDiff = isCenterX ? centerDiff * 0.5 : centerDiff;
          if (!bestVerticalSnap || priorityDiff < bestVerticalSnap.diff) {
            bestVerticalSnap = { position: point, offset: width / 2, diff: priorityDiff };
          }
        }

        // בדיקת קצה ימני
        const rightDiff = Math.abs(dragPoints.right - point);
        if (rightDiff < currentThreshold) {
          if (!bestVerticalSnap || rightDiff < bestVerticalSnap.diff) {
            bestVerticalSnap = { position: point, offset: width, diff: rightDiff };
          }
        }
      }

      if (bestVerticalSnap) {
        snappedX = bestVerticalSnap.position - bestVerticalSnap.offset;
        activeGuides.push({
          type: 'vertical',
          position: bestVerticalSnap.position,
          snapPoints: [{ x: bestVerticalSnap.position, y: 0 }],
        });
      }

      // בדיקת הצמדה אנכית (Y)
      let bestHorizontalSnap: { position: number; offset: number; diff: number } | null = null;

      for (const point of filteredHorizontal) {
        // threshold גדול יותר למרכז הקנבס
        const isCenterY = Math.abs(point - canvasHeight / 2) < 1;
        const currentThreshold = isCenterY ? threshold * 2 : threshold;
        
        // בדיקת קצה עליון
        const topDiff = Math.abs(dragPoints.top - point);
        if (topDiff < currentThreshold) {
          if (!bestHorizontalSnap || topDiff < bestHorizontalSnap.diff) {
            bestHorizontalSnap = { position: point, offset: 0, diff: topDiff };
          }
        }

        // בדיקת מרכז - עדיפות גבוהה יותר למרכז הקנבס
        const centerDiff = Math.abs(dragPoints.centerY - point);
        if (centerDiff < currentThreshold) {
          // אם זה מרכז הקנבס, תן לו עדיפות
          const priorityDiff = isCenterY ? centerDiff * 0.5 : centerDiff;
          if (!bestHorizontalSnap || priorityDiff < bestHorizontalSnap.diff) {
            bestHorizontalSnap = { position: point, offset: height / 2, diff: priorityDiff };
          }
        }

        // בדיקת קצה תחתון
        const bottomDiff = Math.abs(dragPoints.bottom - point);
        if (bottomDiff < currentThreshold) {
          if (!bestHorizontalSnap || bottomDiff < bestHorizontalSnap.diff) {
            bestHorizontalSnap = { position: point, offset: height, diff: bottomDiff };
          }
        }
      }

      if (bestHorizontalSnap) {
        snappedY = bestHorizontalSnap.position - bestHorizontalSnap.offset;
        activeGuides.push({
          type: 'horizontal',
          position: bestHorizontalSnap.position,
          snapPoints: [{ x: 0, y: bestHorizontalSnap.position }],
        });
      }

      return {
        x: snappedX,
        y: snappedY,
        guides: activeGuides,
      };
    },
    [elements, snapPoints, threshold, enabled]
  );

  // עדכון קווי העזר המוצגים
  const updateGuides = useCallback((newGuides: Guide[]) => {
    setGuides(newGuides);
  }, []);

  // ניקוי קווי העזר
  const clearGuides = useCallback(() => {
    setGuides([]);
  }, []);

  return {
    guides,
    calculateSnap,
    updateGuides,
    clearGuides,
  };
};

// ==========================================
// Utility Functions
// ==========================================

// חישוב מרחק בין נקודות
export const distance = (x1: number, y1: number, x2: number, y2: number): number => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

// חישוב זווית יישור (לסיבוב עם snap)
export const snapAngle = (angle: number, snapDegrees: number = 15): number => {
  const normalized = ((angle % 360) + 360) % 360;
  const snapped = Math.round(normalized / snapDegrees) * snapDegrees;
  return snapped;
};

// בדיקה אם שתי צורות מיושרות
export const areAligned = (
  rect1: { x: number; y: number; width: number; height: number },
  rect2: { x: number; y: number; width: number; height: number },
  threshold: number = 5
): { horizontal: boolean; vertical: boolean } => {
  const rect1Center = {
    x: rect1.x + rect1.width / 2,
    y: rect1.y + rect1.height / 2,
  };
  const rect2Center = {
    x: rect2.x + rect2.width / 2,
    y: rect2.y + rect2.height / 2,
  };

  return {
    horizontal: Math.abs(rect1Center.y - rect2Center.y) < threshold,
    vertical: Math.abs(rect1Center.x - rect2Center.x) < threshold,
  };
};
