import { Loader } from "three"
import { CustomFileLoader } from "./custom-file-loader"

/**
 * Generic loader for files that loads the file in memory and returns a blob URL.
 */
export class UrlLoader extends Loader {
  constructor(manager: THREE.LoadingManager) {
    super(manager)
  }

  load(
    url: string,
    onLoad?: ((response: string | Blob) => void) | undefined,
    onProgress?: ((request: ProgressEvent<EventTarget>) => void) | undefined,
    onError?: ((event: ErrorEvent) => void) | undefined,
  ) {
    const loader = new CustomFileLoader(this.manager)
    loader.setResponseType("blob")
    loader.setPath(this.path)
    loader.setRequestHeader(this.requestHeader)
    loader.setWithCredentials(this.withCredentials)
    loader.load(
      url,
      (buffer) => {
        try {
          const objectUrl = URL.createObjectURL(buffer as unknown as Blob)
          onLoad && onLoad(objectUrl)
        } catch (err) {
          // @ts-ignore
          onError ? onError(err) : console.error(err)
          this.manager.itemError(url)
        }
      },
      onProgress,
      onError,
    )
  }
}
