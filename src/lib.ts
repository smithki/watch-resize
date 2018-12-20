// --- Imports -------------------------------------------------------------- //

import { animationFrameScheduler, fromEvent, Observable } from 'rxjs';
import { throttleTime } from 'rxjs/operators';

// --- Business logic ------------------------------------------------------- //

/**
 * Returns a Promise that resolves to a RxJS Observable. The Observable fires
 * changes in size of the given DOM element are detected.
 *
 * @param element HTMLElement to watch for size changes.
 */
export function watchResize<T extends HTMLElement>(
  element: T,
): Promise<Observable<Event>> {
  return new Promise((resolve, reject) => {
    if (!element) reject('The given `HTMLElement` must be defined.');

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

    // When the <object> loads, resolve the Observable.
    obj.onload = () => {
      if (obj.contentDocument && obj.contentDocument.defaultView) {
        const viewContext = obj.contentDocument.defaultView;
        // We create the Observable from the `resize` event attached to the
        // nested browsing context.
        resolve(
          fromEvent(viewContext, 'resize').pipe(
            throttleTime(0, animationFrameScheduler),
          ),
        );
      } else {
        reject(
          'Could not build a nested browsing context to watch for DOM element size changes.',
        );
      }
    };

    // Append the <object> to the target element.
    element.appendChild(obj);
  });
}
