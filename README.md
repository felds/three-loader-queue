# Three Loader Queue

A utility class that helps preloading multiple assets at once.

## Instalation

```console
npm install @felds/three-loader-queue
```

## Basic usage

```ts
import LoaderQueue from "@felds/three-loader-queue"
import { ImageLoader } from "three"

const loaderQueue = new LoaderQueue()
loaderQueue.addLoader("image", (manager) => new ImageLoader(manager))

const assets = await loaderQueue.load([
  { type: "image", name: "image_1", url: "path/to/image-1.jpg" },
  { type: "image", name: "image_2", url: "path/to/image-2.png" },
])
// assets = {
//   image_1: <img />,
//   image_2: <img />,
// }
```

### Adding a loader

```ts
import LoaderQueue from "@felds/three-loader-queue"
import { ImageLoader } from "three"
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"

// add the loaders to the queue
const loaderQueue = new LoaderQueue()
loaderQueue.addLoader("image", (manager) => new ImageLoader(manager))
loaderQueue.addLoader("font", (manager) => new FontLoader(manager))
loaderQueue.addLoader("gltf", (manager) => new GLTFLoader(manager))

// then refer to the loader by name when loading the assets
const assets = await loaderQueue.load([
  { type: "image", name: "my-image", url: "path/to/image-1.jpg" },
  { type: "font", name: "my-font", url: "path/to/font.ttf" },
  { type: "gltf", name: "my-model", url: "path/to/model.gltb" },
])
```

### Common loaders

```ts
// Fonts
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js"
loaderQueue.addLoader("font", (manager) => new FontLoader(manager))

// GLTF
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
loaderQueue.addLoader("gltf", (manager) => new GLTFLoader(manager))

// Textures
import { TextureLoader } from "three"
loaderQueue.addLoader("texture", (manager) => new TextureLoader(manager))

// Audios
import { AudioLoader } from "three"
loaderQueue.addLoader("audio", (manager) => new AudioLoader(manager))

// Images
import { ImageLoader } from "three"
loaderQueue.addLoader("image", (manager) => new ImageLoader(manager))

// Files
import { FileLoader } from "three"
loaderQueue.addLoader("file", (manager) => new FileLoader(manager))

// Files as Blob urls
import { UrlLoader } from "@felds/three-loader-queue/dist/loaders"
loaderQueue.addLoader("url", (manager) => new UrlLoader(manager))
```

## Events

```ts
// unfortunately, the progress is registered in number of loaded file, not in size
loaderQueue.addEventListener("onProgress", (ev) => {
  console.log("Total files:", ev.total)
  console.log("Files loaded:", ev.loaded)
  console.log("Progress:", ev.total / ev.loaded)
})

loaderQueue.addEventListener("onComplete", () => {
  console.log("Queue loaded!")
})
```

## Loading asset sequences

```ts
// using an arbitrary array
const assets = await loaderQueue.load([
  {
    type: "image",
    name: "my-image-sequence",
    url: [
      "path/to/sequence/01.jpg",
      "path/to/sequence/02.jpg",
      // ...
      "path/to/sequence/30.jpg",
    ],
  },
])

// same thing, but using str-expand
import expand from "str-expand"
const assets = await loaderQueue.load([
  { type: "image", name: "my-image-sequence", url: expand("path/to/sequence/[01..30].jpg") },
])

// assets = {
//   "my-image-sequence": [<img />, <img />, ..., <img />]
// }
```
