# 👀 `watchResize`

[![code style: airbnb](https://img.shields.io/badge/code%20style-airbnb-blue.svg?style=flat)](https://github.com/airbnb/javascript)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat)](https://github.com/prettier/prettier)

> Watch any DOM element for size changes using Observables.

## 💁🏼‍♂️ Introduction

A cross-compatible [ResizeObserver](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver) alternative that uses [RxJS](https://github.com/ReactiveX/rxjs) observables. You can watch any element for size changes based on its bounding box.

## 🔗 Installation

Install via `yarn` or `npm`:

```sh
yarn add watch-resize
```

```sh
npm install watch-resize
```

Don't forget the `peerDependencies`:

```sh
yarn add rxjs@~6.5.2
```

```sh
npm install rxjs@~6.5.2
```


## 🛠️ Usage

```ts
import { watchResize } from 'watch-resize';

const target = document.getElementById('my-element');

watchResize(target).then(([resize$, destroyResize$]) => {
  resize$.subscribe(({ element, event, prevBoundingClientRect }) => {
    // Do stuff here for each "resize"
  });

  // Unsubscribe all subscribers, destroy the observable, and remove the
  // nested browsing context that was created to generate events.
  destroyResize$();
});
```

An object implementing `WatchResizePayload` is passed to subscribe handler:

```ts
export interface WatchResizePayload<T extends HTMLElement> {
  element: T;
  event: UIEvent;
  prevBoundingClientRect: ClientRect | DOMRect; // The previous result of "element.getBoundingClientRect()".
}
```
