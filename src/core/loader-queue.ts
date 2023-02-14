import { Loader, LoadingManager } from "three"

type Item = {
  name: string
  type: string
  url: string | string[]
}

interface EventMap {
  onProgress: ProgressEvent
  onComplete: Event
}

export default class LoaderQueue extends EventTarget {
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

  /**
   * Adds a new loader to the manager for the given asset type.
   *
   * @param type - The type of asset that the loader will handle.
   * @param createLoader - A function that takes a `LoadingManager` object as its parameter and returns a `Loader` object.
   * @throws Will throw an error if a loader for the given asset type already exists.
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
  async load(list: Item[]) {
    const promises = list.map(async (item): Promise<[string, any]> => {
      const { name, url, type } = item
      const loader = this.loaders.get(type)
      if (!loader) {
        throw new Error(`No loader for the type ${type}`)
      }

      const results = Array.isArray(url)
        ? await Promise.all(url.map((x) => loader.loadAsync(x)))
        : await loader.loadAsync(url)

      return [name, results]
    })

    const results = await Promise.all(promises)
    this.assets = Object.fromEntries(results)
    this._loaded = true
    this.dispatchEvent(new Event("onComplete"))
  }

  private onStart = (url: string, itemsLoaded: number, itemsTotal: number) => {
    if (this.debug) console.log(`Started loading file: ${url}.\nLoaded ${itemsLoaded} of ${itemsTotal} files.`)
  }

  private onProgress = (url: string, loaded: number, total: number) => {
    if (this.debug) console.log(`Loading file: ${url}.\nLoaded ${loaded} of ${total} files.`)
    const event = new ProgressEvent("onProgress", { loaded, total })
    this.dispatchEvent(event)
  }

  private onError = (url: string) => {
    if (this.debug) console.log(`There was an error loading ${url}`)
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

  get loaded() {
    return this._loaded
  }
}
