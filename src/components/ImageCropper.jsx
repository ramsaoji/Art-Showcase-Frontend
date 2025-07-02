import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useLayoutEffect,
} from "react";
import ReactDOM from "react-dom";
import { motion } from "framer-motion";
import {
  XMarkIcon,
  HandRaisedIcon,
  ScissorsIcon,
} from "@heroicons/react/24/outline";
import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 95, // Increased from 90% to 95% for larger initial crop
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

export default function ImageCropper({
  image,
  onCropComplete,
  onCancel,
  aspectRatio, // No default value - will be undefined for free cropping
}) {
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState();
  const [mounted, setMounted] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [imageScale, setImageScale] = useState(0.9);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });
  const imgRef = useRef(null);
  const modalContentRef = useRef(null);
  const [mode, setMode] = useState("crop"); // 'crop' or 'pan'

  // Ensure component is mounted before rendering portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Keyboard shortcuts for desktop
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!mounted) return;

      switch (e.key) {
        case "+":
        case "=":
          e.preventDefault();
          setImageScale((prev) => Math.min(prev * 1.2, 3));
          break;
        case "-":
          e.preventDefault();
          setImageScale((prev) => Math.max(prev / 1.2, 0.1));
          break;
        case "0":
          e.preventDefault();
          setImageScale(1);
          break;
        case "Escape":
          onCancel();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mounted, onCancel]);

  useLayoutEffect(() => {
    function updateSize() {
      if (modalContentRef.current) {
        // This is a placeholder for the removed modalSize logic
      }
    }
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const onImageLoad = useCallback(
    (e) => {
      const { naturalWidth, naturalHeight } = e.currentTarget;
      setImageDimensions({ width: naturalWidth, height: naturalHeight });
      setImageLoaded(true);
      if (!crop) {
        if (aspectRatio) {
          // Use largest possible crop with aspect
          setCrop(centerAspectCrop(naturalWidth, naturalHeight, aspectRatio));
        } else {
          // Cover the whole image
          setCrop({ unit: "%", x: 0, y: 0, width: 100, height: 100 });
        }
      }
    },
    [crop, aspectRatio]
  );

  const getCroppedImg = useCallback(() => {
    if (!completedCrop || !imgRef.current) {
      return null;
    }

    const image = imgRef.current;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("No 2d context");
    }

    // Use the actual rendered size of the image in the DOM
    const boundingRect = image.getBoundingClientRect();
    const displayedWidth = boundingRect.width;
    const displayedHeight = boundingRect.height;
    const naturalWidth = image.naturalWidth;
    const naturalHeight = image.naturalHeight;
    const scaleX = naturalWidth / displayedWidth;
    const scaleY = naturalHeight / displayedHeight;

    // Use crop values in pixels (not percent)
    const cropX = completedCrop.x * scaleX;
    const cropY = completedCrop.y * scaleY;
    const cropWidth = completedCrop.width * scaleX;
    const cropHeight = completedCrop.height * scaleY;

    canvas.width = Math.round(cropWidth);
    canvas.height = Math.round(cropHeight);

    ctx.imageSmoothingQuality = "high";

    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      canvas.width,
      canvas.height
    );

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            console.error("Canvas is empty");
            return;
          }
          blob.name = "cropped-image.jpg";
          const croppedImageUrl = URL.createObjectURL(blob);
          resolve({ blob, url: croppedImageUrl });
        },
        "image/jpeg",
        0.9
      );
    });
  }, [completedCrop]);

  const handleCropComplete = useCallback(async () => {
    try {
      const croppedResult = await getCroppedImg();
      if (croppedResult) {
        onCropComplete(croppedResult);
      }
    } catch (error) {
      console.error("Error cropping image:", error);
    }
  }, [getCroppedImg, onCropComplete]);

  const handleOverlayClick = (e) => {
    // Only close if clicking directly on the overlay, not on the modal content
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  // Reset pan when image or zoom resets
  useEffect(() => {
    setPan({ x: 0, y: 0 });
  }, [image, imageScale]);

  // Mouse/touch handlers for panning
  const handlePointerDown = (e) => {
    if (isMobile) return; // Disable pan on mobile
    if (mode !== "pan") return;
    setDragging(true);
    dragStart.current = {
      x: e.type.startsWith("touch") ? e.touches[0].clientX : e.clientX,
      y: e.type.startsWith("touch") ? e.touches[0].clientY : e.clientY,
    };
    panStart.current = { ...pan };
    e.preventDefault();
  };
  const handlePointerMove = (e) => {
    if (!dragging) return;
    const clientX = e.type.startsWith("touch")
      ? e.touches[0].clientX
      : e.clientX;
    const clientY = e.type.startsWith("touch")
      ? e.touches[0].clientY
      : e.clientY;
    const dx = clientX - dragStart.current.x;
    const dy = clientY - dragStart.current.y;
    setPan({ x: panStart.current.x + dx, y: panStart.current.y + dy });
  };
  const handlePointerUp = () => {
    setDragging(false);
  };

  // Attach/remove global move/up listeners when dragging
  useEffect(() => {
    if (!dragging) return;
    const move = (e) => handlePointerMove(e);
    const up = () => handlePointerUp();
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    window.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", up);
    };
  }, [dragging]);

  // Calculate display size for image and cropper
  const isMobile = window.innerWidth < 640; // Tailwind's sm breakpoint
  // Dynamically calculate header/footer height for mobile cropper area
  const [availableCropperHeight, setAvailableCropperHeight] = useState(null);
  const headerRef = useRef(null);
  const footerRef = useRef(null);
  useLayoutEffect(() => {
    function updateAvailableHeight() {
      if (!modalContentRef.current) return;
      const modalRect = modalContentRef.current.getBoundingClientRect();
      const headerH = headerRef.current?.getBoundingClientRect().height || 0;
      const footerH = footerRef.current?.getBoundingClientRect().height || 0;
      setAvailableCropperHeight(modalRect.height - headerH - footerH);
    }
    updateAvailableHeight();
    window.addEventListener("resize", updateAvailableHeight);
    return () => window.removeEventListener("resize", updateAvailableHeight);
  }, [mounted, imageLoaded]);

  const getDisplaySize = () => {
    if (isMobile && availableCropperHeight) {
      // On mobile, fit image within available cropper area
      const maxW = window.innerWidth;
      const maxH = availableCropperHeight;
      let w = imageDimensions.width;
      let h = imageDimensions.height;
      if (w > maxW) {
        h = h * (maxW / w);
        w = maxW;
      }
      if (h > maxH) {
        w = w * (maxH / h);
        h = maxH;
      }
      return { width: Math.round(w), height: Math.round(h) };
    }
    // Desktop logic
    const maxW = window.innerWidth * 0.95;
    const maxH = window.innerHeight * 0.6;
    let w = imageDimensions.width;
    let h = imageDimensions.height;
    if (w > maxW) {
      h = h * (maxW / w);
      w = maxW;
    }
    if (h > maxH) {
      w = w * (maxH / h);
      h = maxH;
    }
    return { width: Math.round(w), height: Math.round(h) };
  };
  const displaySize = getDisplaySize();
  const maxModalHeight = window.innerHeight * 0.85;

  // Prevent switching to pan mode on mobile
  useEffect(() => {
    if (isMobile && mode !== "crop") {
      setMode("crop");
    }
  }, [isMobile, mode]);

  // Don't render anything until mounted
  if (!mounted) {
    return null;
  }

  return ReactDOM.createPortal(
    <div className="fixed inset-0 flex items-center justify-center p-4 md:p-6 z-[60]">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity z-[60]"
        onClick={handleOverlayClick}
      />

      {/* Modal Content */}
      <motion.div
        ref={modalContentRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="relative mx-auto bg-white rounded-xl sm:rounded-2xl shadow-2xl border border-white/20 z-[70] flex flex-col overflow-y-auto max-w-6xl"
        style={{
          overflowX: "hidden",
          minWidth: 320,
          height: maxModalHeight,
          maxHeight: maxModalHeight,
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile-Responsive Header */}
        <div
          ref={headerRef}
          className="flex-shrink-0 px-3 sm:px-4 py-2 sm:py-2.5 relative border-b border-gray-100 font-sans"
        >
          {/* Close button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onCancel}
            className="absolute right-2 sm:right-3 top-2 sm:top-3 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-gray-100/80 backdrop-blur-md text-gray-500 transition-all duration-200 hover:bg-gray-200 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 border border-gray-200/50 z-20"
            aria-label="Close"
          >
            <XMarkIcon className="h-3 w-3 sm:h-4 sm:w-4" />
          </motion.button>
          <div className="flex flex-col min-w-0 flex-1 font-sans pr-12">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-0 ">
              Crop Image
            </h2>
            <div className="flex flex-col gap-1 min-w-0">
              <span className="text-xs sm:text-sm text-gray-600 font-sans break-words">
                Drag to select any area • Use +/- keys or buttons to zoom •
                Press 0 to reset
              </span>
              <div className="self-start">
                <span className="inline-block px-1 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[11px] font-semibold font-sans">
                  Use the hand/crop button to pan or crop
                </span>
              </div>
            </div>
            {imageDimensions.width > 0 && (
              <div className="text-xs text-gray-400 font-sans mt-1">
                Original: {imageDimensions.width} × {imageDimensions.height}px
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Cropper Content with Desktop Scrolling */}
        <div
          className="w-full relative flex-1 min-h-0 flex justify-center items-center overflow-hidden"
          style={{
            height:
              isMobile && availableCropperHeight
                ? availableCropperHeight
                : "100%",
          }}
        >
          {/* Floating Zoom & Mode Controls */}
          <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setImageScale((prev) => Math.min(prev * 1.2, 3))}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/90 backdrop-blur-md text-gray-700 hover:bg-white transition-all duration-200 shadow-lg border border-gray-200/50"
              title="Zoom In"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                />
              </svg>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setImageScale((prev) => Math.max(prev / 1.2, 0.1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/90 backdrop-blur-md text-gray-700 hover:bg-white transition-all duration-200 shadow-lg border border-gray-200/50"
              title="Zoom Out"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <line
                  x1="6"
                  y1="12"
                  x2="18"
                  y2="12"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setImageScale(1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/90 backdrop-blur-md text-gray-700 hover:bg-white transition-all duration-200 shadow-lg border border-gray-200/50 text-[10px] font-medium font-sans text-center"
              title="Reset Zoom"
            >
              100%
            </motion.button>
            {/* Pan/Crop toggle button - only show on desktop */}
            {!isMobile && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setMode(mode === "crop" ? "pan" : "crop")}
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 shadow-lg border border-gray-200/50 ${
                  mode === "pan"
                    ? "bg-indigo-500 text-white"
                    : "bg-white/90 text-gray-700 hover:bg-white"
                }`}
                title={
                  mode === "pan"
                    ? "Pan Mode (click to crop)"
                    : "Crop Mode (click to pan)"
                }
              >
                {mode === "pan" ? (
                  <HandRaisedIcon className="w-5 h-5" />
                ) : (
                  <ScissorsIcon className="w-5 h-5" />
                )}
              </motion.button>
            )}
          </div>
          <div
            className="relative overflow-hidden min-w-0 w-full flex items-center justify-center"
            style={{
              width: isMobile ? displaySize.width : displaySize.width,
              maxWidth: "100%",
              height: isMobile ? displaySize.height : displaySize.height,
              touchAction: mode === "pan" ? "none" : "auto",
              cursor:
                mode === "pan" ? (dragging ? "grabbing" : "grab") : "crosshair",
            }}
            onMouseDown={handlePointerDown}
            onTouchStart={handlePointerDown}
          >
            <div
              style={{
                transform: `scale(${imageScale}) translate(${
                  pan.x / imageScale
                }px, ${pan.y / imageScale}px)`,
                transformOrigin: "center center",
                transition: dragging ? "none" : "transform 0.2s ease-out",
                width: "100%",
                maxWidth: "100%",
                height: isMobile ? "auto" : displaySize.height,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                className="touch-none"
                ruleOfThirds={true}
                disabled={mode === "pan"}
                style={mode === "pan" ? { pointerEvents: "none" } : {}}
              >
                <img
                  ref={imgRef}
                  alt="Crop me"
                  src={image}
                  onLoad={onImageLoad}
                  style={{
                    // width: displaySize.width,
                    // height: displaySize.height,
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                    display: "block",
                    touchAction: "none",
                    cursor:
                      mode === "pan"
                        ? dragging
                          ? "grabbing"
                          : "grab"
                        : "crosshair",
                    userSelect: "none",
                    pointerEvents: "auto",
                    margin: "0 auto",
                  }}
                  className="select-none"
                  draggable={false}
                />
                {/* Loading overlay */}
                {!imageLoaded && (
                  <div
                    className="absolute inset-0 flex justify-center items-center pointer-events-none z-10"
                    style={{
                      height: isMobile ? undefined : displaySize.height,
                    }}
                  >
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    <span className="ml-2 text-white">Loading image...</span>
                  </div>
                )}
              </ReactCrop>
            </div>
          </div>
        </div>

        {/* Mobile-Responsive Footer */}
        <div
          ref={footerRef}
          className="flex-shrink-0 border-t border-gray-100 px-3 sm:px-4 py-2 sm:py-2.5 font-sans"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 w-full min-w-0 font-sans">
            {/* Crop info - mobile responsive */}
            <div
              className={
                `flex-1 min-w-0 overflow-x-auto text-xs text-gray-600 font-sans ` +
                (isMobile
                  ? "flex flex-col items-start gap-1"
                  : "flex flex-row items-center gap-2")
              }
            >
              {/* Zoom level indicator */}
              <span
                className="flex items-center gap-1 text-gray-500 font-sans truncate"
                title="Zoom relative to original image size"
              >
                <svg
                  className="w-3 h-3 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <span className="whitespace-nowrap font-sans truncate">
                  Zoom: {Math.round(imageScale * 100)}%{" "}
                  <span className="text-gray-400">(of original size)</span>
                </span>
              </span>
              {completedCrop && (
                <>
                  <span className="flex items-center gap-1 font-sans truncate">
                    <svg
                      className="w-3 h-3 text-gray-500 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                      />
                    </svg>
                    <span className="whitespace-nowrap font-sans truncate">
                      Crop: {Math.round(completedCrop.width)} ×{" "}
                      {Math.round(completedCrop.height)}px
                    </span>
                  </span>
                  {imageDimensions.width > 0 && (
                    <span className="text-gray-500 whitespace-nowrap font-sans truncate">
                      Output:{" "}
                      {Math.round(
                        completedCrop.width *
                          (imageDimensions.width / imgRef.current?.width || 1)
                      )}{" "}
                      ×{" "}
                      {Math.round(
                        completedCrop.height *
                          (imageDimensions.height / imgRef.current?.height || 1)
                      )}{" "}
                      px
                    </span>
                  )}
                </>
              )}
            </div>
            {/* Action buttons - mobile responsive */}
            <div className="flex gap-2 sm:gap-3 flex-shrink-0 mt-2 sm:mt-0 font-sans">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onCancel();
                }}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 font-sans font-medium hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleCropComplete}
                disabled={!completedCrop}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-sans font-medium hover:from-indigo-600 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2${
                  !completedCrop
                    ? " opacity-60 pointer-events-none cursor-not-allowed"
                    : ""
                }`}
              >
                {/* <svg
                  className="w-3 h-3 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg> */}
                <span className="whitespace-nowrap font-sans">Apply Crop</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
