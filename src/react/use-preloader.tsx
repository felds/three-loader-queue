import { useContext, useEffect } from "react"
import LoaderQueue from "../core/loader-queue"
import { PreloaderContext } from "./preloader-context"

type PreloaderResult = {
  loaded: boolean
  preloader: LoaderQueue
}

export default function usePreloader(key: string, queue: any[]): PreloaderResult {
  const { cache, setProgressMap, setLoading, progressMap } = useContext(PreloaderContext)

  // get the preloader from the cache
  let preloader = cache[key]

  // create the new preloader if needed
  if (!preloader) {
    // @ts-ignore
    preloader = new LoaderQueue(`${import.meta.env.BASE_URL}`)
    cache[key] = preloader
  }

  /** Attach listeners to the preloader */
  useEffect(() => {
    if (preloader?.loaded) return

    preloader?.addEventListener("onProgress", (e: any) => {
      // multiply progress by 0.99 so it never reaches 1 for progress alone
      setProgressMap((prev) => ({ ...prev, [key]: e.data * 0.99 }))
    })
    preloader?.load(queue).then(() => {
      // set progress as 1 only when the promise resolves
      setProgressMap((prev) => ({ ...prev, [key]: 1 }))
    })
    setLoading(true)
  }, [])

  return { preloader, loaded: progressMap[key] === "completed" }
}
