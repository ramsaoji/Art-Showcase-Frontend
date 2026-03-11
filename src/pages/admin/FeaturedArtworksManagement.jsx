import { useState, useEffect, memo, useCallback } from "react";
import { toast } from "sonner";
import { AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ChevronUpDownIcon from "@heroicons/react/24/solid/ChevronUpDownIcon";
import ArrowRightCircleIcon from "@heroicons/react/24/solid/ArrowRightCircleIcon";
import ArrowLeftCircleIcon from "@heroicons/react/24/solid/ArrowLeftCircleIcon";
import ArrowUpCircleIcon from "@heroicons/react/24/solid/ArrowUpCircleIcon";
import { Skeleton } from "@/components/ui/skeleton";
import Badge from "@/components/artwork/Badge";
import { getFriendlyErrorMessage } from "@/utils/formatters";
import { getThumbnailUrl } from "@/utils/cloudinary";
import useMediaQuery from "@/hooks/useMediaQuery";
import SectionHeader from "@/components/common/SectionHeader";
import ScrollableListPanel from "@/components/common/ScrollableListPanel";
import LoadMoreTrigger from "@/components/common/LoadMoreTrigger";
import LoadingButton from "@/components/common/LoadingButton";

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

/**
 * FeaturedArtworksManagement Page
 * Admin view for selecting and reordering featured artworks.
 * Supports drag-and-drop reordering via @dnd-kit. Uses sonner toast for feedback (S4).
 */
const FeaturedArtworksManagement = () => {
  const [available, setAvailable] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [availableOffset, setAvailableOffset] = useState(0);
  const [featuredOffset, setFeaturedOffset] = useState(0);
  const [hasMoreAvailable, setHasMoreAvailable] = useState(true);
  const [hasMoreFeatured, setHasMoreFeatured] = useState(true);
  const limit = 10;
  const [previousAvailable, setPreviousAvailable] = useState([]);
  const [previousFeatured, setPreviousFeatured] = useState([]);
  const [originalFeatured, setOriginalFeatured] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // Independent queries for available and featured artworks
  const {
    data: availableData,
    isLoading: isLoadingAvailable,
    isFetching: isFetchingAvailable,
  } = trpc.artwork.getAvailableArtworksAdmin.useQuery(
    { limit, offset: availableOffset },
    {
      keepPreviousData: true,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 2 * 60 * 1000,
    }
  );
  const {
    data: featuredData,
    isLoading: isLoadingFeatured,
    isFetching: isFetchingFeatured,
  } = trpc.artwork.getFeaturedArtworksAdmin.useQuery(
    { limit, offset: featuredOffset },
    {
      keepPreviousData: true,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 2 * 60 * 1000,
    }
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
      await Promise.all([
        utils.artwork.getAvailableArtworksAdmin.invalidate(),
        utils.artwork.getFeaturedArtworksAdmin.invalidate(),
        utils.artwork.getFeaturedArtworks.invalidate(),
        utils.artwork.getAllArtworks.invalidate(),
      ]);
      setOriginalFeatured([...featured]);
      setIsSaving(false);
      toast.success("Featured artworks updated!");
    },
    onError: (error) => {
      setAvailable(previousAvailable);
      setFeatured(previousFeatured);
      setIsSaving(false);
      toast.error(getFriendlyErrorMessage(error));
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
    // Drag started
  };
  const handleDragEnd = (event) => {
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
    // Drag cancelled
  };

  const toggleFeatured = useCallback((artwork) => {
    if (featured.some((a) => a.id === artwork.id)) {
      setFeatured((prev) => prev.filter((a) => a.id !== artwork.id));
      setAvailable((prev) => [artwork, ...prev]);
    } else if (available.some((a) => a.id === artwork.id)) {
      setAvailable((prev) => prev.filter((a) => a.id !== artwork.id));
      setFeatured((prev) => [artwork, ...prev]);
    }
  }, [featured, available]);

  const handleSaveChanges = useCallback(() => {
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
  }, [featured, available, updateFeatured]);



  // Success, error, and unsaved changes messages at the top
  const hasUnsavedChanges =
    JSON.stringify(featured) !== JSON.stringify(originalFeatured);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 font-sans">
        <div className="h-full flex flex-col">
          <SectionHeader
            title="Available Artworks"
            description="Click on an artwork to add it to the featured list. Use the Load More button to browse all available artworks."
          />
          <ScrollableListPanel>
            {isLoadingAvailable && available.length === 0 ? (
              <div className="flex flex-col gap-3 min-h-[10rem] p-2">
                <Skeleton className="h-16 w-full rounded-2xl" />
                <Skeleton className="h-16 w-full rounded-2xl opacity-80" />
                <Skeleton className="h-16 w-full rounded-2xl opacity-60" />
              </div>
            ) : (
              <AnimatePresence>
                {available.length === 0 && (
                  <div className="text-center text-gray-400 py-8">
                    No available artworks.
                  </div>
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
            <LoadMoreTrigger
              onClick={handleLoadMoreAvailable}
              isLoading={isFetchingAvailable && available.length > 0}
              label={hasMoreAvailable && !isFetchingAvailable ? "Load More" : undefined}
            />
            {!hasMoreAvailable && available.length > 0 && (
              <div className="text-center text-xs text-gray-400 py-2">
                All available artworks loaded
              </div>
            )}
          </ScrollableListPanel>
          <div className="mt-4 md:mt-auto flex justify-end pt-4 md:pt-6 invisible">
            <div className="px-6 py-2 rounded-lg" style={{ visibility: "hidden" }}>Spacer</div>
          </div>
        </div>
        <div className="h-full flex flex-col">
          <SectionHeader
            title="Featured Artworks"
            description="Drag to reorder. Click to unfeature. Use the Load More button to see more featured artworks."
          />
          <ScrollableListPanel>
            {isLoadingFeatured && featured.length === 0 ? (
              <div className="flex flex-col gap-3 min-h-[10rem] p-2">
                <Skeleton className="h-16 w-full rounded-2xl" />
                <Skeleton className="h-16 w-full rounded-2xl opacity-80" />
                <Skeleton className="h-16 w-full rounded-2xl opacity-60" />
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
                      <div className="text-center text-gray-400 py-8">
                        No featured artworks.
                      </div>
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
            <LoadMoreTrigger
              onClick={handleLoadMoreFeatured}
              isLoading={isFetchingFeatured && featured.length > 0}
              label={hasMoreFeatured && !isFetchingFeatured ? "Load More" : undefined}
            />
            {!hasMoreFeatured && featured.length > 0 && (
              <div className="text-center text-xs text-gray-400 py-2">
                All featured artworks loaded
              </div>
            )}
          </ScrollableListPanel>
          <div className="mt-4 md:mt-auto flex justify-end pt-4 md:pt-6">
            <LoadingButton
              onClick={handleSaveChanges}
              loading={isSaving}
              loadingLabel="Saving..."
              disabled={!hasUnsavedChanges}
              className="w-full md:w-auto"
            >
              Save Changes
            </LoadingButton>
          </div>
        </div>
      </div>
    </>
  );
};

export default FeaturedArtworksManagement;
