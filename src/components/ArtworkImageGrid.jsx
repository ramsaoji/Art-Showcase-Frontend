import React from "react";
import { XMarkIcon, PhotoIcon, PlusIcon } from "@heroicons/react/24/outline";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableImage({ img, idx, onRemove, isSuperAdmin = false }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: img.uuid });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? "none" : transition,
    width: "100%",
    height: "100%",
    zIndex: isDragging ? 50 : undefined,
    cursor: isDragging ? "grabbing" : "grab",
    touchAction: "none", // Prevent default touch behaviors on mobile
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`relative group rounded-2xl overflow-visible transition-all duration-200 ease-out bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center aspect-square min-w-[90px] sm:min-w-[100px] max-w-[90px] sm:max-w-[100px] ${
        isDragging
          ? "scale-105 shadow-2xl ring-2 ring-violet-400/50 bg-white rotate-2"
          : "shadow-lg hover:shadow-2xl hover:scale-[1.02] hover:ring-2 hover:ring-violet-300/30 active:scale-95"
      }`}
    >
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-2xl">
        <img
          src={img.preview}
          alt={`Artwork ${idx + 1}`}
          className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110 pointer-events-none"
          draggable={false}
        />
        {/* Elegant overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Carousel indicator - visible to all users */}
      {img.showInCarousel && (
        <div
          className="absolute top-2 left-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full p-1.5 shadow-lg border border-white/20 z-30 group-hover:scale-110 transition-transform duration-200 cursor-help"
          title="This image appears on the homepage carousel"
        >
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path
              fillRule="evenodd"
              d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}

      {/* Remove button - positioned outside the image */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(idx);
        }}
        className={`absolute -top-3 -right-3 rounded-full p-2 shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-150 border-2 border-white z-20 touch-manipulation ${
          img.showInCarousel && !isSuperAdmin
            ? "bg-gray-400 text-gray-600 cursor-not-allowed hover:bg-gray-400 hover:scale-100"
            : "bg-red-500 text-white hover:bg-red-600"
        }`}
        title={
          img.showInCarousel && !isSuperAdmin
            ? "Cannot remove carousel image - contact admin"
            : "Remove image"
        }
        disabled={img.showInCarousel && !isSuperAdmin}
      >
        <XMarkIcon className="h-3 w-3 stroke-2" />
      </button>

      {/* Image number indicator - always visible */}
      <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
        {idx + 1}
      </div>

      {/* Mobile drag indicator */}
      <div className="absolute top-2 right-2 bg-violet-500/80 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        Drag
      </div>
    </div>
  );
}

