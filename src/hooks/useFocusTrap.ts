import { useEffect, useRef } from 'react';

/**
 * Traps focus inside a modal/dialog element.
 * Returns a ref to attach to the dialog container.
 */
export function useFocusTrap<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Focus the first focusable element
    const focusables = getFocusables(el);
    if (focusables.length > 0) {
      focusables[0].focus();
    } else {
      el.focus();
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') return; // let parent handle Escape
      if (e.key !== 'Tab') return;

      const focusables = getFocusables(el!);
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, []);

  return ref;
}

function getFocusables(container: HTMLElement): HTMLElement[] {
  const selector = 'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';
  return Array.from(container.querySelectorAll<HTMLElement>(selector));
}
