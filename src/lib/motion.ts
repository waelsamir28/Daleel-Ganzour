type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => { finished: Promise<void> };
};

export function withViewTransition(update: () => void, onFinished?: () => void) {
  if (typeof document === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    update();
    onFinished?.();
    return;
  }

  const transitionDocument = document as ViewTransitionDocument;
  if (!transitionDocument.startViewTransition) {
    update();
    onFinished?.();
    return;
  }

  const transition = transitionDocument.startViewTransition(update);
  if (onFinished) void transition.finished.then(onFinished, onFinished);
}