export default function ArtworkImageGrid({
  images = [],
  setImages,
  imageUploadLimit = 10,
  imageErrors = [],
  validationErrors = [],
  onFilesSelected,
  fileSizeMB = 5,
  onDismissErrors,
  isAutoDismissible = false,
  isSuperAdmin = false,
  validationError = null,
  setImageErrors = () => {},
  setIsAutoDismissible = () => {},
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Remove image handler
  const handleRemoveImage = (idx) => {
    const removed = images[idx];

    // Prevent artists from removing carousel images
    if (removed?.showInCarousel && !isSuperAdmin) {
      const errorMessage =
        "Cannot remove carousel image. This image is used in the homepage carousel. Please contact an administrator if you need to remove it.";
      setImageErrors([errorMessage]);
      setIsAutoDismissible(false);
      return;
    }

    if (removed && removed.preview && !removed.uploaded) {
      URL.revokeObjectURL(removed.preview);
    }

    // Check if the removed image was marked for carousel
    const wasCarouselImage = removed?.showInCarousel;

    const newImages = images
      .filter((_, i) => i !== idx)
      .map((img, i) => ({
        ...img,
        galleryOrder: i,
        // Preserve showInCarousel property
        showInCarousel: img.showInCarousel || false,
      }));

    // If we removed a carousel image and there are remaining images,
    // automatically assign carousel to the first remaining image
    if (wasCarouselImage && newImages.length > 0) {
      newImages[0].showInCarousel = true;

      // Show notification to user about automatic reassignment
      const notificationMessage =
        "The carousel image was automatically reassigned to the first remaining image to keep your artwork visible in the carousel.";
      setImageErrors([notificationMessage]);
      setIsAutoDismissible(true);

      // Auto-clear the notification after 5 seconds
      setTimeout(() => {
        setImageErrors([]);
        setIsAutoDismissible(false);
      }, 5000);
    }

    setImages(newImages);
  };

  // Drag end handler
  const onDragEnd = ({ active, over }) => {
    if (active.id !== over?.id) {
      const oldIndex = images.findIndex((img) => img.uuid === active.id);
      const newIndex = images.findIndex((img) => img.uuid === over.id);
      const reordered = arrayMove(images, oldIndex, newIndex).map(
        (img, idx) => ({
          ...img,
          galleryOrder: idx,
          // Preserve showInCarousel property
          showInCarousel: img.showInCarousel || false,
        })
      );
      setImages(reordered);
    }
  };

  // Dropzone drag handlers
  const [isDragActive, setIsDragActive] = React.useState(false);
  const handleDragOver = React.useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isDragActive) setIsDragActive(true);
    },
    [isDragActive]
  );
  const handleDragLeave = React.useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);
  const handleDrop = React.useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        onFilesSelected(Array.from(e.dataTransfer.files));
      }
    },
    [onFilesSelected]
  );

  const isAtLimit = isSuperAdmin
    ? images.length >= 1000
    : images.length >= imageUploadLimit;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-lg font-semibold text-gray-900 tracking-tight">
            Artwork Gallery
          </label>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {images.length}{" "}
              {isSuperAdmin
                ? `/ 1000`
                : `/ ${imageUploadLimit === Infinity ? "∞" : imageUploadLimit}`}
            </span>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Upload and arrange your artwork images in your preferred order
        </p>
      </div>

      {/* Upload Area */}
      <div
        className={`relative overflow-hidden rounded-3xl border-2 border-dashed transition-all duration-300 ease-out ${
          validationError
            ? "border-red-400 bg-gradient-to-br from-red-50 via-red-50/30 to-red-50/50"
            : isDragActive
            ? "border-violet-400 bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 scale-[1.01] shadow-lg"
            : isAtLimit
            ? "border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100"
            : "border-gray-300 bg-gradient-to-br from-white via-blue-50/30 to-violet-50/50 hover:border-violet-300 hover:shadow-md"
        } ${isAtLimit ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (!isAtLimit) {
            document.getElementById("artwork-image-upload").click();
          }
        }}
        style={{ userSelect: "none" }}
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-violet-200/20 to-purple-300/20 rounded-full blur-xl animate-pulse" />
          <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-blue-200/20 to-cyan-300/20 rounded-full blur-xl animate-pulse delay-1000" />
        </div>

        <input
          id="artwork-image-upload"
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={(e) => onFilesSelected(Array.from(e.target.files))}
          disabled={isAtLimit}
        />

        <div className="relative p-12 flex flex-col items-center justify-center space-y-4">
          {/* Icon with animation */}
          <div className={`relative ${isDragActive ? "animate-bounce" : ""}`}>
            <div className="absolute inset-0 bg-gradient-to-r from-violet-400 to-purple-500 rounded-full blur-lg opacity-20 animate-pulse" />
            <div className="relative bg-white/80 backdrop-blur-sm p-4 rounded-2xl shadow-lg border border-white/20">
              {isDragActive ? (
                <PlusIcon className="h-8 w-8 text-violet-500" />
              ) : (
                <PhotoIcon className="h-8 w-8 text-gray-400" />
              )}
            </div>
          </div>

          {/* Text content */}
          <div className="text-center space-y-2">
            <h3 className="text-lg font-medium text-gray-900">
              {isDragActive ? "Drop your images here!" : "Add Your Artwork"}
            </h3>
            <p className="text-sm text-gray-600">
              {isAtLimit
                ? "Upload limit reached"
                : "Drag & drop images or click to browse"}
            </p>
            <p className="text-xs text-gray-400">
              Supports PNG, JPG • Up to {fileSizeMB}MB per image
            </p>
          </div>
        </div>
      </div>

      {/* Carousel indicator note */}
      {images.some((img) => img.showInCarousel) && (
        <div className="flex items-center space-x-2 text-xs text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg border border-indigo-100">
          <svg
            className="h-4 w-4 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path
              fillRule="evenodd"
              d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
              clipRule="evenodd"
            />
          </svg>
          <span className="font-medium">Carousel Image</span>
          <span className="text-indigo-500">
            • This image appears on the homepage carousel
          </span>
        </div>
      )}

      {/* Validation Error Messages */}
      {validationErrors.length > 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 transition-all duration-300">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">
                Validation Error
              </h3>
              <div className="mt-2 text-sm space-y-1 text-red-700">
                {validationErrors.map((err, i) => (
                  <div key={i}>• {err}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Error Messages */}
      {imageErrors.length > 0 && (
        <div
          className={`rounded-2xl border p-4 transition-all duration-300 ${
            isAutoDismissible
              ? "bg-amber-50 border-amber-200"
              : "bg-amber-50 border-amber-200"
          }`}
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              {isAutoDismissible ? (
                <svg
                  className="h-5 w-5 text-amber-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5 text-amber-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <h3
                className={`text-sm font-medium ${
                  isAutoDismissible ? "text-amber-800" : "text-amber-800"
                }`}
              >
                {isAutoDismissible ? "File Not Added" : "Upload Errors"}
              </h3>
              <div
                className={`mt-2 text-sm space-y-1 ${
                  isAutoDismissible ? "text-amber-700" : "text-amber-700"
                }`}
              >
                {imageErrors.map((err, i) => (
                  <div key={i}>• {err}</div>
                ))}
              </div>
              {isAutoDismissible && (
                <p className="mt-2 text-xs text-amber-600">
                  This message will disappear automatically in a few seconds
                </p>
              )}
            </div>
            <div className="flex-shrink-0">
              <button
                onClick={() => {
                  if (typeof onDismissErrors === "function") {
                    onDismissErrors();
                  }
                }}
                className={`transition-colors ${
                  isAutoDismissible
                    ? "text-amber-400 hover:text-amber-600"
                    : "text-amber-400 hover:text-amber-600"
                }`}
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
            <h3 className="text-sm font-medium text-gray-700 font-sans">
              <span className="hidden sm:inline">
                Drag to reorder your images
              </span>
              <span className="sm:hidden">
                Touch and hold to reorder images
              </span>
            </h3>
            <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md font-sans self-start sm:self-auto">
              Primary image appears first
            </div>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
          >
            <SortableContext
              items={images.map((img) => img.uuid)}
              strategy={horizontalListSortingStrategy}
            >
              <div className="p-4 sm:p-6 bg-gradient-to-br from-gray-50/50 via-white to-violet-50/30 rounded-3xl border border-gray-200/50 backdrop-blur-sm">
                <div className="grid grid-cols-[repeat(auto-fill,minmax(90px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-3 sm:gap-4 place-items-center">
                  {images.map((img, idx) => (
                    <div
                      key={img.uuid || idx}
                      className="relative w-full max-w-[90px] sm:max-w-[100px]"
                    >
                      <SortableImage
                        img={img}
                        idx={idx}
                        onRemove={handleRemoveImage}
                        isSuperAdmin={isSuperAdmin}
                      />
                      {isSuperAdmin && (
                        <label className="flex items-center space-x-1 mt-2 w-full min-w-0">
                          <input
                            type="checkbox"
                            checked={!!img.showInCarousel}
                            onChange={(e) => {
                              const updated = images.map((image, i) =>
                                i === idx
                                  ? {
                                      ...image,
                                      showInCarousel: e.target.checked,
                                    }
                                  : image
                              );
                              setImages(updated);
                            }}
                            className="h-3 w-3 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 flex-shrink-0"
                          />
                          <span className="text-xs text-gray-700 font-sans truncate leading-tight">
                            <span className="hidden sm:inline">
                              Show in Carousel
                            </span>
                            <span className="sm:hidden">Carousel</span>
                          </span>
                        </label>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
}
