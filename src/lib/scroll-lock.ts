let activeLocks = 0;

export function useScrollLock(isLocked: boolean) {
  if (typeof window === "undefined") {
    return;
  }

  if (isLocked) {
    activeLocks += 1;

    if (activeLocks === 1) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      activeLocks = Math.max(0, activeLocks - 1);

      if (activeLocks === 0) {
        document.body.style.overflow = "";
      }
    };
  }

  return undefined;
}
