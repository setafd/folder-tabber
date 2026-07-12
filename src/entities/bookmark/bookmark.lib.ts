interface ResolveMoveIndexArgs {
  /** Whether the drop target container is the same as the drag source container. */
  isSameContainer: boolean;
  /** Whether the pointer was released below the hovered item's vertical center. */
  isBelow: boolean | null;
  /** Index of the dragged item within its container. */
  oldIndex: number;
  /** Index of the hovered item within the target container. */
  overIndex: number;
}

interface ResolvedMove {
  /** Index to splice the item into for the local (optimistic) list. */
  localIndex: number;
  /** Index to pass to `chrome.bookmarks.move` (accounts for Chrome's move semantics). */
  apiIndex: number;
}

export const resolveMoveIndex = ({
  isSameContainer,
  isBelow,
  oldIndex,
  overIndex,
}: ResolveMoveIndexArgs): ResolvedMove | null => {
  let localIndex: number;

  if (isSameContainer) {
    if (overIndex === oldIndex) return null;
    localIndex =
      overIndex < oldIndex ? (isBelow ? overIndex + 1 : overIndex) : isBelow ? overIndex : overIndex - 1;
  } else {
    localIndex = overIndex;
  }

  const apiIndex = isBelow ? (isSameContainer ? localIndex + 1 : localIndex) : localIndex;

  return { localIndex, apiIndex };
};
