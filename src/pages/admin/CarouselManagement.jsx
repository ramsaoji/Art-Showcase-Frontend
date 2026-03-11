import { useState, useEffect, useRef, memo, useCallback } from "react";
import { toast } from "sonner";
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
import CheckIcon from "@heroicons/react/24/solid/CheckIcon";
import ChevronUpDownIcon from "@heroicons/react/24/solid/ChevronUpDownIcon";

import { Skeleton } from "@/components/ui/skeleton";
import Badge from "@/components/artwork/Badge";
import { getFriendlyErrorMessage } from "@/utils/formatters";
import { getThumbnailUrl } from "@/utils/cloudinary";
import SectionHeader from "@/components/common/SectionHeader";
import ScrollableListPanel from "@/components/common/ScrollableListPanel";
import LoadMoreTrigger from "@/components/common/LoadMoreTrigger";
import LoadingButton from "@/components/common/LoadingButton";

const SortableItem = memo(function SortableItem({
  id,
  image,
  handleToggle,
  isSelected,
  orderNumber,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      style={style}
      className="p-3 rounded-xl bg-white/90 shadow-md border border-gray-200 hover:bg-indigo-50 group relative select-none cursor-pointer"
      tabIndex={0}
      title={image.artwork.title}
      onClick={() => handleToggle(id)}
    >
      {/* Mobile Layout */}
      <div className="flex md:hidden flex-col gap-3">
        {/* Top row: Order number and action button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {typeof orderNumber === "number" && orderNumber != null ? (
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-300 flex-shrink-0">
                {orderNumber}
              </span>
            ) : null}
            {isSelected && (
              <Badge type="featured" variant="simple" className="text-xs">
                Selected
              </Badge>
            )}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleToggle(id);
            }}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200  ${
              isSelected ? "bg-indigo-600" : "bg-gray-200"
            }`}
            aria-label={
              isSelected ? "Deselect from carousel" : "Select for carousel"
            }
            tabIndex={0}
          >
            {isSelected && <CheckIcon className="w-4 h-4 text-white" />}
          </button>
        </div>

        {/* Content row: Image, title, artist, drag btn */}
        <div className="flex items-center gap-3">
          <img
            src={image.cloudinary_public_id ? getThumbnailUrl(image.cloudinary_public_id) : image.url}
            alt={image.artwork.title}
            className="w-10 h-10 object-cover rounded-lg shadow-sm border border-gray-100 flex-shrink-0"
            loading="lazy"
          />
          <div className="flex flex-col justify-center min-w-0 flex-1">
            <p
              className="font-semibold text-gray-800 group-hover:text-indigo-700 truncate text-sm"
              title={image.artwork.title}
            >
              {image.artwork.title}
            </p>
            <p
              className="text-xs text-gray-500 truncate"
              title={image.artwork.artistName}
            >
              {image.artwork.artistName}
            </p>
          </div>
          {/* Drag button for mobile beside title/artist */}
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
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex items-center gap-3">
        {/* Left section: Order number, image, and content */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {typeof orderNumber === "number" && orderNumber != null ? (
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-300 flex-shrink-0">
              {orderNumber}
            </span>
          ) : null}
          <img
            src={image.cloudinary_public_id ? getThumbnailUrl(image.cloudinary_public_id) : image.url}
            alt={image.artwork.title}
            className="w-10 h-10 object-cover rounded-lg shadow-sm border border-gray-100 flex-shrink-0"
            loading="lazy"
          />
          <div className="flex flex-col justify-center min-w-0 flex-1">
            <p
              className="font-semibold text-gray-800 group-hover:text-indigo-700 truncate"
              title={image.artwork.title}
            >
              {image.artwork.title}
            </p>
            <p
              className="text-xs text-gray-500 truncate"
              title={image.artwork.artistName}
            >
              {image.artwork.artistName}
            </p>
          </div>
        </div>

        {/* Center section: Status */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isSelected && (
            <Badge type="featured" variant="simple" className="text-xs">
              Selected
            </Badge>
          )}
        </div>

        {/* Right section: Action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            tabIndex={0}
            aria-label="Drag to reorder"
            className="flex items-center justify-center w-10 h-10 cursor-move bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300 transition-colors"
            style={{ touchAction: "none" }}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
          >
            <ChevronUpDownIcon
              className="w-4 h-4 text-gray-600"
              title="Drag to reorder"
            />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleToggle(id);
            }}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200  ${
              isSelected ? "bg-indigo-600" : "bg-gray-200"
            }`}
            aria-label={
              isSelected ? "Deselect from carousel" : "Select for carousel"
            }
            tabIndex={0}
          >
            {isSelected && <CheckIcon className="w-4 h-4 text-white" />}
          </button>
        </div>
      </div>
    </div>
  );
});

/**
 * CarouselManagement Page
 * Admin view for selecting and reordering carousel images.
 * Supports drag-and-drop reordering via @dnd-kit. Uses sonner toast for feedback (S4).
 */
const CarouselManagement = () => {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [previousItems, setPreviousItems] = useState([]);
  const [previousSelected, setPreviousSelected] = useState([]);
  const [originalItems, setOriginalItems] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const limit = 10;

  const { data, isLoading, isFetching } =
    trpc.artwork.getCarouselImages.useQuery(
      { limit, offset },
      {
        keepPreviousData: true,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        staleTime: 2 * 60 * 1000,
      }
    );
  const updateCarouselOrder = trpc.artwork.updateCarouselOrder.useMutation({
    onMutate: () => {
      // Optimistic update - update the UI when mutation starts
      const orderedSelectedItems = items.filter((item) =>
        selected.includes(item.id)
      );
      setItems((prev) =>
        prev.map((item) => ({
          ...item,
          showInCarousel: selected.includes(item.id),
          carouselOrder: selected.includes(item.id)
            ? orderedSelectedItems.findIndex(
                (selectedItem) => selectedItem.id === item.id
              )
            : null,
        }))
      );
    },
    onSuccess: async () => {
      await Promise.all([
        utils.artwork.getCarouselImages.invalidate(),
        utils.artwork.getArtworksForHeroCarousel.invalidate(),
        utils.artwork.getAllArtworks.invalidate(),
      ]);
      setOriginalItems([...items]);
      setIsSaving(false);
      setOffset(0);
      toast.success("Carousel updated successfully!");
    },
    onError: (error) => {
      setItems(previousItems);
      setSelected(previousSelected);
      setIsSaving(false);
      toast.error(getFriendlyErrorMessage(error));
    },
  });
  const utils = trpc.useContext();

  useEffect(() => {
    if (data) {
      if (offset === 0) {
        setItems(data.items);
        setOriginalItems(data.items);
      } else {
        setItems((prev) => [...prev, ...data.items]);
        setOriginalItems((prev) => [...prev, ...data.items]);
      }
      const selectedImages = data.items.filter((img) => img.showInCarousel);
      selectedImages.sort(
        (a, b) => (a.carouselOrder || 0) - (b.carouselOrder || 0)
      );
      if (offset === 0) {
        setSelected(selectedImages.map((img) => img.id));
      } else {
        setSelected((prev) => [
          ...prev,
          ...selectedImages
            .filter((img) => !prev.includes(img.id))
            .map((img) => img.id),
        ]);
      }
      setHasMore(offset + data.items.length < data.total);
    }
  }, [data, offset]);

  const handleLoadMore = () => {
    setOffset((prev) => prev + limit);
  };

  const sensors = useSensors(
    useSensor(TouchSensor),
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setItems((currentItems) => {
        const oldIndex = currentItems.findIndex(
          (item) => item.id === active.id
        );
        const newIndex = currentItems.findIndex((item) => item.id === over.id);
        return arrayMove(currentItems, oldIndex, newIndex);
      });
    }
  };

  const handleToggle = useCallback((id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const handleSaveChanges = useCallback(() => {
    const orderedSelectedItems = items.filter((item) =>
      selected.includes(item.id)
    );
    const payload = items.map((item) => {
      const isShown = selected.includes(item.id);
      const order = isShown
        ? orderedSelectedItems.findIndex(
            (selectedItem) => selectedItem.id === item.id
          )
        : null;
      return {
        id: item.id,
        carouselOrder: order,
        showInCarousel: isShown,
      };
    });

    // Set saving state immediately
    setIsSaving(true);

    // Store current state for optimistic update rollback
    setPreviousItems([...items]);
    setPreviousSelected([...selected]);

    // Perform the actual update
    updateCarouselOrder.mutate({ images: payload });
  }, [items, selected, updateCarouselOrder]);

  const hasUnsavedChanges =
    JSON.stringify(
      items.map((i) => ({ id: i.id, showInCarousel: selected.includes(i.id) }))
    ) !==
    JSON.stringify(
      originalItems.map((i) => ({
        id: i.id,
        showInCarousel: i.showInCarousel,
      }))
    );


  return (
    <div className="font-sans w-full">
      <SectionHeader
        title="Manage Carousel Images"
        description="Select images to display in the homepage carousel and drag to set the order. The top-most selected image will appear first."
      />
      <ScrollableListPanel>
        {isLoading && items.length === 0 ? (
          <div className="flex flex-col gap-3 min-h-[10rem] p-2">
            {[1, 0.85, 0.7, 0.55].map((opacity, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-white/90 border border-gray-200 flex items-center gap-3"
                style={{ opacity }}
              >
                {/* Order badge */}
                <Skeleton className="w-6 h-6 rounded-full flex-shrink-0" />
                {/* Thumbnail */}
                <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
                {/* Title + artist */}
                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                  <Skeleton className="h-4 w-3/5 rounded" />
                  <Skeleton className="h-3 w-2/5 rounded" />
                </div>
                {/* Status badge */}
                <Skeleton className="h-5 w-16 rounded-full flex-shrink-0" />
                {/* Drag handle */}
                <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
                {/* Toggle button */}
                <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
              </div>
            ))}
          </div>
        ) : (
          <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            {items.map((item, idx) => (
              <SortableItem
                key={item.id}
                id={item.id}
                image={item}
                handleToggle={handleToggle}
                isSelected={selected.includes(item.id)}
                orderNumber={idx + 1}
              />
            ))}
          </SortableContext>
          </DndContext>
        )}
        <LoadMoreTrigger
          onClick={handleLoadMore}
          isLoading={isFetching && items.length > 0}
          label={hasMore && !isFetching ? "Load More" : undefined}
        />
        {!hasMore && items.length > 0 && (
          <div className="text-center text-xs text-gray-400 py-2">
            All carousel images loaded
          </div>
        )}
      </ScrollableListPanel>
      <div className="mt-8 flex justify-end">
        <LoadingButton
          onClick={handleSaveChanges}
          loading={isSaving}
          loadingLabel="Saving..."
          disabled={!hasUnsavedChanges}
        >
          Save Changes
        </LoadingButton>
      </div>
    </div>
  );
};

export default CarouselManagement;
