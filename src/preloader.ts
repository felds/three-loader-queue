import expand from "str-expand"
import * as THREE from "three"
import { Loader, LoadingManager } from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { EventDispatcher } from "./event-dispatcher"
import { UrlLoader } from "./url-loader"

type QueueItem = {
  name: string
  type: string
  url: string
  [k: string]: any
}

export default class Preloader extends EventDispatcher {
  private manager: LoadingManager
  private loaders: Record<string, Loader>
  private _loaded = false

  public assets: Record<string, any>
  public debug: boolean = false

  constructor(assetsPath: string) {
    super()

    this.manager = new THREE.LoadingManager()
    this.manager.onStart = this.onStart
    this.manager.onProgress = this.onProgress
    this.manager.onError = this.onError

    this.loaders = {
      gltf: new GLTFLoader(this.manager).setPath(assetsPath),
      texture: new THREE.TextureLoader(this.manager).setPath(assetsPath),
      audio: new THREE.AudioLoader(this.manager).setPath(assetsPath),
      image: new THREE.ImageLoader(this.manager).setPath(assetsPath),
      file: new THREE.FileLoader(this.manager).setPath(assetsPath),
      url: new UrlLoader(this.manager).setPath(assetsPath),
    } as const

    this.assets = {}
  }

  async queue(list: QueueItem[]) {
    const promises = list.map(async (item): Promise<[string, any]> => {
      const { name, url, type } = item
      if (type === "sequence") {
        // image sequence
        const urls = expand(url)
        const sequence = await Promise.all(urls.map((url) => this.loaders["image"]?.loadAsync(url)))
        return [name, sequence]
      } else {
        // everything else
        const loader = this.loaders[type]
        if (!loader) throw new Error(`No loader for the type ${type}`)

        const results = await loader.loadAsync(url)
        return [name, results]
      }
    })

    const results = await Promise.all(promises)
    this.assets = Object.fromEntries(results)
    this._loaded = true
  }

  private onStart = (url: string, itemsLoaded: number, itemsTotal: number) => {
    if (this.debug) console.log(`Started loading file: ${url}.\nLoaded ${itemsLoaded} of ${itemsTotal} files.`)
  }

  private onProgress = (url: string, itemsLoaded: number, itemsTotal: number) => {
    if (this.debug) console.log(`Loading file: ${url}.\nLoaded ${itemsLoaded} of ${itemsTotal} files.`)
    this.dispatch("onProgress", {
      data: itemsLoaded / itemsTotal,
    })
  }

  private onError = (url: string) => {
    if (this.debug) console.log(`There was an error loading ${url}`)
  }

  get loaded() {
    return this._loaded
  }
}
