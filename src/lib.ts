// --- Imports -------------------------------------------------------------- //

import { Observable, Subscriber } from 'rxjs';

// --- Types ---------------------------------------------------------------- //

/** Payload received by `watchResize` subscribers to their `next` handler. */
export interface WatchResizePayload<T extends HTMLElement> {
  element: T;
  event: UIEvent;
  prevBoundingClientRect: ClientRect | DOMRect;
}

/** Observable created by `watchResize`. */
export type WatchResizeObservable<T extends HTMLElement> = Observable<
  WatchResizePayload<T>
>;

// --- Business logic ------------------------------------------------------- //

/** Checks if the given object is a valid `HTMLElement`. */
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
 */
export function watchResize<T extends HTMLElement>(
  element: T,
): Promise<WatchResizeObservable<T>> {
  return new Promise((resolve, reject) => {
    // Assert that `element` is defined and is a valid DOM node.
    if (typeof element === 'undefined') {
      reject('[watch-resize] The given element must be defined.');
    }
    if (!isElement(element)) {
      reject('[watch-resize] The given element is not a valid DOM node.');
    }

    // Ensure we are relatively positioned so that the nested browsing context
    // is correctly sized and positioned.
    if (getComputedStyle(element).position === 'static') {
      element.style.position = 'relative';
    }

    // Create a nested browsing context using an <object> element.
    const obj = document.createElement('object');
    obj.setAttribute(
      'style',
      'display: block; position: absolute; top: 0; left: 0; height: 100%; width: 100%; overflow: hidden; pointer-events: none; z-index: -1;',
    );
    obj.type = 'text/html';
    obj.data = 'about:blank';

    // Store some data that will change with the observable.
    const subscribers: Subscriber<WatchResizePayload<T>>[] = [];
    let prevBoundingClientRect:
      | ClientRect
      | DOMRect = element.getBoundingClientRect();

    // Create the Observable that will emit each time the nested browsing
    // context is resized.
    const observable = new Observable<WatchResizePayload<T>>(s => {
      subscribers.push(s);
    });

    // When the <object> loads, resolve the Observable.
    obj.addEventListener('load', () => {
      if (obj.contentDocument && obj.contentDocument.defaultView) {
        const viewContext = obj.contentDocument.defaultView;

        // Handle the resize event -- emit to the saved subscribers!
        viewContext.addEventListener('resize', event => {
          subscribers.forEach((s, i) => {
            if (s.closed) subscribers.splice(i, 1);
            const payload = { element, event, prevBoundingClientRect };
            s.next(payload);
            prevBoundingClientRect = element.getBoundingClientRect();
          });
        });

        resolve(observable);
      } else {
        reject('[watch-resize] Failed to build a nested browsing context.');
      }
    });

    // Append the <object> to the target element.
    element.appendChild(obj);
  });
}
