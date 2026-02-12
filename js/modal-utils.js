class ModalUtils {
  static create(options) {
    const {
      modalId,
      closeIds = [],
      cancelIds = [],
      confirmId = null,
      focusId = null,
      trapFocusIds = [],
      closeOnOverlay = true,
      closeOnEscape = true,
      enterConfirms = false,
      onOpen = null,
      onClose = null,
      onConfirm = null
    } = options;

    const modal = document.getElementById(modalId);
    if (!modal) {
      return {
        open: () => {},
        close: () => {},
        isOpen: () => false
      };
    }

    const closeButtons = closeIds.map((id) => document.getElementById(id)).filter(Boolean);
    const cancelButtons = cancelIds.map((id) => document.getElementById(id)).filter(Boolean);
    const confirmButton = confirmId ? document.getElementById(confirmId) : null;

    const getTrapElements = () =>
      trapFocusIds
        .map((id) => document.getElementById(id))
        .filter((el) => el && !el.disabled && el.offsetParent !== null);

    const isOpen = () => modal.style.display !== 'none';

    const close = (result = false) => {
      modal.style.display = 'none';
      if (typeof onClose === 'function') {
        onClose(result);
      }
    };

    const open = () => {
      modal.style.display = 'flex';
      if (typeof onOpen === 'function') {
        onOpen();
      }
      if (focusId) {
        const focusEl = document.getElementById(focusId);
        if (focusEl) {
          setTimeout(() => focusEl.focus(), 10);
        }
      }
    };

    const handleConfirm = () => {
      if (typeof onConfirm === 'function') {
        const shouldClose = onConfirm();
        if (shouldClose === false) {
          return;
        }
      }
      close(true);
    };

    [...closeButtons, ...cancelButtons].forEach((btn) => {
      btn.addEventListener('click', () => close(false));
    });

    if (confirmButton) {
      confirmButton.addEventListener('click', handleConfirm);
    }

    if (closeOnOverlay) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          close(false);
        }
      });
    }

    document.addEventListener('keydown', (e) => {
      if (!isOpen()) return;

      if (closeOnEscape && e.key === 'Escape') {
        e.preventDefault();
        close(false);
        return;
      }

      if (enterConfirms && e.key === 'Enter' && confirmButton) {
        if (e.target && e.target.tagName === 'TEXTAREA') return;
        e.preventDefault();
        handleConfirm();
        return;
      }

      if (e.key === 'Tab' && trapFocusIds.length > 0) {
        const focusable = getTrapElements();
        if (focusable.length === 0) return;

        e.preventDefault();
        const currentIndex = focusable.indexOf(document.activeElement);
        const direction = e.shiftKey ? -1 : 1;
        const nextIndex =
          currentIndex === -1
            ? 0
            : (currentIndex + direction + focusable.length) % focusable.length;
        focusable[nextIndex].focus();
      }
    });

    return { open, close, isOpen };
  }
}

window.ModalUtils = ModalUtils;
