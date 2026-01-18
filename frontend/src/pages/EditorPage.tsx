import React, { useRef, useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Canvas } from '../editor/Canvas';
import { Toolbar, PropertiesPanel, LayersPanel } from '../editor/components';
import { TemplatesPanel } from '../editor/components/TemplatesPanel';
import { ExportModal } from '../editor/components/ExportModal';
import { SaveAsTemplateModal } from '../editor/components/SaveAsTemplateModal';
import { PreviewModal } from '../editor/components/PreviewModal';
import { PublishFrameModal, PublishFrameData } from '../editor/components/PublishFrameModal';
import { TextToolbar } from '../editor/components/TextToolbar';
import { FinishDesignModal } from '../editor/components/FinishDesignModal';
import { OrderModal } from '../editor/components/OrderModal';
import { useKeyboardShortcuts } from '../editor/useKeyboardShortcuts';
import { useAutoSave } from '../editor/hooks/useAutoSave';
import { useCustomTemplates } from '../editor/hooks/useCustomTemplates';
import { useEditorStore } from '../editor/store';
import { useDesignSession } from '../hooks';
import { CANVAS_SIZES, AUTO_SAVE_CONFIG } from '../config';
import { useAuthContext } from '../contexts';
import { UserMenu } from '../components';
import { getSupabase } from '../lib/supabase/client';
import { changeLanguage } from '../i18n';
import { TextElement } from '../editor/types';

// זיהוי סוג העורך (רוחב/אורך)
type EditorMode = 'landscape' | 'portrait' | 'custom';

const EditorPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { templateId } = useParams<{ templateId?: string; designId?: string }>();
  
  // Check if loading from Supabase
  const frameIdFromUrl = searchParams.get('frameId');
  const sourceFromUrl = searchParams.get('source');
  const orderIdFromUrl = searchParams.get('orderId');
  const isAdminEdit = searchParams.get('adminEdit') === 'true';
  
  // זיהוי מצב העורך לפי הנתיב
  const getEditorMode = (): EditorMode => {
    // Check for both /landscape/ (with ID) and /landscape (without ID, using query params)
    if (location.pathname.includes('/landscape')) return 'landscape';
    if (location.pathname.includes('/portrait')) return 'portrait';
    return 'custom';
  };
  
  const editorMode = getEditorMode();
  
  // Redirect to categories if entering /editor directly without a frame
  useEffect(() => {
    if (editorMode === 'custom' && !templateId && !frameIdFromUrl) {
      navigate('/categories', { replace: true });
    }
  }, [editorMode, templateId, frameIdFromUrl, navigate]);
  
  const stageRef = useRef<any>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showSaveAsTemplate, setShowSaveAsTemplate] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  const [showPublishFrame, setShowPublishFrame] = useState(false);
  const [showFinishDesign, setShowFinishDesign] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [lastSaveDisplay, setLastSaveDisplay] = useState<string>('');
  const [_designSaved, setDesignSaved] = useState(false);
  const [landscapePreview, setLandscapePreview] = useState<string>('');
  const [portraitPreview, setPortraitPreview] = useState<string>('');
  const [orderThumbnail, setOrderThumbnail] = useState<string>('');
  // Track if current frame is single-orientation only (no paired frame)
  const [isSingleOrientationFrame, setIsSingleOrientationFrame] = useState(false);
  // const [leftPanelTab, setLeftPanelTab] = useState<LeftPanelTab>('layers');
  
  // Auth context - for admin check
  const { isAdmin } = useAuthContext();
  
  // Translation for language toggle
  const { i18n } = useTranslation();
  
  const toggleLanguage = () => {
    const newLang = i18n.language === 'he' ? 'en' : 'he';
    changeLanguage(newLang);
  };

  // Initialize keyboard shortcuts
  useKeyboardShortcuts();

  // Custom templates
  const { addTemplate } = useCustomTemplates();

  // Design session - for passing style between landscape and portrait
  const { 
    saveLandscapeDesign, 
    savePortraitDesign,
    getLandscapeDesign, 
    getPortraitDesign,
    calculatePortraitFromLandscape,
    clearSession,
  } = useDesignSession();

  // Auto-save functionality
  const { save, restore, hasSavedData, getSavedInfo, clear } = useAutoSave({
    interval: AUTO_SAVE_CONFIG.interval,
    onSave: () => {
      setLastSaveDisplay(new Date().toLocaleTimeString('he-IL'));
      setDesignSaved(true);
    },
  });

  // Check for saved data on mount (skip for admin edit mode and Supabase frames)
  // DISABLED: This prompt is confusing when switching between modes
  // The session management handles state properly between landscape/portrait
  useEffect(() => {
    // Always skip restore prompt - it causes confusion
    // The design session handles state between landscape/portrait modes
    console.log('⏭️ Restore prompt disabled - using session management instead');
    return;
    
    /* Original code - disabled
    console.log('🔍 Restore prompt check:', { isAdminEdit, sourceFromUrl, templateId, frameIdFromUrl });
    
    // Skip restore prompt when admin is editing an existing frame
    if (isAdminEdit) {
      console.log('⏭️ Skipping restore prompt - admin edit');
      return;
    }
    
    // Skip restore prompt when loading a frame from Supabase (gallery selection)
    if (sourceFromUrl === 'supabase') {
      console.log('⏭️ Skipping restore prompt - loading from Supabase');
      return;
    }
    
    // Skip restore prompt when switching between landscape/portrait modes
    // (templateId indicates we're in a design session)
    if (templateId) {
      console.log('⏭️ Skipping restore prompt - in design session, templateId:', templateId);
      return;
    }
    
    // Skip if URL has frameId (coming from gallery or switching modes)
    if (frameIdFromUrl) {
      console.log('⏭️ Skipping restore prompt - has frameId');
      return;
    }
    
    console.log('⚠️ Showing restore prompt - no skip conditions met');
    if (hasSavedData()) {
      const info = getSavedInfo();
      if (info && info.elementCount > 0) {
        setShowRestorePrompt(true);
      }
    }
    */
  }, [hasSavedData, getSavedInfo, isAdminEdit, sourceFromUrl, templateId, frameIdFromUrl]);

  // Listen for Ctrl+S save event
  useEffect(() => {
    const handleSaveEvent = () => {
      save();
    };
    window.addEventListener('editor-save', handleSaveEvent);
    return () => window.removeEventListener('editor-save', handleSaveEvent);
  }, [save]);

  const { canvasWidth, canvasHeight, zoom, setZoom, elements, backgroundColor, backgroundType, gradientColors, setCanvasSize, setBackgroundType, addElement, clearCanvas, selectedIds, deleteElement, updateElement, selectElement } = useEditorStore();

  // Text toolbar state
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [textToolbarPosition, setTextToolbarPosition] = useState<{ x: number; y: number } | null>(null);
  
  // Find selected text element
  const selectedTextElement = React.useMemo(() => {
    if (selectedIds.length !== 1) return null;
    const selectedElement = elements.find(el => el.id === selectedIds[0]);
    return selectedElement?.type === 'text' ? selectedElement as TextElement : null;
  }, [selectedIds, elements]);

  // Find any selected element (for ElementActions)
  const selectedElement = React.useMemo(() => {
    if (selectedIds.length !== 1) return null;
    return elements.find(el => el.id === selectedIds[0]) || null;
  }, [selectedIds, elements]);

  // Since canvas is now full size (2500x1875), we need smaller zoom
  const [autoZoom, setAutoZoom] = useState(0.3);
  
  // Rotation drag state
  const [isRotating, setIsRotating] = useState(false);
  const [rotationStart, setRotationStart] = useState({ angle: 0, mouseAngle: 0 });
  const canvasFrameRef = useRef<HTMLDivElement>(null);

  // Calculate text toolbar position when text element is selected
  useEffect(() => {
    if (!selectedTextElement || !canvasContainerRef.current) {
      setTextToolbarPosition(null);
      return;
    }
    
    const updatePosition = () => {
      if (!canvasContainerRef.current) return;
      
      const containerRect = canvasContainerRef.current.getBoundingClientRect();
      const currentZoom = zoom || autoZoom;
      
      // Calculate element position in viewport coordinates
      const elementX = selectedTextElement.x * currentZoom;
      const elementY = selectedTextElement.y * currentZoom;
      const elementWidth = (selectedTextElement.width || 200) * currentZoom;
      
      // Position toolbar above the element, centered horizontally
      const toolbarX = containerRect.left + elementX + elementWidth / 2;
      const toolbarY = containerRect.top + elementY - 10; // 10px above the element
      
      setTextToolbarPosition({ x: toolbarX, y: toolbarY });
    };
    
    updatePosition();
    
    // Update on scroll
    const handleScroll = () => updatePosition();
    window.addEventListener('scroll', handleScroll, true);
    
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [selectedTextElement, zoom, autoZoom]);
  
  useEffect(() => {
    const calculateAutoZoom = () => {
      if (!containerRef.current) return;
      
      const containerWidth = containerRef.current.clientWidth - 60; // padding
      const containerHeight = containerRef.current.clientHeight - 100; // padding + zoom controls + label
      
      if (containerWidth <= 0 || containerHeight <= 0) return;
      
      const zoomX = containerWidth / canvasWidth;
      const zoomY = containerHeight / canvasHeight;
      
      // Take the smaller zoom to fit both dimensions
      const newZoom = Math.min(zoomX, zoomY) * 0.95; // 95% for minimal breathing room
      const clampedZoom = Math.max(0.15, Math.min(1, newZoom)); // Between 15% and 100%
      
      setAutoZoom(clampedZoom);
      
      // Always set zoom on calculation (not just when zoom === 1)
      setZoom(clampedZoom);
    };
    
    // Calculate on mount with a small delay to ensure container is rendered
    const timer = setTimeout(calculateAutoZoom, 100);
    
    window.addEventListener('resize', calculateAutoZoom);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', calculateAutoZoom);
    };
  }, [canvasWidth, canvasHeight, zoom, setZoom]);

  // Calculate autoZoom also when elements change (e.g., frame added)
  useEffect(() => {
    const calculateAutoZoom = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.clientWidth - 60;
      const containerHeight = containerRef.current.clientHeight - 100;
      if (containerWidth <= 0 || containerHeight <= 0) return;
      const zoomX = containerWidth / canvasWidth;
      const zoomY = containerHeight / canvasHeight;
      const newZoom = Math.min(zoomX, zoomY) * 0.95;
      const clampedZoom = Math.max(0.15, Math.min(1, newZoom));
      setAutoZoom(clampedZoom);
      setZoom(clampedZoom);
    };
    calculateAutoZoom();
  }, [elements, canvasWidth, canvasHeight]);

  // Rotation drag handler
  useEffect(() => {
    if (!isRotating || !selectedElement) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasFrameRef.current) return;
      
      // Get element center in screen coordinates
      const rect = canvasFrameRef.current.getBoundingClientRect();
      const currentZoom = zoom || autoZoom;
      const elementCenterX = rect.left + (selectedElement.x + (selectedElement.width || 100) / 2) * currentZoom;
      const elementCenterY = rect.top + (selectedElement.y + (selectedElement.height || 100) / 2) * currentZoom;
      
      // Calculate angle from center to mouse
      const dx = e.clientX - elementCenterX;
      const dy = e.clientY - elementCenterY;
      const mouseAngle = Math.atan2(dy, dx) * (180 / Math.PI);
      
      // Calculate new rotation
      const angleDiff = mouseAngle - rotationStart.mouseAngle;
      let newRotation = rotationStart.angle + angleDiff;
      
      // Normalize to 0-360
      while (newRotation < 0) newRotation += 360;
      while (newRotation >= 360) newRotation -= 360;
      
      // Snap to common angles (0, 45, 90, etc.) when close
      const snapAngles = [0, 45, 90, 135, 180, 225, 270, 315];
      for (const snap of snapAngles) {
        if (Math.abs(newRotation - snap) < 5) {
          newRotation = snap;
          break;
        }
      }
      
      updateElement(selectedElement.id, { rotation: Math.round(newRotation) });
    };

    const handleMouseUp = () => {
      setIsRotating(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isRotating, selectedElement, rotationStart, zoom, autoZoom, updateElement]);

  // Load frame template when entering editor
  useEffect(() => {
    // Skip if loading from Supabase - let the Supabase effect handle it
    if (sourceFromUrl === 'supabase') {
      console.log('⏭️ Skipping session load - will load from Supabase');
      // Clear any old session data to avoid conflicts
      clearSession();
      clearCanvas();
      clear(); // Clear AutoSave data too
      if (editorMode === 'landscape') {
        setCanvasSize(CANVAS_SIZES.landscape.width, CANVAS_SIZES.landscape.height);
        console.log('📐 Set canvas to LANDSCAPE:', CANVAS_SIZES.landscape.width, 'x', CANVAS_SIZES.landscape.height);
      } else if (editorMode === 'portrait') {
        setCanvasSize(CANVAS_SIZES.portrait.width, CANVAS_SIZES.portrait.height);
        console.log('📐 Set canvas to PORTRAIT:', CANVAS_SIZES.portrait.width, 'x', CANVAS_SIZES.portrait.height);
      }
      setBackgroundType('none');
      return;
    }
    
    // NEW DESIGN: Clear canvas when starting from scratch (templateId === 'new')
    if (templateId === 'new') {
      console.log('🆕 Starting new design from scratch - clearing canvas');
      clearSession();
      clearCanvas();
      clear(); // Clear AutoSave data too
      if (editorMode === 'landscape') {
        setCanvasSize(CANVAS_SIZES.landscape.width, CANVAS_SIZES.landscape.height);
      } else if (editorMode === 'portrait') {
        setCanvasSize(CANVAS_SIZES.portrait.width, CANVAS_SIZES.portrait.height);
      }
      setBackgroundType('none');
      return;
    }
    
    if (editorMode === 'landscape') {
      setCanvasSize(CANVAS_SIZES.landscape.width, CANVAS_SIZES.landscape.height);
      setBackgroundType('none');
      
      // Try to load saved landscape design first
      const savedLandscape = getLandscapeDesign();
      
      if (savedLandscape && savedLandscape.elements.length > 0) {
        console.log('🔄 Loading saved landscape design with', savedLandscape.elements.length, 'elements');
        
        // Clear canvas and load saved design
        clearCanvas();
        
        // Set background from saved style
        if (savedLandscape.style) {
          if (savedLandscape.style.backgroundType) {
            setBackgroundType(savedLandscape.style.backgroundType);
          }
          if (savedLandscape.style.backgroundColor) {
            useEditorStore.getState().setBackgroundColor(savedLandscape.style.backgroundColor);
          }
          if (savedLandscape.style.gradientStart && savedLandscape.style.gradientEnd) {
            useEditorStore.getState().setGradientColors({
              start: savedLandscape.style.gradientStart,
              end: savedLandscape.style.gradientEnd,
              angle: savedLandscape.style.gradientAngle || 45,
            });
          }
        }
        
        // Add all saved elements
        savedLandscape.elements.forEach((el: any) => {
          addElement(el);
        });
        
        return; // Don't load from template
      }
      
      // No saved design - template will be loaded by Supabase effect
    } else if (editorMode === 'portrait') {
      setCanvasSize(CANVAS_SIZES.portrait.width, CANVAS_SIZES.portrait.height);
      setBackgroundType('none');
      
      // Load portrait frame from Supabase and elements
      const loadPortraitMode = async () => {
        // Clear canvas first
        clearCanvas();
        
        // Determine which frame ID to use
        const frameId = frameIdFromUrl || templateId;
        
        // Try to load portrait frame from Supabase (this is the locked frame)
        const supabase = getSupabase();
        if (supabase && frameId && frameId !== 'new') {
          try {
            // First try to get the paired portrait frame
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: landscapeFrame } = await (supabase as any)
              .from('frames')
              .select('paired_frame_id, design_portrait')
              .eq('id', frameId)
              .single();
            
            let portraitFrameData = null;
            
            // If landscape has a paired portrait, load the portrait frame
            if (landscapeFrame?.paired_frame_id) {
              console.log('📥 Loading paired portrait frame:', landscapeFrame.paired_frame_id);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const { data: portraitFrame } = await (supabase as any)
                .from('frames')
                .select('design_data')
                .eq('id', landscapeFrame.paired_frame_id)
                .single();
              
              if (portraitFrame?.design_data) {
                portraitFrameData = portraitFrame.design_data;
              }
            } else if (landscapeFrame?.design_portrait) {
              // Fallback to design_portrait field
              portraitFrameData = landscapeFrame.design_portrait;
            }
            
            if (portraitFrameData && portraitFrameData.elements && Array.isArray(portraitFrameData.elements)) {
              console.log('📥 Loading portrait frame elements');
              
              // Set background from portrait design
              if (portraitFrameData.backgroundType) {
                setBackgroundType(portraitFrameData.backgroundType);
              }
              if (portraitFrameData.backgroundColor) {
                useEditorStore.getState().setBackgroundColor(portraitFrameData.backgroundColor);
              }
              if (portraitFrameData.gradientColors) {
                useEditorStore.getState().setGradientColors(portraitFrameData.gradientColors);
              }
              
              // Add portrait frame elements - ONLY the locked ones (the frame itself)
              const lockedElements = portraitFrameData.elements.filter((el: any) => el.isLocked);
              lockedElements.forEach((el: any) => {
                addElement({
                  ...el,
                  isLocked: true, // Ensure frame elements are locked
                });
              });
              console.log(`🔒 Loaded ${lockedElements.length} locked frame elements for portrait`);
            }
          } catch (err) {
            console.log('No portrait frame found, continuing without');
          }
        }
        
        // Now load user elements - either saved portrait or calculated from landscape
        const savedPortrait = getPortraitDesign();
        
        if (savedPortrait && savedPortrait.elements.length > 0) {
          // Load saved portrait elements
          // Check if we have locked frame elements (from paired portrait frame)
          const lockedFrameElements = savedPortrait.elements.filter((el: any) => el.isLocked);
          const userElements = savedPortrait.elements.filter((el: any) => !el.isLocked);
          
          console.log('📦 Loading saved portrait design:');
          console.log(`   - Locked frame elements: ${lockedFrameElements.length}`);
          console.log(`   - User elements: ${userElements.length}`);
          
          // Set style from saved portrait
          if (savedPortrait.style?.backgroundType) {
            setBackgroundType(savedPortrait.style.backgroundType);
          }
          if (savedPortrait.style?.backgroundColor) {
            useEditorStore.getState().setBackgroundColor(savedPortrait.style.backgroundColor);
          }
          if (savedPortrait.style?.gradientStart && savedPortrait.style?.gradientEnd) {
            useEditorStore.getState().setGradientColors({
              start: savedPortrait.style.gradientStart,
              end: savedPortrait.style.gradientEnd,
            });
          }
          
          // Add locked frame elements first (if not already added from Supabase)
          const currentElements = useEditorStore.getState().elements;
          const hasLockedElements = currentElements.some((el: any) => el.isLocked);
          
          if (!hasLockedElements && lockedFrameElements.length > 0) {
            lockedFrameElements.forEach((el: any) => {
              addElement({
                ...el,
                isLocked: true,
              });
            });
            console.log(`🔒 Added ${lockedFrameElements.length} locked frame elements from session`);
          }
          
          // Add user elements
          userElements.forEach((el: any) => {
            addElement(el);
          });
        }
        // If no saved portrait, elements were already calculated in handleContinueToPortrait
        // and saved to portrait storage, so we should have them
      };
      
      loadPortraitMode();
    }
  }, [templateId, editorMode, setCanvasSize, setBackgroundType, addElement, clearCanvas, getPortraitDesign, sourceFromUrl, getLandscapeDesign, clearSession, clear]);

  // Load frame from Supabase if source=supabase
  // This is for CUSTOMERS selecting a frame to customize
  // Loads BOTH landscape and portrait versions for dual-mode editing
  useEffect(() => {
    const loadSupabaseFrame = async () => {
      if (sourceFromUrl !== 'supabase' || !frameIdFromUrl) return;
      
      const supabase = getSupabase();
      if (!supabase) return;
      
      try {
        console.log('📥 Loading frame from Supabase:', frameIdFromUrl);
        console.log('📥 Current editor mode:', editorMode);
        
        // Load the selected frame
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let { data: frame, error } = await (supabase as any)
          .from('frames')
          .select('*')
          .eq('id', frameIdFromUrl)
          .single();
        
        if (error) {
          console.error('Error loading frame:', error);
          return;
        }
        
        console.log('✅ Initial frame loaded:', frame.name);
        console.log('   - DB orientation:', frame.orientation);
        console.log('   - Has paired_frame_id:', frame.paired_frame_id || 'none');
        
        // IMPORTANT: If frame doesn't have a paired version for the current mode,
        // redirect to the mode that matches the frame's orientation
        if (!frame.paired_frame_id) {
          // Mark this as a single-orientation frame (no mode switching allowed)
          setIsSingleOrientationFrame(true);
          console.log('⚠️ This is a single-orientation frame - mode switching disabled');
          
          const correctMode = frame.orientation === 'portrait' ? 'portrait' : 'landscape';
          if (editorMode !== correctMode) {
            console.log(`🔄 Frame is ${frame.orientation}-only, redirecting to ${correctMode} mode...`);
            // Keep the same query params so this useEffect runs again after redirect
            navigate(`/editor/${correctMode}?frameId=${frameIdFromUrl}&source=supabase`, { replace: true });
            return;
          }
        } else {
          // Has paired frame - mode switching is allowed
          setIsSingleOrientationFrame(false);
        }
        
        // IMPORTANT: If we're in landscape mode but loaded a portrait frame,
        // we need to load its paired landscape frame instead
        if (editorMode === 'landscape' && frame.orientation === 'portrait' && frame.paired_frame_id) {
          console.log('🔄 Switching to paired landscape frame...');
          const { data: landscapeFrame, error: lsError } = await (supabase as any)
            .from('frames')
            .select('*')
            .eq('id', frame.paired_frame_id)
            .single();
          
          if (!lsError && landscapeFrame) {
            // Keep reference to portrait for later
            const portraitFrame = frame;
            frame = landscapeFrame;
            frame._pairedPortrait = portraitFrame; // Store for portrait mode
            console.log('✅ Loaded paired landscape frame:', frame.name);
          }
        }
        
        // Similarly for portrait mode with landscape frame
        if (editorMode === 'portrait' && frame.orientation === 'landscape' && frame.paired_frame_id) {
          console.log('🔄 Switching to paired portrait frame...');
          const { data: portraitFrame, error: ptError } = await (supabase as any)
            .from('frames')
            .select('*')
            .eq('id', frame.paired_frame_id)
            .single();
          
          if (!ptError && portraitFrame) {
            const landscapeFrame = frame;
            frame = portraitFrame;
            frame._pairedLandscape = landscapeFrame;
            console.log('✅ Loaded paired portrait frame:', frame.name);
          }
        }
        
        if (frame && frame.design_data) {
          // Clear current canvas and session
          clearCanvas();
          clearSession();
          
          const designData = frame.design_data;
          const landscapeSize = { width: 2500, height: 1875 };
          const portraitSize = { width: 1875, height: 2500 };
          
          // Set canvas size based on current editor mode (from URL)
          const currentSize = editorMode === 'portrait' ? portraitSize : landscapeSize;
          setCanvasSize(currentSize.width, currentSize.height);
          console.log('📐 Canvas size set to:', currentSize.width, 'x', currentSize.height);
          
          // Set background
          if (designData.backgroundType) {
            setBackgroundType(designData.backgroundType);
          }
          if (designData.backgroundColor) {
            useEditorStore.getState().setBackgroundColor(designData.backgroundColor);
          }
          if (designData.gradientColors) {
            useEditorStore.getState().setGradientColors(designData.gradientColors);
          }
          
          // Prepare elements - separate locked (frame) and unlocked (editable)
          const allElements = designData.elements || [];
          
          // Determine frame orientation based on stored data or aspect ratio
          // A landscape frame has width > height in its design
          const frameOrientation = frame.orientation || 'landscape';
          const isLandscapeFrame = frameOrientation === 'landscape';
          console.log('🔍 Frame orientation:', frameOrientation, '-> isLandscapeFrame:', isLandscapeFrame);
          
          // Function to scale frame image to fill canvas
          const scaleFrameToCanvas = (el: any, targetSize: { width: number; height: number }) => {
            if (el.type === 'image') {
              console.log(`   🖼️ Scaling frame image to ${targetSize.width}x${targetSize.height}`);
              // Scale frame image to fill entire canvas and mark as locked
              return {
                ...el,
                x: 0,
                y: 0,
                width: targetSize.width,
                height: targetSize.height,
                scaleX: 1,
                scaleY: 1,
                isLocked: true, // Ensure frame images are locked
              };
            }
            return el;
          };
          
          // Mark frame elements: images are locked (the frame graphic), text is editable
          // This handles cases where isLocked wasn't set during frame creation
          const markFrameElements = (el: any) => {
            // Images in frame data are the frame graphic - always locked
            if (el.type === 'image') {
              return { ...el, isLocked: true };
            }
            // Text elements are editable by users (unless explicitly locked)
            return { ...el, isLocked: el.isLocked || false };
          };
          
          const processedElements = allElements.map(markFrameElements);
          
          // Get landscape and portrait frame elements
          let landscapeFrameElements: any[] = [];
          let portraitFrameElements: any[] = [];
          let editableElements: any[] = [];
          
          if (isLandscapeFrame) {
            // This is a landscape frame - separate locked (frame graphics) and editable
            landscapeFrameElements = processedElements
              .filter((el: any) => el.isLocked)
              .map((el: any) => scaleFrameToCanvas(el, landscapeSize));
            editableElements = processedElements.filter((el: any) => !el.isLocked);
            
            console.log(`📦 After processing: ${landscapeFrameElements.length} locked, ${editableElements.length} editable`);
            
            // Load portrait frame if paired
            if (frame.paired_frame_id) {
              const { data: portraitFrame } = await (supabase as any)
                .from('frames')
                .select('design_data')
                .eq('id', frame.paired_frame_id)
                .single();
              
              if (portraitFrame?.design_data?.elements) {
                const portraitProcessed = portraitFrame.design_data.elements.map(markFrameElements);
                portraitFrameElements = portraitProcessed
                  .filter((el: any) => el.isLocked)
                  .map((el: any) => scaleFrameToCanvas(el, portraitSize));
                console.log(`✅ Loaded paired portrait frame: ${portraitFrameElements.length} elements`);
              }
            } else {
              // No paired portrait frame - just leave portrait empty for now
              // The user will need to manually set up portrait elements or use the same frame
              console.log('⚠️ No paired portrait frame available');
              // Keep portraitFrameElements empty - user can only work in landscape mode
            }
          } else {
            // This is a portrait frame - need to find/load the landscape pair
            portraitFrameElements = processedElements
              .filter((el: any) => el.isLocked)
              .map((el: any) => scaleFrameToCanvas(el, portraitSize));
            editableElements = processedElements.filter((el: any) => !el.isLocked);
            
            // Load landscape frame if paired
            if (frame.paired_frame_id) {
              const { data: landscapeFrame } = await (supabase as any)
                .from('frames')
                .select('design_data')
                .eq('id', frame.paired_frame_id)
                .single();
              
              if (landscapeFrame?.design_data?.elements) {
                const landscapeProcessed = landscapeFrame.design_data.elements.map(markFrameElements);
                landscapeFrameElements = landscapeProcessed
                  .filter((el: any) => el.isLocked)
                  .map((el: any) => scaleFrameToCanvas(el, landscapeSize));
                console.log(`✅ Loaded paired landscape frame: ${landscapeFrameElements.length} elements`);
              }
            } else {
              // No paired landscape frame - just leave landscape empty for now
              // The user will need to manually set up landscape elements or use the same frame
              console.log('⚠️ No paired landscape frame available');
              // Keep landscapeFrameElements empty - user can only work in portrait mode
            }
          }
          
          console.log(`📦 Landscape frame elements: ${landscapeFrameElements.length}`);
          console.log(`📦 Portrait frame elements: ${portraitFrameElements.length}`);
          console.log(`📦 Editable elements: ${editableElements.length}`);
          
          // Calculate portrait positions for editable elements from landscape
          // BUT: If the frame is portrait-only (no paired landscape), don't recalculate!
          let portraitEditableElements: any[];
          let landscapeEditableElements: any[];
          
          if (isLandscapeFrame) {
            // Source is landscape - use original for landscape, calculate for portrait
            landscapeEditableElements = editableElements;
            portraitEditableElements = calculatePortraitFromLandscape(
              editableElements,
              landscapeSize,
              portraitSize
            );
          } else {
            // Source is portrait - use original for portrait, don't calculate (no landscape pair)
            portraitEditableElements = editableElements;
            landscapeEditableElements = []; // No landscape version available
            console.log('📐 Portrait frame - using original element positions (no conversion)');
          }
          
          // Build style object
          const style = {
            backgroundType: designData.backgroundType || 'solid',
            backgroundColor: designData.backgroundColor || '#ffffff',
            gradientStart: designData.gradientColors?.[0] || '#6366f1',
            gradientEnd: designData.gradientColors?.[1] || '#a855f7',
            gradientAngle: 45,
            frameId: frame.id,
          };
          
          // Save landscape design (frame + editable elements)
          const landscapeAllElements = [...landscapeFrameElements, ...landscapeEditableElements];
          saveLandscapeDesign(landscapeAllElements, style, landscapeSize);
          
          // Save portrait design (portrait frame + editable elements)
          const portraitAllElements = [...portraitFrameElements, ...portraitEditableElements];
          savePortraitDesign(portraitAllElements, style, portraitSize);
          
          // Add elements to current canvas based on mode
          const currentElements = editorMode === 'landscape' ? landscapeAllElements : portraitAllElements;
          console.log(`🎨 Adding ${currentElements.length} elements for ${editorMode} mode`);
          
          currentElements.forEach((el: any, index: number) => {
            console.log(`   [${index}] ${el.type}: locked=${el.isLocked}, x=${el.x}, y=${el.y}, w=${el.width}, h=${el.height}`);
            addElement({
              ...el,
              // Admin can edit everything, customers respect lock status
              isLocked: isAdminEdit ? false : (el.isLocked === true),
            });
          });
          
          // FORCE canvas size after adding elements (to prevent other effects from overriding)
          setTimeout(() => {
            const finalSize = editorMode === 'landscape' ? landscapeSize : portraitSize;
            setCanvasSize(finalSize.width, finalSize.height);
            console.log('📐 FORCED canvas size to:', finalSize.width, 'x', finalSize.height);
          }, 100);
          
          console.log(`✅ Dual-mode design ready:`);
          console.log(`   Landscape: ${landscapeAllElements.length} elements`);
          console.log(`   Portrait: ${portraitAllElements.length} elements`);
        }
      } catch (err) {
        console.error('Failed to load frame:', err);
      }
    };
    
    loadSupabaseFrame();
  }, [frameIdFromUrl, sourceFromUrl, clearCanvas, setCanvasSize, setBackgroundType, addElement, isAdminEdit, editorMode, saveLandscapeDesign, savePortraitDesign, calculatePortraitFromLandscape, clearSession, navigate]);

  // Load order for editing (photographer editing existing order)
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  
  useEffect(() => {
    const loadOrderForEditing = async () => {
      if (!orderIdFromUrl) return;
      
      const supabase = getSupabase();
      if (!supabase) return;
      
      try {
        console.log('📥 Loading order for editing:', orderIdFromUrl);
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: order, error } = await (supabase as any)
          .from('frame_orders')
          .select('*')
          .eq('id', orderIdFromUrl)
          .single();
        
        if (error) {
          console.error('Error loading order:', error);
          return;
        }
        
        setEditingOrderId(order.id);
        
        // If order has design_data, load it
        if (order.design_data) {
          console.log('✅ Order design loaded');
          
          // Clear current canvas
          clearCanvas();
          
          const designData = order.design_data;
          
          // Set canvas size
          if (designData.canvasWidth && designData.canvasHeight) {
            setCanvasSize(designData.canvasWidth, designData.canvasHeight);
          }
          
          // Set background
          if (designData.backgroundType) {
            setBackgroundType(designData.backgroundType);
          }
          if (designData.backgroundColor) {
            useEditorStore.getState().setBackgroundColor(designData.backgroundColor);
          }
          if (designData.gradientColors) {
            useEditorStore.getState().setGradientColors(designData.gradientColors);
          }
          
          // Add elements
          if (designData.elements && Array.isArray(designData.elements)) {
            designData.elements.forEach((el: any) => {
              addElement(el);
            });
          }
        } else if (order.thumbnail_url) {
          // If no design_data but has thumbnail, load thumbnail as background image
          console.log('Loading order thumbnail as background');
          clearCanvas();
          addElement({
            type: 'image',
            x: 0,
            y: 0,
            width: CANVAS_SIZES.landscape.width,
            height: CANVAS_SIZES.landscape.height,
            src: order.thumbnail_url,
            isLocked: true,
          });
        }
        
        // Clean up sessionStorage
        sessionStorage.removeItem('editingOrder');
      } catch (err) {
        console.error('Failed to load order:', err);
      }
    };
    
    loadOrderForEditing();
  }, [orderIdFromUrl, clearCanvas, setCanvasSize, setBackgroundType, addElement]);

  // Continue to portrait editor
  const handleContinueToPortrait = () => {
    // Filter out locked elements (frames) - they stay only in landscape
    // Only unlocked elements (text, shapes, user content) will be copied to portrait
    const elementsForPortrait = elements.filter(el => !el.isLocked);
    
    console.log('🚀 Continuing to portrait');
    console.log('📦 Total elements:', elements.length);
    console.log('📦 Non-locked elements for portrait:', elementsForPortrait.length);
    
    // Use fixed sizes - don't rely on current canvas dimensions
    const LANDSCAPE_SIZE = { width: 2500, height: 1875 };
    const PORTRAIT_SIZE = { width: 1875, height: 2500 };
    
    // Save FULL landscape design for publishing later
    const landscapeDesignData = {
      elements: elements, // All elements including locked
      canvasWidth: LANDSCAPE_SIZE.width,
      canvasHeight: LANDSCAPE_SIZE.height,
      backgroundColor,
      backgroundType,
      gradientColors,
    };
    sessionStorage.setItem('landscapeDesignForPublish', JSON.stringify(landscapeDesignData));
    
    // Save landscape design with ALL elements (for returning)
    const bgType = backgroundType === 'none' ? 'solid' : backgroundType as 'solid' | 'gradient' | 'none';
    
    saveLandscapeDesign(elements, {
      backgroundType: bgType,
      backgroundColor,
      gradientStart: gradientColors.start,
      gradientEnd: gradientColors.end,
      gradientAngle: gradientColors.angle,
      frameId: templateId,
    }, LANDSCAPE_SIZE);
    
    // Check if we already have a portrait design saved
    const existingPortrait = getPortraitDesign();
    
    // Check if existing portrait has locked elements (frame from Supabase)
    const existingLockedElements = existingPortrait?.elements.filter((el: any) => el.isLocked) || [];
    
    if (!existingPortrait || existingPortrait.elements.length === 0) {
      // First time going to portrait - calculate positions from landscape
      const calculatedPortraitElements = calculatePortraitFromLandscape(
        elementsForPortrait,
        LANDSCAPE_SIZE,
        PORTRAIT_SIZE
      );
      
      // Save calculated portrait elements
      savePortraitDesign(calculatedPortraitElements, {
        backgroundType: bgType,
        backgroundColor,
        gradientStart: gradientColors.start,
        gradientEnd: gradientColors.end,
        gradientAngle: gradientColors.angle,
        frameId: templateId,
      }, PORTRAIT_SIZE);
      
      console.log('✅ Created new portrait layout with', calculatedPortraitElements.length, 'elements');
    } else {
      // Existing portrait - update user elements while keeping locked elements
      console.log('✅ Existing portrait found:');
      console.log(`   - Locked elements (frame): ${existingLockedElements.length}`);
      console.log(`   - User elements: ${existingPortrait.elements.length - existingLockedElements.length}`);
      
      // If this is a Supabase frame (has locked elements), we need to keep them
      // and update only the user elements (calculated from landscape)
      if (existingLockedElements.length > 0) {
        const portraitSize = { width: 1875, height: 2500 };
        const landscapeSize = { width: canvasWidth, height: canvasHeight };
        
        const calculatedPortraitElements = calculatePortraitFromLandscape(
          elementsForPortrait,
          landscapeSize,
          portraitSize
        );
        
        // Combine locked frame elements + new calculated user elements
        const updatedPortraitElements = [...existingLockedElements, ...calculatedPortraitElements];
        
        savePortraitDesign(updatedPortraitElements, {
          backgroundType: bgType,
          backgroundColor,
          gradientStart: gradientColors.start,
          gradientEnd: gradientColors.end,
          gradientAngle: gradientColors.angle,
          frameId: templateId,
        }, portraitSize);
        
        console.log(`✅ Updated portrait: ${existingLockedElements.length} locked + ${calculatedPortraitElements.length} user elements`);
      }
    }
    
    // Save auto-save
    save();
    
    // Navigate to portrait editor
    const portraitId = templateId || `design-${Date.now()}`;
    navigate(`/editor/portrait/${portraitId}`);
  };

  // Go back to landscape editor from portrait
  const handleBackToLandscape = () => {
    console.log('🔙 Going back to landscape');
    
    // Use fixed sizes
    const PORTRAIT_SIZE = { width: 1875, height: 2500 };
    
    // Separate locked (frame) and unlocked (user) elements
    const lockedElements = elements.filter(el => el.isLocked);
    const userElements = elements.filter(el => !el.isLocked);
    const bgType = backgroundType === 'none' ? 'solid' : backgroundType as 'solid' | 'gradient' | 'none';
    
    // Save ALL portrait elements (locked frame + user content) so we can restore later
    const allElements = [...lockedElements, ...userElements];
    savePortraitDesign(allElements, {
      backgroundType: bgType,
      backgroundColor,
      gradientStart: gradientColors.start,
      gradientEnd: gradientColors.end,
      gradientAngle: gradientColors.angle,
      frameId: templateId,
    }, PORTRAIT_SIZE);
    
    console.log('💾 Saved portrait design:');
    console.log(`   - Locked elements (frame): ${lockedElements.length}`);
    console.log(`   - User elements: ${userElements.length}`);
    
    // Navigate back to landscape - it will load its saved elements
    const landscapeId = templateId || `design-${Date.now()}`;
    navigate(`/editor/landscape/${landscapeId}`);
  };

  // Save changes to order (photographer editing)
  const [savingOrder, setSavingOrder] = useState(false);
  
  const handleSaveOrderChanges = async () => {
    if (!editingOrderId) return;
    
    setSavingOrder(true);
    
    try {
      const supabase = getSupabase();
      if (!supabase) throw new Error('Supabase not available');
      
      // Generate new thumbnail
      let thumbnailUrl = null;
      if (stageRef.current) {
        const thumbnailDataUrl = stageRef.current.toDataURL({ pixelRatio: 0.5 });
        
        // Upload thumbnail to Supabase Storage
        const fileName = `order_${editingOrderId}_${Date.now()}.png`;
        const blob = await fetch(thumbnailDataUrl).then(r => r.blob());
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: uploadData, error: uploadError } = await (supabase as any).storage
          .from('frame-thumbnails')
          .upload(fileName, blob, { contentType: 'image/png', upsert: true });
        
        if (!uploadError && uploadData) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: publicUrl } = (supabase as any).storage
            .from('frame-thumbnails')
            .getPublicUrl(fileName);
          thumbnailUrl = publicUrl.publicUrl;
        }
      }
      
      // Save design data
      const designData = {
        elements,
        canvasWidth,
        canvasHeight,
        backgroundColor,
        backgroundType,
        gradientColors,
        updatedAt: new Date().toISOString(),
      };
      
      // Update order in database
      const updates: any = {
        design_data: designData,
        updated_at: new Date().toISOString(),
      };
      
      if (thumbnailUrl) {
        updates.thumbnail_url = thumbnailUrl;
      }
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('frame_orders')
        .update(updates)
        .eq('id', editingOrderId);
      
      if (error) throw error;
      
      alert('✅ השינויים נשמרו בהצלחה!');
    } catch (err) {
      console.error('Error saving order changes:', err);
      alert('❌ שגיאה בשמירת השינויים');
    } finally {
      setSavingOrder(false);
    }
  };

  // Go back to gallery
  const handleBackToGallery = () => {
    navigate('/categories');
  };

  // Calculate canvas container size
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle restore decision
  const handleRestore = () => {
    restore();
    setShowRestorePrompt(false);
  };

  const handleDismissRestore = () => {
    // Clear auto-save data
    clear();
    // Clear design session storage (landscape/portrait elements)
    clearSession();
    // Clear the canvas to start fresh
    clearCanvas();
    setShowRestorePrompt(false);
    console.log('🧹 Started fresh - cleared all saved data');
  };

  // Handle save as template
  const handleSaveAsTemplate = (name: string, description: string) => {
    addTemplate(
      name,
      description,
      elements,
      canvasWidth,
      canvasHeight,
      backgroundColor,
      backgroundType,
      gradientColors
    );
  };

  // Open Finish Design Modal
  const handleOpenFinishDesign = () => {
    // Generate current preview
    if (stageRef.current) {
      const currentPreview = stageRef.current.toDataURL({ pixelRatio: 0.5 });
      setPortraitPreview(currentPreview);
    }
    
    // Get landscape preview from session storage
    const savedLandscape = sessionStorage.getItem('landscapeDesignForPublish');
    if (savedLandscape) {
      // For now, use a placeholder - in production, we'd render the saved design
      setLandscapePreview('');
    }
    
    setShowFinishDesign(true);
  };

  // Send design to self (photographer)
  const handleSendToSelf = async (email: string) => {
    console.log('📧 Sending to self:', email);
    
    try {
      // Generate PNG files
      const portraitPng = stageRef.current?.toDataURL({ pixelRatio: 2 }) || '';
      
      if (!portraitPng) {
        throw new Error('לא ניתן ליצור תמונה מהעיצוב');
      }
      
      // Get landscape from session
      const savedLandscape = sessionStorage.getItem('landscapeDesignForPublish');
      let landscapePng = '';
      
      // For now, use portrait as placeholder for landscape if not available
      if (savedLandscape) {
        landscapePng = portraitPng; // Placeholder
      } else {
        landscapePng = portraitPng;
      }
      
      const supabase = getSupabase();
      if (!supabase) {
        throw new Error('שירות לא זמין - נסה שוב מאוחר יותר');
      }
      
      // Get current user - prefer business_name, then full_name
      const { data: { user } } = await supabase.auth.getUser();
      const photographerName = user?.user_metadata?.business_name || user?.user_metadata?.full_name || 'העסק שלך';
      
      console.log('📤 Calling Edge Function...');
      
      // Call Edge Function
      const { data, error } = await supabase.functions.invoke('send-design-email', {
        body: {
          type: 'to_self',
          photographerEmail: email,
          photographerName,
          landscapePng,
          portraitPng,
        },
      });
      
      if (error) {
        console.error('Edge Function error:', error);
        throw new Error(error.message || 'שגיאה בשליחת המייל');
      }
      
      if (data?.error) {
        throw new Error(data.error);
      }
      
      console.log('✅ Email sent:', data);
    } catch (err) {
      console.error('handleSendToSelf error:', err);
      throw err;
    }
  };

  // Send design to client
  const handleSendToClient = async (clientEmail: string, clientName: string) => {
    console.log('💌 Sending to client:', clientName, clientEmail);
    
    // Generate PNG files
    const portraitPng = stageRef.current?.toDataURL({ pixelRatio: 2 }) || '';
    
    // Get landscape from session
    const savedLandscape = sessionStorage.getItem('landscapeDesignForPublish');
    let landscapePng = '';
    
    if (savedLandscape) {
      landscapePng = portraitPng; // Placeholder - in production, render landscape
    } else {
      landscapePng = portraitPng;
    }
    
    const supabase = getSupabase();
    if (!supabase) {
      throw new Error('Supabase not configured');
    }
    
    // Get current user (photographer) - prefer business_name
    const { data: { user } } = await supabase.auth.getUser();
    const photographerEmail = user?.email || '';
    const photographerName = user?.user_metadata?.business_name || user?.user_metadata?.full_name || 'העסק שלך';
    
    // Save design to database
    const designId = `design_${Date.now()}`;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('designs')
      .insert({
        id: designId,
        user_id: user?.id,
        client_name: clientName,
        client_email: clientEmail,
        landscape_data: savedLandscape ? JSON.parse(savedLandscape) : null,
        portrait_data: {
          elements,
          canvasWidth,
          canvasHeight,
          backgroundColor,
          backgroundType,
          gradientColors,
        },
        status: 'sent',
        created_at: new Date().toISOString(),
      });
    
    // Call Edge Function
    const { data, error } = await supabase.functions.invoke('send-design-email', {
      body: {
        type: 'to_client',
        photographerEmail,
        photographerName,
        clientEmail,
        clientName,
        landscapePng,
        portraitPng,
        designId,
      },
    });
    
    if (error) {
      console.error('Error sending email:', error);
      throw error;
    }
    
    console.log('✅ Emails sent:', data);
  };

  // Handle publish frame to system (Admin only)
  const handlePublishFrame = async (data: PublishFrameData) => {
    console.log('🚀 Starting handlePublishFrame...');
    console.log('📋 Current mode:', editorMode);
    console.log('📋 Elements count:', elements.length);
    console.log('📋 Locked elements:', elements.filter(el => el.isLocked).length);
    
    const supabase = getSupabase();
    if (!supabase) {
      alert('❌ שגיאה: Supabase לא מוגדר');
      throw new Error('Supabase not configured');
    }

    // Generate thumbnail for current canvas
    let thumbnailUrl = '';
    if (stageRef.current) {
      try {
        console.log('📸 Generating preview...');
        const dataUrl = stageRef.current.toDataURL({ pixelRatio: 0.3 });
        thumbnailUrl = dataUrl;
        
        const fileName = `frames/${data.categoryId}/${Date.now()}_preview.png`;
        const blob = await fetch(dataUrl).then(r => r.blob());
        
        console.log('📤 Uploading to storage...');
        const uploadPromise = supabase.storage
          .from('frames')
          .upload(fileName, blob, { contentType: 'image/png' });
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Upload timeout')), 15000)  // Increased to 15 seconds
        );
        
        try {
          const { error: uploadError } = await Promise.race([uploadPromise, timeoutPromise]) as { error: Error | null };
          
          if (!uploadError) {
            const { data: urlData } = supabase.storage.from('frames').getPublicUrl(fileName);
            thumbnailUrl = urlData.publicUrl;
            console.log('✅ Thumbnail uploaded:', thumbnailUrl);
          } else {
            console.warn('⚠️ Upload error:', uploadError);
          }
        } catch (uploadErr) {
          console.warn('⚠️ Upload failed/timeout, using data URL:', uploadErr);
        }
      } catch (err) {
        console.error('Failed to generate preview:', err);
      }
    }

    // ==========================================
    // LANDSCAPE MODE PUBLISH - יוצר גם portrait אוטומטית
    // ==========================================
    if (editorMode === 'landscape') {
      console.log('📏 Publishing from LANDSCAPE mode');
      
      // Normalize locked elements (frames) to fill the canvas
      // This ensures frames are saved at exactly canvas size regardless of how they were uploaded
      const normalizedElements = elements.map(el => {
        if (el.isLocked && el.type === 'image') {
          // Locked images (frames) should fill the canvas
          console.log(`   🖼️ Normalizing frame "${el.name}" to ${canvasWidth}x${canvasHeight}`);
          return {
            ...el,
            x: 0,
            y: 0,
            width: canvasWidth,
            height: canvasHeight,
            scaleX: 1,
            scaleY: 1,
          };
        }
        return el;
      });
      
      // Extract only locked elements for portrait (the frame itself)
      const lockedElements = normalizedElements.filter(el => el.isLocked);
      console.log('🔒 Locked elements for portrait:', lockedElements.length);
      
      // Full landscape design data (all elements - normalized)
      const landscapeDesignData = {
        elements: normalizedElements,
        canvasWidth,
        canvasHeight,
        backgroundColor,
        backgroundType,
        gradientColors,
      };

      // Portrait design data - only locked elements (the frame)
      // Frames should fill the portrait canvas entirely
      const portraitWidth = 1875;
      const portraitHeight = 2500;
      
      // For locked images (frames), just set to canvas size. For text, scale proportionally.
      const portraitElements = lockedElements.map(el => {
        if (el.type === 'image') {
          // Frame images fill the portrait canvas
          return {
            ...el,
            x: 0,
            y: 0,
            width: portraitWidth,
            height: portraitHeight,
            scaleX: 1,
            scaleY: 1,
          };
        }
        // Text/other elements - scale proportionally
        const scaleX = portraitWidth / canvasWidth;
        const scaleY = portraitHeight / canvasHeight;
        const avgScale = (scaleX + scaleY) / 2;
        return {
          ...el,
          x: (el.x || 0) * scaleX,
          y: (el.y || 0) * scaleY,
          width: el.width ? el.width * avgScale : undefined,
          height: el.height ? el.height * avgScale : undefined,
          fontSize: el.type === 'text' && el.fontSize ? Math.round(el.fontSize * avgScale) : undefined,
        };
      });
      
      const portraitDesignData = {
        elements: portraitElements,
        canvasWidth: portraitWidth,
        canvasHeight: portraitHeight,
        backgroundColor,
        backgroundType,
        gradientColors,
      };

      // 1. Publish LANDSCAPE frame
      console.log('📝 Publishing landscape frame...');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: landscapeFrame, error: landscapeError } = await (supabase as any)
        .from('frames')
        .insert({
          name: data.name,
          name_en: data.nameEn,
          category_id: data.categoryId,
          is_premium: data.isPremium,
          is_active: true,
          thumbnail_url: thumbnailUrl.startsWith('data:') ? null : thumbnailUrl,
          full_url: thumbnailUrl.startsWith('data:') ? null : thumbnailUrl,
          preview_url: thumbnailUrl.startsWith('data:') ? null : thumbnailUrl,
          width: canvasWidth,
          height: canvasHeight,
          orientation: 'landscape',
          design_data: landscapeDesignData,
          usage_count: 0,
        })
        .select('id')
        .single();

      if (landscapeError) {
        console.error('❌ Error publishing landscape:', landscapeError);
        throw new Error(landscapeError.message);
      }
      
      console.log('✅ Landscape published:', landscapeFrame.id);

      // 2. Publish PORTRAIT frame (with only locked elements)
      console.log('📝 Publishing portrait frame (locked elements only)...');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: portraitFrame, error: portraitError } = await (supabase as any)
        .from('frames')
        .insert({
          name: data.name,
          name_en: data.nameEn,
          category_id: data.categoryId,
          is_premium: data.isPremium,
          is_active: true,
          thumbnail_url: null, // Portrait thumbnail would need separate generation
          width: portraitWidth,
          height: portraitHeight,
          orientation: 'portrait',
          paired_frame_id: landscapeFrame.id,
          design_data: portraitDesignData,
          design_portrait: portraitDesignData, // Also save in design_portrait field
          usage_count: 0,
        })
        .select('id')
        .single();

      if (portraitError) {
        console.error('❌ Error publishing portrait:', portraitError);
        // Don't throw, landscape is already published
        alert('⚠️ מסגרת רוחב פורסמה, אך יצירת מסגרת אורך נכשלה');
      } else {
        console.log('✅ Portrait published:', portraitFrame.id);
        
        // 3. Link landscape to portrait
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('frames')
          .update({ paired_frame_id: portraitFrame.id })
          .eq('id', landscapeFrame.id);
        
        console.log('🔗 Frames linked!');
        alert('🎉 מעולה! המסגרת פורסמה בשני הכיוונים (רוחב + אורך) ומקושרת!');
      }
      
      // Navigate to categories after successful publish
      navigate('/categories', { replace: true });
      return;
    }

    // ==========================================
    // PORTRAIT MODE PUBLISH - יוצר גם landscape אוטומטית
    // ==========================================
    console.log('📏 Publishing from PORTRAIT mode');
    console.log('📋 Data received:', { name: data.name, categoryId: data.categoryId, orientation: data.orientation });
    
    // Normalize locked elements (frames) to fill the canvas
    // This ensures frames are saved at exactly canvas size regardless of how they were uploaded
    const normalizedElements = elements.map(el => {
      if (el.isLocked && el.type === 'image') {
        // Locked images (frames) should fill the canvas
        console.log(`   🖼️ Normalizing frame "${el.name}" to ${canvasWidth}x${canvasHeight}`);
        return {
          ...el,
          x: 0,
          y: 0,
          width: canvasWidth,
          height: canvasHeight,
          scaleX: 1,
          scaleY: 1,
        };
      }
      return el;
    });
    
    // Extract only locked elements for landscape (the frame itself)
    const lockedElements = normalizedElements.filter(el => el.isLocked);
    console.log('🔒 Locked elements for landscape:', lockedElements.length);
    
    // Full portrait design data (all elements - normalized)
    const portraitDesignData = {
      elements: normalizedElements,
      canvasWidth,
      canvasHeight,
      backgroundColor,
      backgroundType,
      gradientColors,
    };
    
    console.log('📦 Portrait design data prepared, elements count:', normalizedElements.length);

    // Landscape design data - only locked elements (the frame)
    // Frames should fill the landscape canvas entirely
    const landscapeWidth = 2500;
    const landscapeHeight = 1875;
    
    // For locked images (frames), just set to canvas size. For text, scale proportionally.
    const landscapeElements = lockedElements.map(el => {
      if (el.type === 'image') {
        // Frame images fill the landscape canvas
        return {
          ...el,
          x: 0,
          y: 0,
          width: landscapeWidth,
          height: landscapeHeight,
          scaleX: 1,
          scaleY: 1,
        };
      }
      // Text/other elements - scale proportionally
      const scaleX = landscapeWidth / canvasWidth;
      const scaleY = landscapeHeight / canvasHeight;
      const avgScale = (scaleX + scaleY) / 2;
      return {
        ...el,
        x: (el.x || 0) * scaleX,
        y: (el.y || 0) * scaleY,
        width: el.width ? el.width * avgScale : undefined,
        height: el.height ? el.height * avgScale : undefined,
        fontSize: el.type === 'text' && el.fontSize ? Math.round(el.fontSize * avgScale) : undefined,
      };
    });
    
    const landscapeDesignData = {
      elements: landscapeElements,
      canvasWidth: landscapeWidth,
      canvasHeight: landscapeHeight,
      backgroundColor,
      backgroundType,
      gradientColors,
    };

    // 1. Publish PORTRAIT frame first
    console.log('📝 Publishing portrait frame...');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: portraitFrame, error: portraitError } = await (supabase as any)
      .from('frames')
      .insert({
        name: data.name,
        name_en: data.nameEn,
        category_id: data.categoryId,
        is_premium: data.isPremium,
        is_active: true,
        thumbnail_url: thumbnailUrl.startsWith('data:') ? null : thumbnailUrl,
        full_url: thumbnailUrl.startsWith('data:') ? null : thumbnailUrl,
        preview_url: thumbnailUrl.startsWith('data:') ? null : thumbnailUrl,
        width: canvasWidth,
        height: canvasHeight,
        orientation: 'portrait',
        design_data: portraitDesignData,
        usage_count: 0,
      })
      .select('id')
      .single();

    if (portraitError) {
      console.error('❌ Error publishing portrait:', portraitError);
      throw new Error(portraitError.message);
    }
    
    console.log('✅ Portrait published:', portraitFrame.id);

    // 2. Publish LANDSCAPE frame (with only locked elements)
    console.log('📝 Publishing landscape frame (locked elements only)...');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: landscapeFrame, error: landscapeError } = await (supabase as any)
      .from('frames')
      .insert({
        name: data.name,
        name_en: data.nameEn,
        category_id: data.categoryId,
        is_premium: data.isPremium,
        is_active: true,
        thumbnail_url: null, // Landscape thumbnail would need separate generation
        width: landscapeWidth,
        height: landscapeHeight,
        orientation: 'landscape',
        paired_frame_id: portraitFrame.id,
        design_data: landscapeDesignData,
        usage_count: 0,
      })
      .select('id')
      .single();

    if (landscapeError) {
      console.error('❌ Error publishing landscape:', landscapeError);
      // Don't throw, portrait is already published
      alert('⚠️ מסגרת אורך פורסמה, אך יצירת מסגרת רוחב נכשלה');
    } else {
      console.log('✅ Landscape published:', landscapeFrame.id);
      
      // 3. Link portrait to landscape
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('frames')
        .update({ paired_frame_id: landscapeFrame.id })
        .eq('id', portraitFrame.id);
      
      console.log('🔗 Frames linked!');
      alert('🎉 מעולה! המסגרת פורסמה בשני הכיוונים (אורך + רוחב) ומקושרת!');
    }
    
    // Navigate to categories after successful publish
    navigate('/categories', { replace: true });
  };

  // Handle UPDATE existing frame (Admin only)
  const handleUpdateFrame = async () => {
    if (!frameIdFromUrl || !isAdminEdit) return;
    
    const supabase = getSupabase();
    if (!supabase) {
      alert('❌ שגיאה: Supabase לא מוגדר');
      return;
    }

    try {
      // Generate new thumbnail
      let thumbnailUrl = '';
      if (stageRef.current) {
        const dataUrl = stageRef.current.toDataURL({ pixelRatio: 0.3 });
        thumbnailUrl = dataUrl;
      }

      // Prepare design data
      const designData = {
        elements,
        canvasWidth,
        canvasHeight,
        backgroundColor,
        backgroundType,
        gradientColors,
      };

      // Update frame in database
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('frames')
        .update({
          design_data: designData,
          thumbnail_url: thumbnailUrl.startsWith('data:') ? null : thumbnailUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', frameIdFromUrl);

      if (error) {
        console.error('❌ Error updating frame:', error);
        alert(`❌ שגיאה בעדכון: ${error.message}`);
        return;
      }

      console.log('✅ Frame updated successfully');
      alert('✅ המסגרת עודכנה בהצלחה!');
    } catch (err) {
      console.error('Error updating frame:', err);
      alert('❌ שגיאה בעדכון המסגרת');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-100 via-gray-100 to-slate-200" dir="rtl">
      {/* Restore Prompt - Modern Design */}
      {showRestorePrompt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full animate-fade-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">💾</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">שחזור עיצוב קודם</h3>
              <p className="text-gray-600">
                מצאנו עיצוב שמור מהפעם האחרונה. רוצה להמשיך מאיפה שהפסקת?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRestore}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
              >
                שחזר עיצוב
              </button>
              <button
                onClick={handleDismissRestore}
                className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              >
                התחל מחדש
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Bar - Compact Design */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-3 py-1.5">
          {/* Left Side - Back & Logo */}
          <div className="flex items-center gap-3">
            {/* Back button based on mode */}
            {editorMode === 'portrait' ? (
              isSingleOrientationFrame ? (
                // For single-orientation frames, go back to gallery instead
                <button
                  onClick={handleBackToGallery}
                  className="flex items-center gap-1.5 px-2 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all group"
                >
                  <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="hidden sm:inline text-sm font-medium">גלריה</span>
                </button>
              ) : (
                <button
                  onClick={handleBackToLandscape}
                  className="flex items-center gap-1.5 px-2 py-1.5 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-all group"
                >
                  <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="text-sm font-medium">חזור לרוחב</span>
                </button>
              )
            ) : editorMode === 'landscape' ? (
              <button
                onClick={handleBackToGallery}
                className="flex items-center gap-1.5 px-2 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all group"
              >
                <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline text-sm font-medium">גלריה</span>
              </button>
            ) : null}
            
            {/* Logo */}
            <div className="flex items-center gap-1.5">
              <span className="text-xl">🖼️</span>
              <span className="font-bold text-base bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent hidden sm:block">
                Misgarot Editor
              </span>
            </div>
            
            {/* Admin Edit Mode Indicator */}
            {isAdminEdit && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium border border-amber-200">
                <span>✏️</span>
                <span>עריכת מסגרת קיימת</span>
              </div>
            )}
          </div>
          
          {/* Center - Flow Progress */}
          {editorMode !== 'custom' && (
            <div className="flex items-center gap-2">
              {/* Single orientation warning */}
              {isSingleOrientationFrame && (
                <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-xs font-medium border border-amber-200">
                  <span>⚠️</span>
                  <span>מסגרת {editorMode === 'portrait' ? 'אורך' : 'רוחב'} בלבד</span>
                </div>
              )}
              
              {/* Flow Steps - Desktop - CLICKABLE */}
              <div className="hidden md:flex items-center gap-2 bg-gray-50 rounded-full px-3 py-1.5">
                {/* Step 1 - Landscape - Clickable (disabled for portrait-only frames) */}
                <button
                  onClick={() => {
                    if (editorMode === 'portrait' && !isSingleOrientationFrame) {
                      handleBackToLandscape();
                    }
                  }}
                  disabled={editorMode === 'landscape' || isSingleOrientationFrame}
                  title={isSingleOrientationFrame ? 'מסגרת זו זמינה רק במצב אורך' : ''}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    editorMode === 'landscape' 
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white cursor-default' 
                      : isSingleOrientationFrame
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-green-500 text-white hover:bg-green-600 cursor-pointer hover:shadow-md'
                  }`}
                >
                  <span>{editorMode === 'portrait' && !isSingleOrientationFrame ? '✓' : '🖼️'}</span>
                  <span>רוחב</span>
                </button>
                
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                
                {/* Step 2 - Portrait - Clickable */}
                <button
                  onClick={() => {
                    if (editorMode === 'landscape') {
                      handleContinueToPortrait();
                    }
                  }}
                  disabled={editorMode === 'portrait'}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    editorMode === 'portrait' 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white cursor-default' 
                      : 'bg-gray-200 text-gray-600 hover:bg-purple-100 hover:text-purple-700 cursor-pointer'
                  }`}
                >
                  <span>{editorMode === 'portrait' ? '📱' : '2'}</span>
                  <span>אורך</span>
                </button>
                
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                
                {/* Step 3 - Export */}
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  editorMode === 'portrait' 
                    ? 'bg-gray-200 text-gray-600 hover:bg-green-100 hover:text-green-700 cursor-pointer'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  <span>3</span>
                  <span>ייצוא</span>
                </div>
              </div>
              
              {/* Current Mode Badge - Mobile - Also Clickable */}
              <div className="md:hidden flex items-center gap-1 bg-gray-50 rounded-full p-1">
                <button
                  onClick={() => editorMode === 'portrait' && !isSingleOrientationFrame && handleBackToLandscape()}
                  disabled={isSingleOrientationFrame}
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all ${
                    editorMode === 'landscape' 
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' 
                      : isSingleOrientationFrame
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  <span>🖼️</span>
                </button>
                <button
                  onClick={() => editorMode === 'landscape' && !isSingleOrientationFrame && handleContinueToPortrait()}
                  disabled={isSingleOrientationFrame}
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all ${
                    editorMode === 'portrait' 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                      : isSingleOrientationFrame
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  <span>📱</span>
                </button>
              </div>
              
              {/* Continue to Portrait Button - Quick Access */}
              {editorMode === 'landscape' && !editingOrderId && (
                <button
                  onClick={handleContinueToPortrait}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-medium text-sm transition-all shadow-md hover:shadow-lg"
                >
                  <span>📱</span>
                  <span className="hidden sm:inline">המשך לאורך</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              )}
              
              {/* Save Changes Button - When editing an order */}
              {editingOrderId && (
                <button
                  onClick={handleSaveOrderChanges}
                  disabled={savingOrder}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white rounded-xl font-medium text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                >
                  {savingOrder ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      <span className="hidden sm:inline">שומר...</span>
                    </>
                  ) : (
                    <>
                      <span>💾</span>
                      <span className="hidden sm:inline">שמור שינויים</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </>
                  )}
                </button>
              )}
              
              {/* Finish & Send Button - Portrait Mode */}
              {editorMode === 'portrait' && (
                <button
                  onClick={handleOpenFinishDesign}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-medium text-sm transition-all shadow-md hover:shadow-lg"
                >
                  <span>✨</span>
                  <span className="hidden sm:inline">סיום ושליחה</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              )}
            </div>
          )}
          
          {/* Right Side - User Menu, Language & Save Status */}
          <div className="flex items-center gap-2">
            {/* User Menu */}
            <UserMenu />
            
            {/* Language Toggle */}
            <button 
              onClick={toggleLanguage}
              className="px-2 py-1 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors text-xs font-medium text-gray-600"
              aria-label="Toggle language"
            >
              {i18n.language === 'he' ? 'EN' : 'עב'}
            </button>
            
            {lastSaveDisplay && (
              <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="hidden sm:inline">נשמר</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Toolbar 
        onExport={() => setShowExport(true)} 
        onOpenTemplates={() => setShowTemplates(true)}
        onSave={save}
        onSaveAsTemplate={() => setShowSaveAsTemplate(true)}
        onPreview={() => setShowPreview(true)}
        onPublishFrame={() => setShowPublishFrame(true)}
        onUpdateFrame={handleUpdateFrame}
        onOrder={() => {
          // Generate thumbnail for order modal
          if (stageRef.current) {
            const stage = stageRef.current.getStage();
            if (stage) {
              const thumbnail = stage.toDataURL({ pixelRatio: 0.3 });
              setOrderThumbnail(thumbnail);
            }
          }
          setShowOrderModal(true);
        }}
        isAdmin={isAdmin}
        isAdminEdit={isAdminEdit}
      />

      {/* Main Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Layers */}
        <div className="hidden md:flex w-72 bg-white border-l border-gray-200 flex-col shadow-lg">
          <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              שכבות
            </h2>
          </div>
          <LayersPanel />
        </div>

        {/* Canvas Area - Main Focus */}
        <div 
          ref={containerRef}
          className="flex-1 flex flex-col items-center justify-center p-2 md:p-4 overflow-auto"
          style={{
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f8fafc 100%)',
          }}
        >
          {/* Canvas Wrapper with Zoom Controls */}
          <div className="flex flex-col items-center">
            {/* Zoom Controls - Above canvas */}
            <div className="mb-3 flex items-center gap-2 bg-white/95 backdrop-blur-xl px-4 py-2 rounded-2xl shadow-lg border border-gray-200" style={{boxShadow:'0 4px 24px 0 rgba(80,80,120,0.10)'}}>
              <button 
                onClick={() => setZoom(Math.max(0.2, (zoom || autoZoom) - 0.1))}
                className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <span className="text-xs font-semibold text-gray-700 min-w-[50px] text-center">
                {Math.round((zoom || autoZoom) * 100)}%
              </span>
              <button 
                onClick={() => setZoom(Math.min(2, (zoom || autoZoom) + 0.1))}
                className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              <div className="w-px h-5 bg-gray-300"></div>
              <button 
                onClick={() => setZoom(autoZoom)}
                className="px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="התאם לגודל המסך"
              >
                התאם
              </button>
              <button 
                onClick={() => setZoom(1)}
                className="px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="גודל מקורי"
              >
                100%
              </button>
            </div>

            {/* Canvas Container with Shadow */}
            <div 
              ref={canvasContainerRef}
              className="relative flex items-center justify-center"
              style={{
                transform: `scale(${zoom || autoZoom})`,
                transformOrigin: 'center center',
                transition: 'transform 0.2s ease-out',
              }}
            >
              {/* Canvas Shadow */}
              <div 
                className="absolute rounded-lg"
                style={{
                  inset: '-4px',
                  background: 'rgba(0,0,0,0.15)',
                  filter: 'blur(20px)',
                  zIndex: -1,
                }}
              ></div>
            
              {/* Canvas Frame */}
              <div 
                ref={canvasFrameRef}
                className="bg-white overflow-hidden relative"
                style={{
                  borderRadius: '4px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  border: '1px solid #e5e7eb',
                }}
              >
                <Canvas 
                  width={canvasWidth} 
                  height={canvasHeight}
                  stageRef={stageRef}
                />
              
                {/* Element Actions Overlay - כפתורים מסביב לאלמנט */}
                {selectedElement && !selectedElement.isLocked && (
                  <>
                    {/* Delete Button - Top Right Corner */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteElement(selectedElement.id);
                      }}
                      className="absolute z-50 w-12 h-12 flex items-center justify-center bg-white hover:bg-red-50 rounded-full shadow-xl border-2 border-red-400 text-red-500 hover:text-red-600 transition-all hover:scale-110 cursor-pointer"
                      style={{
                      left: selectedElement.x + (selectedElement.width || 100) + 12,
                      top: selectedElement.y - 16,
                    }}
                    title="מחיקה (Delete)"
                  >
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  
                  {/* Duplicate Button - Top Left Corner */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const el = selectedElement;
                      const newElement = {
                        ...el,
                        id: `${el.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        x: el.x + 50,
                        y: el.y + 50,
                        isLocked: false,
                      };
                      addElement(newElement);
                      selectElement(newElement.id);
                    }}
                    className="absolute z-50 w-12 h-12 flex items-center justify-center bg-white hover:bg-indigo-50 rounded-full shadow-xl border-2 border-indigo-400 text-indigo-500 hover:text-indigo-600 transition-all hover:scale-110 cursor-pointer"
                    style={{
                      left: selectedElement.x - 48,
                      top: selectedElement.y - 16,
                    }}
                    title="שכפול"
                  >
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  
                  {/* Rotate Button - Bottom Left - DRAG TO ROTATE */}
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      
                      if (!canvasFrameRef.current) return;
                      
                      // Get element center
                      const rect = canvasFrameRef.current.getBoundingClientRect();
                      const currentZoom = zoom || autoZoom;
                      const elementCenterX = rect.left + (selectedElement.x + (selectedElement.width || 100) / 2) * currentZoom;
                      const elementCenterY = rect.top + (selectedElement.y + (selectedElement.height || 100) / 2) * currentZoom;
                      
                      // Calculate starting angle
                      const dx = e.clientX - elementCenterX;
                      const dy = e.clientY - elementCenterY;
                      const mouseAngle = Math.atan2(dy, dx) * (180 / Math.PI);
                      
                      setRotationStart({
                        angle: selectedElement.rotation || 0,
                        mouseAngle: mouseAngle
                      });
                      setIsRotating(true);
                    }}
                    className={`absolute z-50 w-12 h-12 flex items-center justify-center bg-white rounded-full shadow-xl border-2 transition-all cursor-grab active:cursor-grabbing select-none ${
                      isRotating 
                        ? 'border-purple-600 bg-purple-100 scale-110' 
                        : 'border-purple-400 hover:bg-purple-50 hover:scale-110'
                    }`}
                    style={{
                      left: selectedElement.x - 48,
                      top: selectedElement.y + (selectedElement.height || 100) - 24,
                    }}
                    title="גרור לסיבוב חופשי"
                  >
                    <svg className={`w-7 h-7 ${isRotating ? 'text-purple-600' : 'text-purple-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  
                  {/* Rotation indicator - shows when rotating */}
                  {isRotating && (
                    <div 
                      className="absolute z-50 bg-purple-600 text-white text-sm px-3 py-1.5 rounded-lg whitespace-nowrap font-bold shadow-lg"
                      style={{
                        left: selectedElement.x + (selectedElement.width || 100) / 2 - 25,
                        top: selectedElement.y - 45,
                      }}
                    >
                      {Math.round(selectedElement.rotation || 0)}°
                    </div>
                  )}
                  
                  {/* Flip Button - Bottom Right Corner */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const currentScaleX = selectedElement.scaleX || 1;
                      updateElement(selectedElement.id, { scaleX: currentScaleX * -1 });
                    }}
                    className="absolute z-50 w-12 h-12 flex items-center justify-center bg-white hover:bg-teal-50 rounded-full shadow-xl border-2 border-teal-400 text-teal-500 hover:text-teal-600 transition-all hover:scale-110 cursor-pointer"
                    style={{
                      left: selectedElement.x + (selectedElement.width || 100) + 12,
                      top: selectedElement.y + (selectedElement.height || 100) - 24,
                    }}
                    title="היפוך אופקי"
                  >
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          </div>
          
          {/* Canvas Size Label */}
          <div className="mt-4 text-xs text-gray-500 font-medium">
            {canvasWidth} × {canvasHeight} px
          </div>
          </div>
          {/* End Canvas Wrapper */}
        </div>

        {/* Right Panel - Properties */}
        <div className="hidden lg:flex w-80 bg-white border-r border-gray-200 flex-col shadow-lg">
          <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              הגדרות
            </h2>
          </div>
          <PropertiesPanel />
        </div>
      </div>

      {/* Status Bar - Modern */}
      <div className="h-10 bg-white border-t border-gray-200 px-4 flex items-center justify-between text-sm shadow-inner">
        <div className="flex items-center gap-4">
          {/* Canvas Size */}
          <div className="flex items-center gap-2 text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            <span className="hidden sm:inline">{canvasWidth} × {canvasHeight}</span>
          </div>
          
          {/* Zoom */}
          <div className="flex items-center gap-2 text-gray-600 bg-gray-100 px-2 py-1 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
            <span className="font-medium">{Math.round(zoom * 100)}%</span>
          </div>
        </div>
        
        {/* Keyboard Shortcuts */}
        <div className="hidden md:flex items-center gap-3 text-gray-500 text-xs">
          <kbd className="px-2 py-0.5 bg-gray-100 rounded">Ctrl+Z</kbd>
          <span>בטל</span>
          <span className="text-gray-300">|</span>
          <kbd className="px-2 py-0.5 bg-gray-100 rounded">Ctrl+S</kbd>
          <span>שמור</span>
          <span className="text-gray-300">|</span>
          <kbd className="px-2 py-0.5 bg-gray-100 rounded">Delete</kbd>
          <span>מחק</span>
        </div>
      </div>

      {/* Templates Panel */}
      <TemplatesPanel 
        isOpen={showTemplates} 
        onClose={() => setShowTemplates(false)} 
      />

      {/* Export Modal */}
      <ExportModal 
        isOpen={showExport} 
        onClose={() => setShowExport(false)}
        stageRef={stageRef}
      />

      {/* Save As Template Modal */}
      <SaveAsTemplateModal
        isOpen={showSaveAsTemplate}
        onClose={() => setShowSaveAsTemplate(false)}
        onSave={handleSaveAsTemplate}
      />

      {/* Preview Modal */}
      <PreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        stageRef={stageRef}
      />

      {/* Publish Frame Modal - Admin Only */}
      {isAdmin && (
        <PublishFrameModal
          isOpen={showPublishFrame}
          onClose={() => setShowPublishFrame(false)}
          onPublish={handlePublishFrame}
          currentOrientation={editorMode === 'portrait' ? 'portrait' : 'landscape'}
        />
      )}

      {/* Finish Design Modal - Send to self or client */}
      <FinishDesignModal
        isOpen={showFinishDesign}
        onClose={() => setShowFinishDesign(false)}
        onSendToSelf={handleSendToSelf}
        onSendToClient={handleSendToClient}
        landscapePreview={landscapePreview}
        portraitPreview={portraitPreview}
      />

      {/* Order Modal - Create frame order */}
      <OrderModal
        isOpen={showOrderModal}
        onClose={() => {
          setShowOrderModal(false);
          setOrderThumbnail('');
        }}
        designData={useEditorStore.getState().elements}
        thumbnailUrl={orderThumbnail}
        onOrderCreated={(orderNumber) => {
          console.log('Order created:', orderNumber);
          // Could show success notification here
        }}
      />

      {/* Text Toolbar - Floating above selected text element */}
      {/* Hide when publish modal is open */}
      {selectedTextElement && textToolbarPosition && !showPublishFrame && (
        <TextToolbar
          element={selectedTextElement}
          position={textToolbarPosition}
          zoom={zoom || autoZoom}
        />
      )}
    </div>
  );
};

export default EditorPage;
