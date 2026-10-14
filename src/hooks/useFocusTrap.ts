import { useEffect, useRef } from 'react';

/** Open traps, innermost last — only the top one reacts to Escape/Tab. */
const stack: object[] = [];

/**
 * Traps focus inside a modal/dialog element and closes it on Escape.
 * Returns a ref to attach to the dialog container.
 */
export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(onEscape?: () => void) {
  const ref = useRef<T>(null);
  const escapeRef = useRef(onEscape);
  useEffect(() => {
    escapeRef.current = onEscape;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const token = {};
    stack.push(token);

    // Focus the first focusable element
    const focusables = getFocusables(el);
    if (focusables.length > 0) {
      focusables[0].focus();
    } else {
      el.focus();
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (stack[stack.length - 1] !== token) return; // a nested dialog is on top
      if (e.key === 'Escape') {
        if (escapeRef.current) {
          e.preventDefault();
          escapeRef.current();
        }
        return;
      }
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
      stack.splice(stack.indexOf(token), 1);
      previouslyFocused?.focus();
    };
  }, []);

  return ref;
}

function getFocusables(container: HTMLElement): HTMLElement[] {
  const selector = 'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';
  return Array.from(container.querySelectorAll<HTMLElement>(selector));
}
