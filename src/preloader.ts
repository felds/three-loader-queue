import expand from "str-expand"
import { AudioLoader, FileLoader, ImageLoader, Loader, LoadingManager, TextureLoader } from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { UrlLoader } from "./url-loader"

type QueueItem = {
  name: string
  type: string
  url: string
  [k: string]: any
}

interface EventMap {
  onProgress: ProgressEvent
  onComplete: Event
}

export default class Preloader extends EventTarget {
  private manager: LoadingManager
  private loaders = new Map<string, Loader>()
  private _loaded = false

  public assets: Record<string, any>
  public debug: boolean = false

  constructor(private assetsPath: string = "") {
    super()

    this.manager = new LoadingManager()
    this.manager.onStart = this.onStart
    this.manager.onProgress = this.onProgress
    this.manager.onError = this.onError

    this.assets = {}
  }

  public static withCommonLoaders(...args: ConstructorParameters<typeof Preloader>) {
    const obj = new Preloader(...args)
    obj.addLoader("gltf", new GLTFLoader())
    obj.addLoader("texture", new TextureLoader())
    obj.addLoader("audio", new AudioLoader())
    obj.addLoader("image", new ImageLoader())
    obj.addLoader("file", new FileLoader())
    obj.addLoader("url", new UrlLoader())
    return obj
  }

  /**
   * Add a new loader to this preloader.
   */
  addLoader(type: string, createLoader: (manager: LoadingManager) => Loader) {
    if (this.loaders.has(type)) {
      throw Error(`A loader for the type ${type} already exists.`)
    }
    const loader = createLoader(this.manager)
    loader.path = this.assetsPath
    this.loaders.set(type, loader)
  }

  /** @todo Make image sequence be it's own loader */
  async queue(list: QueueItem[]) {
    const promises = list.map(async (item): Promise<[string, any]> => {
      const { name, url, type } = item
      if (type === "sequence") {
        // image sequence
        const urls = expand(url)
        const sequence = await Promise.all(urls.map((url) => this.loaders.get("image")?.loadAsync(url)))
        return [name, sequence]
      } else {
        // everything else
        const loader = this.loaders.get(type)
        if (!loader) throw new Error(`No loader for the type ${type}`)

        const results = await loader.loadAsync(url)
        return [name, results]
      }
    })

    const results = await Promise.all(promises)
    this.assets = Object.fromEntries(results)
    this._loaded = true
    this.dispatchEvent(new Event("onComplete"))
  }

  private onStart = (url: string, itemsLoaded: number, itemsTotal: number) => {
    if (this.debug) console.log(`Started loading file: ${url}.\nLoaded ${itemsLoaded} of ${itemsTotal} files.`)
  }

  /**
   * @todo get the totals by weight, not by number of files?
   */
  private onProgress = (url: string, loaded: number, total: number) => {
    if (this.debug) console.log(`Loading file: ${url}.\nLoaded ${loaded} of ${total} files.`)
    const event = new ProgressEvent("onProgress", { loaded, total })
    this.dispatchEvent(event)
  }

  private onError = (url: string) => {
    if (this.debug) console.log(`There was an error loading ${url}`)
  }

  get loaded() {
    return this._loaded
  }

  addEventListener<K extends keyof EventMap>(
    type: K,
    listener: (this: typeof this, ev: EventMap[K]) => any,
    options?: boolean | AddEventListenerOptions,
  ): void {
    super.addEventListener(type, listener as EventListenerOrEventListenerObject, options)
  }

  removeEventListener<K extends keyof EventMap>(
    type: K,
    listener: (this: XMLHttpRequestEventTarget, ev: EventMap[K]) => any,
    options?: boolean | EventListenerOptions,
  ): void {
    super.removeEventListener(type, listener as EventListenerOrEventListenerObject, options)
  }
}
