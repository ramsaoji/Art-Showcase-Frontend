import React, { useState, useEffect, memo, useRef } from "react";
import { trpc } from "../../utils/trpc";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Loader from "../../components/ui/Loader";
import Alert from "../../components/Alert";
import { getFriendlyErrorMessage } from "../../utils/formatters";
import { ChevronUpDownIcon } from "@heroicons/react/24/solid";
import Badge from "../../components/Badge";
import { getThumbnailUrl } from "../../config/cloudinary";
import {
  ArrowRightCircleIcon,
  ArrowLeftCircleIcon,
  ArrowDownCircleIcon,
  ArrowUpCircleIcon,
} from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";
import useMediaQuery from "../../hooks/useMediaQuery";

const SortableArtwork = memo(function SortableArtwork({
  id,
  artwork,
  isFeatured,
  onClick,
  tooltip,
  orderNumber,
  style,
  ...props
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const cardStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 1,
    ...style,
  };

  const isMobile = useMediaQuery("(max-width: 640px)");

  return (
    <div
      ref={setNodeRef}
      style={cardStyle}
      className="p-3 rounded-xl bg-white/90 shadow-md border border-gray-200 hover:bg-indigo-50 group relative select-none cursor-pointer"
      tabIndex={0}
      title={tooltip}
      {...attributes}
      {...props}
      onClick={onClick}
    >
      {/* Mobile Layout */}
      <div className="flex md:hidden flex-col gap-3">
        {/* Top row: Order number and action button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {orderNumber !== undefined && (
              <span
                className={`flex items-center justify-center w-6 h-6 rounded-full ${
                  isFeatured
                    ? "bg-indigo-100 text-indigo-700 border-indigo-300"
                    : "bg-gray-100 text-gray-700 border-gray-300"
                } font-bold text-xs border flex-shrink-0`}
              >
                {orderNumber}
              </span>
            )}
            {isFeatured ? (
              <Badge type="featured" variant="simple" className="text-xs">
                Featured
              </Badge>
            ) : (
              <Badge type="default" variant="simple" className="text-xs">
                Available
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isFeatured ? (
              <button
                type="button"
                className="focus:outline-none p-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                }}
                tabIndex={0}
                aria-label="Unfeature artwork"
              >
                {isMobile ? (
                  <ArrowUpCircleIcon className="w-5 h-5 text-indigo-400" />
                ) : (
                  <ArrowLeftCircleIcon className="w-5 h-5 text-indigo-400" />
                )}
              </button>
            ) : isMobile ? (
              <ArrowDownCircleIcon className="w-5 h-5 text-indigo-400" />
            ) : (
              <ArrowRightCircleIcon className="w-5 h-5 text-indigo-400" />
            )}
          </div>
        </div>

        {/* Content row: Image, title, artist */}
        <div className="flex items-center gap-3">
          <img
            src={artwork.images[0]?.cloudinary_public_id ? getThumbnailUrl(artwork.images[0].cloudinary_public_id) : (artwork.images[0]?.url || "https://via.placeholder.com/40")}
            alt={artwork.title}
            className="w-10 h-10 object-cover rounded-lg shadow-sm border border-gray-100 flex-shrink-0"
            loading="lazy"
          />
          <div className="flex flex-col justify-center min-w-0 flex-1">
            <p
              className="font-semibold text-gray-800 group-hover:text-indigo-700 truncate text-sm"
              title={artwork.title}
            >
              {artwork.title}
            </p>
            <p
              className="text-xs text-gray-500 truncate"
              title={artwork.artistName}
            >
              {artwork.artistName}
            </p>
          </div>
          {/* Drag button for featured artworks on mobile */}
          {isFeatured && (
            <button
              type="button"
              tabIndex={0}
              aria-label="Drag to reorder"
              className="flex items-center justify-center w-8 h-8 cursor-move bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300 ml-2"
              style={{ touchAction: "none" }}
              {...listeners}
              onClick={(e) => e.stopPropagation()}
            >
              <ChevronUpDownIcon
                className="w-4 h-4 text-gray-600"
                title="Drag to reorder"
              />
            </button>
          )}
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex items-center gap-3">
        {/* Left section: Order number, image, and content */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {isFeatured && orderNumber !== undefined && (
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-300 flex-shrink-0">
              {orderNumber}
            </span>
          )}
          {!isFeatured && orderNumber !== undefined && (
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-gray-700 font-bold text-xs border border-gray-300 flex-shrink-0">
              {orderNumber}
            </span>
          )}
          <img
            src={artwork.images[0]?.cloudinary_public_id ? getThumbnailUrl(artwork.images[0].cloudinary_public_id) : (artwork.images[0]?.url || "https://via.placeholder.com/40")}
            alt={artwork.title}
            className="w-10 h-10 object-cover rounded-lg shadow-sm border border-gray-100 flex-shrink-0"
            loading="lazy"
          />
          <div className="flex flex-col justify-center min-w-0 flex-1">
            <div className="flex items-center min-w-0 gap-2">
              <p
                className="font-semibold text-gray-800 group-hover:text-indigo-700 truncate flex-1"
                title={artwork.title}
              >
                {artwork.title}
              </p>
            </div>
            <p
              className="text-xs text-gray-500 truncate"
              title={artwork.artistName}
            >
              {artwork.artistName}
            </p>
          </div>
        </div>

        {/* Center section: Status badges */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isFeatured && (
            <Badge type="featured" variant="simple" className="flex-shrink-0">
              Featured
            </Badge>
          )}
          {!isFeatured && (
            <Badge type="default" variant="simple" className="flex-shrink-0">
              Available
            </Badge>
          )}
        </div>

        {/* Right section: Action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isFeatured && (
            <button
              type="button"
              tabIndex={0}
              aria-label="Drag to reorder"
              className="flex items-center justify-center w-10 h-10 cursor-move bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300"
              style={{ touchAction: "none" }}
              {...listeners}
              onClick={(e) => e.stopPropagation()}
            >
              <ChevronUpDownIcon
                className="w-4 h-4 text-gray-600"
                title="Drag to reorder"
              />
            </button>
          )}
          <div title={isFeatured ? "Click to unfeature" : "Click to feature"}>
            {isFeatured ? (
              <button
                type="button"
                className="focus:outline-none p-1 hover:bg-gray-100 rounded transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                }}
                tabIndex={0}
                aria-label="Unfeature artwork"
              >
                {isMobile ? (
                  <ArrowUpCircleIcon className="w-5 h-5 text-indigo-400" />
                ) : (
                  <ArrowLeftCircleIcon className="w-5 h-5 text-indigo-400" />
                )}
              </button>
            ) : isMobile ? (
              <ArrowDownCircleIcon className="w-5 h-5 text-indigo-400" />
            ) : (
              <ArrowRightCircleIcon className="w-5 h-5 text-indigo-400" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

const FeaturedArtworksManagement = () => {
  const [available, setAvailable] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [availableOffset, setAvailableOffset] = useState(0);
  const [featuredOffset, setFeaturedOffset] = useState(0);
  const [hasMoreAvailable, setHasMoreAvailable] = useState(true);
  const [hasMoreFeatured, setHasMoreFeatured] = useState(true);
  const limit = 10;
  const [showSuccess, setShowSuccess] = useState(false);
  const [previousAvailable, setPreviousAvailable] = useState([]);
  const [previousFeatured, setPreviousFeatured] = useState([]);
  const [originalFeatured, setOriginalFeatured] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const successTimeout = useRef();

  // Independent queries for available and featured artworks
  const {
    data: availableData,
    isLoading: isLoadingAvailable,
    isFetching: isFetchingAvailable,
    error: errorAvailable,
    refetch: refetchAvailable,
  } = trpc.artwork.getAvailableArtworksAdmin.useQuery(
    { limit, offset: availableOffset },
    { keepPreviousData: true }
  );
  const {
    data: featuredData,
    isLoading: isLoadingFeatured,
    isFetching: isFetchingFeatured,
    error: errorFeatured,
    refetch: refetchFeatured,
  } = trpc.artwork.getFeaturedArtworksAdmin.useQuery(
    { limit, offset: featuredOffset },
    { keepPreviousData: true }
  );
  const updateFeatured = trpc.artwork.updateFeaturedArtworks.useMutation({
    onMutate: () => {
      // Optimistic update - update the UI when mutation starts
      setAvailable((prev) => prev.filter((a) => !a.featured));
      setFeatured((prev) =>
        prev.map((artwork, index) => ({ ...artwork, featuredOrder: index }))
      );
    },
    onSuccess: async () => {
      // Invalidate queries after successful update
      await Promise.all([
        utils.artwork.getAvailableArtworksAdmin.invalidate(),
        utils.artwork.getFeaturedArtworksAdmin.invalidate(),
      ]);

      // Update original state to match current state
      setOriginalFeatured([...featured]);

      // Reset saving state
      setIsSaving(false);

      // Show success message
      setShowSuccess(true);
      if (successTimeout.current) clearTimeout(successTimeout.current);
      successTimeout.current = setTimeout(() => setShowSuccess(false), 3000);

      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    onError: (error) => {
      // Revert optimistic update on error
      setAvailable(previousAvailable);
      setFeatured(previousFeatured);

      // Reset saving state
      setIsSaving(false);

      // Show error message
      console.error("Failed to update featured artworks:", error);
      // You could add error state here if needed
    },
  });

  const utils = trpc.useContext();

  useEffect(() => {
    if (availableData) {
      if (availableOffset === 0) {
        setAvailable(availableData.items);
      } else {
        setAvailable((prev) => [...prev, ...availableData.items]);
      }
      setHasMoreAvailable(
        availableData.total
          ? available.length + availableData.items.length < availableData.total
          : false
      );
    }
  }, [availableData, availableOffset]);

  useEffect(() => {
    if (featuredData) {
      if (featuredOffset === 0) {
        setFeatured(featuredData.items);
        setOriginalFeatured(featuredData.items);
      } else {
        setFeatured((prev) => [...prev, ...featuredData.items]);
        setOriginalFeatured((prev) => [...prev, ...featuredData.items]);
      }
      setHasMoreFeatured(
        featuredData.total
          ? featured.length + featuredData.items.length < featuredData.total
          : false
      );
    }
  }, [featuredData, featuredOffset]);

  const handleLoadMoreAvailable = () => {
    setAvailableOffset((prev) => prev + limit);
  };
  const handleLoadMoreFeatured = () => {
    setFeaturedOffset((prev) => prev + limit);
  };

  const sensors = useSensors(
    useSensor(TouchSensor),
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event) => {
    console.log("Drag started", event);
  };
  const handleDragEnd = (event) => {
    console.log("Drag ended", event);
    const { active, over } = event;
    if (!over) return;
    if (active.id !== over.id) {
      setFeatured((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };
  const handleDragCancel = () => {
    console.log("Drag cancelled");
  };

  const toggleFeatured = (artwork) => {
    if (featured.some((a) => a.id === artwork.id)) {
      setFeatured((prev) => prev.filter((a) => a.id !== artwork.id));
      setAvailable((prev) => [artwork, ...prev]);
    } else if (available.some((a) => a.id === artwork.id)) {
      setAvailable((prev) => prev.filter((a) => a.id !== artwork.id));
      setFeatured((prev) => [artwork, ...prev]);
    }
  };

  const handleSaveChanges = () => {
    const payload = featured
      .map((artwork, index) => ({
        id: artwork.id,
        featured: true,
        featuredOrder: index,
      }))
      .concat(
        available
          .filter((a) => a.featured === true)
          .map((a) => ({
            id: a.id,
            featured: false,
            featuredOrder: 0,
          }))
      );

    // Set saving state immediately
    setIsSaving(true);

    // Store current state for optimistic update rollback
    setPreviousAvailable([...available]);
    setPreviousFeatured([...featured]);

    // Perform the actual update
    updateFeatured.mutate({ artworks: payload });
  };

  if (
    (isLoadingAvailable && available.length === 0) ||
    (isLoadingFeatured && featured.length === 0)
  )
    return (
      <div className="flex justify-center items-center min-h-[32rem]">
        <Loader size="medium" />
      </div>
    );
  if (errorAvailable || errorFeatured) {
    // Scroll to top to show error message
    React.useEffect(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    return (
      <Alert
        type="error"
        message={getFriendlyErrorMessage(errorAvailable || errorFeatured)}
        className="mb-4"
      />
    );
  }

  // Success, error, and unsaved changes messages at the top
  const hasUnsavedChanges =
    JSON.stringify(featured) !== JSON.stringify(originalFeatured);

  return (
    <>
      {showSuccess && (
        <Alert
          type="success"
          message="Featured artworks updated!"
          className="mb-4"
        />
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 font-sans">
        <div className="h-full flex flex-col">
          <h3 className="text-lg md:text-xl font-semibold mb-2 text-gray-800">
            Available Artworks
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Click on an artwork to add it to the featured list. Use the Load
            More button to browse all available artworks.
          </p>
          <div className="space-y-3 min-h-[20rem] max-h-[60vh] overflow-y-auto bg-gray-50/50 border border-gray-200 rounded-xl p-4">
            {isLoadingAvailable && available.length === 0 ? (
              <div className="flex justify-center items-center min-h-[10rem]">
                <Loader size="medium" />
              </div>
            ) : (
              <AnimatePresence>
                {available.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center text-gray-400 py-8"
                  >
                    No available artworks.
                  </motion.div>
                )}
                {available.map((artwork, idx) => (
                  <SortableArtwork
                    key={artwork.id}
                    id={artwork.id}
                    artwork={artwork}
                    isFeatured={false}
                    onClick={() => toggleFeatured(artwork)}
                    tooltip="Click to feature"
                    orderNumber={idx + 1}
                  />
                ))}
              </AnimatePresence>
            )}
            {isFetchingAvailable && available.length > 0 && (
              <div className="flex justify-center py-2">
                <Loader size="small" />
              </div>
            )}
            {hasMoreAvailable && !isFetchingAvailable && (
              <div className="flex justify-center mt-4">
                <span
                  onClick={handleLoadMoreAvailable}
                  className="inline-flex items-center gap-2 text-indigo-600 font-semibold cursor-pointer hover:text-indigo-800 hover:underline hover:-translate-y-0.5 transition"
                  style={{ fontSize: "1rem" }}
                >
                  <ArrowDownCircleIcon className="w-5 h-5 text-indigo-400" />
                  Load More
                </span>
              </div>
            )}
            {!hasMoreAvailable && available.length > 0 && (
              <div className="text-center text-xs text-gray-400 py-2">
                All available artworks loaded
              </div>
            )}
          </div>
          <div className="mt-4 md:mt-auto flex justify-end pt-4 md:pt-6 invisible">
            <button
              className="px-6 py-2 rounded-lg"
              style={{ visibility: "hidden" }}
            >
              Spacer
            </button>
          </div>
        </div>
        <div className="h-full flex flex-col">
          <h3 className="text-lg md:text-xl font-semibold mb-2 text-gray-800">
            Featured Artworks
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Drag to reorder. Click to unfeature. Use the Load More button to see
            more featured artworks.
          </p>
          <div className="space-y-3 min-h-[20rem] max-h-[60vh] overflow-y-auto bg-gray-50/50 border border-gray-200 rounded-xl p-4">
            {isLoadingFeatured && featured.length === 0 ? (
              <div className="flex justify-center items-center min-h-[10rem]">
                <Loader size="medium" />
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
              >
                <SortableContext
                  items={featured.map((a) => a.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <AnimatePresence>
                    {featured.length === 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-center text-gray-400 py-8"
                      >
                        No featured artworks.
                      </motion.div>
                    )}
                    {featured.map((artwork, idx) => (
                      <SortableArtwork
                        key={artwork.id}
                        id={artwork.id}
                        artwork={artwork}
                        isFeatured={true}
                        onClick={() => toggleFeatured(artwork)}
                        tooltip="Click to unfeature"
                        orderNumber={idx + 1}
                      />
                    ))}
                  </AnimatePresence>
                </SortableContext>
              </DndContext>
            )}
            {isFetchingFeatured && featured.length > 0 && (
              <div className="flex justify-center py-2">
                <Loader size="small" />
              </div>
            )}
            {hasMoreFeatured && !isFetchingFeatured && (
              <div className="flex justify-center mt-4">
                <span
                  onClick={handleLoadMoreFeatured}
                  className="inline-flex items-center gap-2 text-indigo-600 font-semibold cursor-pointer hover:text-indigo-800 hover:underline hover:-translate-y-0.5 transition"
                  style={{ fontSize: "1rem" }}
                >
                  <ArrowDownCircleIcon className="w-5 h-5 text-indigo-400" />
                  Load More
                </span>
              </div>
            )}
            {!hasMoreFeatured && featured.length > 0 && (
              <div className="text-center text-xs text-gray-400 py-2">
                All featured artworks loaded
              </div>
            )}
          </div>
          <div className="mt-4 md:mt-auto flex justify-end pt-4 md:pt-6">
            <button
              onClick={handleSaveChanges}
              className={`w-full md:w-auto px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-all duration-200 flex items-center justify-center gap-2${
                isSaving || !hasUnsavedChanges
                  ? " opacity-60 pointer-events-none cursor-not-allowed"
                  : ""
              }`}
              disabled={isSaving || !hasUnsavedChanges}
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <Loader size="xsmall" color="indigo-600" />
                  Saving...
                </span>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default FeaturedArtworksManagement;
