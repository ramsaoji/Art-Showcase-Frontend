import React, { useState, useEffect, useRef, memo } from "react";
import { trpc } from "../../utils/trpc";
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
import Loader from "../../components/ui/Loader";
import Alert from "../../components/Alert";
import { getFriendlyErrorMessage } from "../../utils/formatters";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/24/solid";
import { ArrowDownCircleIcon } from "@heroicons/react/24/outline";

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
            {typeof orderNumber === "number" && (
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-300 flex-shrink-0">
                {orderNumber}
              </span>
            )}
            {isSelected && (
              <span className="text-xs text-indigo-600 font-medium">
                Selected
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              tabIndex={0}
              aria-label="Drag to reorder"
              className="flex items-center justify-center w-8 h-8 cursor-move bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300"
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

        {/* Content row: Image, title, artist */}
        <div className="flex items-center gap-3">
          <img
            src={image.url}
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
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex items-center gap-3">
        {/* Left section: Order number, image, and content */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {typeof orderNumber === "number" && (
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-300 flex-shrink-0">
              {orderNumber}
            </span>
          )}
          <img
            src={image.url}
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
            <span className="text-sm text-indigo-600 font-medium">
              Selected
            </span>
          )}
        </div>

        {/* Right section: Action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            tabIndex={0}
            aria-label="Drag to reorder"
            className="flex items-center justify-center w-8 h-8 cursor-move bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300 transition-colors"
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

const CarouselManagement = () => {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [previousItems, setPreviousItems] = useState([]);
  const [previousSelected, setPreviousSelected] = useState([]);
  const [originalItems, setOriginalItems] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const successTimeout = useRef();
  const limit = 5;

  const { data, isLoading, error, refetch, isFetching } =
    trpc.artwork.getCarouselImages.useQuery(
      { limit, offset },
      { keepPreviousData: true }
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
      // Invalidate query after successful update
      await utils.artwork.getCarouselImages.invalidate();

      // Update original state to match current state
      setOriginalItems([...items]);

      // Reset saving state
      setIsSaving(false);

      // Reset offset and show success
      setOffset(0);
      setShowSuccess(true);
      if (successTimeout.current) clearTimeout(successTimeout.current);
      successTimeout.current = setTimeout(() => setShowSuccess(false), 3000);

      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    onError: (error) => {
      // Revert optimistic update on error
      setItems(previousItems);
      setSelected(previousSelected);

      // Reset saving state
      setIsSaving(false);

      // Show error message
      console.error("Failed to update carousel:", error);
      // You could add error state here if needed
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
    useSensor(PointerSensor),
    useSensor(TouchSensor),
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

  const handleToggle = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSaveChanges = () => {
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
  };

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

  if (isLoading && items.length === 0)
    return (
      <div className="flex justify-center items-center min-h-[32rem]">
        <Loader size="medium" />
      </div>
    );
  if (error) {
    // Scroll to top to show error message
    React.useEffect(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    return <Alert type="error" message={getFriendlyErrorMessage(error)} />;
  }

  return (
    <div className="font-sans w-full">
      <h2 className="text-xl font-semibold mb-2 text-gray-800">
        Manage Carousel Images
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        Select images to display in the homepage carousel and drag to set the
        order. The top-most selected image will appear first.
      </p>
      {showSuccess && (
        <Alert
          type="success"
          message="Carousel updated successfully!"
          className="mb-4"
        />
      )}
      <div className="space-y-3 min-h-[20rem] max-h-[60vh] overflow-y-auto bg-gray-50/50 rounded-xl border border-gray-200 p-4">
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
        {isFetching && items.length > 0 && (
          <div className="flex justify-center py-2">
            <Loader size="small" />
          </div>
        )}
        {hasMore && !isFetching && (
          <div className="flex justify-center mt-4">
            <span
              onClick={handleLoadMore}
              className="inline-flex items-center gap-2 text-indigo-600 font-semibold cursor-pointer hover:text-indigo-800 hover:underline hover:-translate-y-0.5 transition"
              style={{ fontSize: "1rem" }}
            >
              <ArrowDownCircleIcon className="w-5 h-5 text-indigo-400" />
              Load More
            </span>
          </div>
        )}
        {!hasMore && items.length > 0 && (
          <div className="text-center text-xs text-gray-400 py-2">
            All carousel images loaded
          </div>
        )}
      </div>
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSaveChanges}
          className={`px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-all duration-200 flex items-center justify-center gap-2${
            isSaving ? " opacity-60 pointer-events-none cursor-not-allowed" : ""
          }`}
          disabled={false}
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
  );
};

export default CarouselManagement;
