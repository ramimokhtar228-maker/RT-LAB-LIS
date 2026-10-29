/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-7e5eb42b'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "registerSW.js",
    "revision": "402b66900e731ca748771b6fc5e7a068"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "55486c9b3726e5e1fa1b362ddbf366be"
  }, {
    "url": "pwa-512x512.png",
    "revision": "55486c9b3726e5e1fa1b362ddbf366be"
  }, {
    "url": "pwa-192x192.png",
    "revision": "efdcced7ab740a001d56e6e845594c6f"
  }, {
    "url": "index.html",
    "revision": "e6420eed1ca6858104c66b30b4ab6f34"
  }, {
    "url": "icon.svg",
    "revision": "2920c2702e39ee403b57f62e83ebc1c2"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "06699f73d242f2e891880fe2eab2e385"
  }, {
    "url": "assets/purify.es-Dqk5qvad.js",
    "revision": null
  }, {
    "url": "assets/index.es-5il637tv.js",
    "revision": null
  }, {
    "url": "assets/index-zB9cHcwR.css",
    "revision": null
  }, {
    "url": "assets/index-DxjXT_L8.js",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "06699f73d242f2e891880fe2eab2e385"
  }, {
    "url": "icon.svg",
    "revision": "2920c2702e39ee403b57f62e83ebc1c2"
  }, {
    "url": "pwa-192x192.png",
    "revision": "efdcced7ab740a001d56e6e845594c6f"
  }, {
    "url": "pwa-512x512.png",
    "revision": "55486c9b3726e5e1fa1b362ddbf366be"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "55486c9b3726e5e1fa1b362ddbf366be"
  }, {
    "url": "manifest.webmanifest",
    "revision": "9873378510fec4727fa251fe8765f58d"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));

}));
