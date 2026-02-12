class InputUtils {
  static addTouchClickHandler(element, handler) {
    if (!element) return;

    let touchStartTime = 0;
    let touchStartPos = null;
    let moved = false;
    let touchHandled = false;

    element.addEventListener(
      'touchstart',
      (e) => {
        touchHandled = false;
        touchStartTime = Date.now();
        touchStartPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        moved = false;
      },
      { passive: true }
    );

    element.addEventListener(
      'touchmove',
      (e) => {
        if (touchStartPos && e.touches.length > 0) {
          const deltaX = Math.abs(e.touches[0].clientX - touchStartPos.x);
          const deltaY = Math.abs(e.touches[0].clientY - touchStartPos.y);
          if (deltaX > 10 || deltaY > 10) moved = true;
        }
      },
      { passive: true }
    );

    element.addEventListener(
      'touchend',
      (e) => {
        e.preventDefault();
        e.stopPropagation();

        const touchDuration = Date.now() - touchStartTime;
        if (touchDuration < 500 && !moved && !touchHandled) {
          touchHandled = true;
          handler(e);
        }

        touchStartTime = 0;
        touchStartPos = null;
        moved = false;
      },
      { passive: false }
    );

    element.addEventListener('click', (e) => {
      if (!touchHandled) handler(e);
      touchHandled = false;
    });
  }
}

window.InputUtils = InputUtils;
