/**
 * Payload received by a `ResizeHandler`.
 */
export interface ResizePayload<T extends HTMLElement> {
  element: T;
  event: UIEvent;
  prevBoundingClientRect: ClientRect | DOMRect;
  destroy: DestroyWatcher;
}

/**
 * A callback function invoked when the
 * watched element emits a "resize" event.
 */
export type ResizeHandler<T extends HTMLElement> = (payload: ResizePayload<T>) => void | Promise<void>;

/**
 * A synchronous function to unobserve
 * the element given to `watchResize`.
 */
export type DestroyWatcher = () => void;

/**
 * Checks if the given object is a valid `HTMLElement`.
 */
function isElement(obj: any) {
  try {
    // Using W3 DOM2 (works for FF, Opera and Chrome)
    return obj instanceof HTMLElement;
  } catch (e) {
    // Browsers not supporting W3 DOM2 don't have HTMLElement and
    // an exception is thrown and we end up here. Testing some
    // properties that all elements have (works on IE7)
    return (
      typeof obj === 'object' &&
      obj.nodeType === 1 &&
      typeof obj.style === 'object' &&
      typeof obj.ownerDocument === 'object'
    );
  }
}

/**
 * Returns a Promise that resolves to a RxJS Observable. The Observable fires
 * when the given DOM element's width or height changes.
 *
 * @param element - HTMLElement to observe.
 * @param handler - A callback function invoked whenever the given `element`
 * resizes.
 */
export function watchResize<T extends HTMLElement>(element: T, handler: ResizeHandler<T>): Promise<DestroyWatcher> {
  return new Promise<DestroyWatcher>((resolve, reject) => {
    // Assert that `element` is defined and is a valid DOM node.
    if (typeof element === 'undefined' || element === null) {
      return reject(Promise.reject(new Error('[watch-resize] The given element must be defined.')));
    }

    if (!isElement(element)) {
      return reject(Promise.reject(new Error('[watch-resize] The given element is not a valid DOM node.')));
    }

    if (!element.parentNode) {
      return reject(Promise.reject(new Error('[watch-resize] The given element is not yet attached to the DOM.')));
    }

    // Ensure we are relatively positioned so that the nested browsing context
    // is correctly sized and positioned.
    if (getComputedStyle(element).position === 'static') {
      element.style.position = 'relative';
    }

    // Create a nested browsing context using an <object> element.
    const obj = document.createElement('object');

    // Set type and data
    obj.type = 'text/html';
    obj.data = 'about:blank';

    // Set CSSOM properties
    obj.style.display = 'block';
    obj.style.position = 'absolute';
    obj.style.top = '0';
    obj.style.left = '0';
    obj.style.height = '100%';
    obj.style.width = '100%';
    obj.style.overflow = 'hidden';
    obj.style.pointerEvents = 'none';
    obj.style.zIndex = '-1';

    // Save a reference to the element's current client rect.
    let prevBoundingClientRect: ClientRect | DOMRect = element.getBoundingClientRect();

    // When the <object> loads, apply the "resize" event listener and resolve.
    obj.addEventListener('load', () => {
      if (obj.contentDocument && obj.contentDocument.defaultView) {
        const viewContext = obj.contentDocument.defaultView;

        const listener = (event: UIEvent) => {
          handler({ element, event, prevBoundingClientRect, destroy });
          prevBoundingClientRect = element.getBoundingClientRect();
        };

        const destroy = () => {
          viewContext.removeEventListener('resize', listener);
          obj.remove();
        };

        viewContext.addEventListener('resize', listener);

        resolve(destroy);
      } else {
        reject(new Error('[watch-resize] Failed to build a nested browsing context.'));
      }
    });

    // Append the <object> to the target element.
    element.appendChild(obj);
  });
}
