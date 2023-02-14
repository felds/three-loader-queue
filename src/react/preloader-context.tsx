import { every, filter, mapValues, mean, pipe } from "lodash/fp"
import React, { createContext, Dispatch, PropsWithChildren, SetStateAction, useEffect, useState } from "react"
import LoaderQueue from "../core/loader-queue"

export const PreloaderContext = createContext({
  cache: {} as Cache, // readonly
  progressMap: {} as Progresses,
  setProgressMap: ((value: Progresses) => {}) as Dispatch<SetStateAction<Progresses>>,
  loading: false,
  setLoading: (value: boolean) => {},
  progress: 0,
  setProgress: (value: number) => {},
})

type Cache = Record<string, LoaderQueue>

type Progresses = Record<string, number | "completed">

type PreloaderContextProviderProps = PropsWithChildren & {}

export function PreloaderContextProvider(props: PreloaderContextProviderProps) {
  const { children } = props
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [cache] = useState<Cache>({})
  const [progressMap, setProgressMap] = useState<Progresses>({})

  /** Update complete status once every preloader is complete */
  useEffect(() => {
    const allCompleted = every((p) => p === "completed")(progressMap)
    if (allCompleted) return

    // average all progresses that are not completed
    const avgProgress = pipe(
      filter((p) => p !== "completed"),
      mean,
    )(progressMap)
    setProgress(avgProgress)

    // if every loader is 1, set them all as completed
    if (avgProgress === 1) {
      setProgressMap((prev) => mapValues(() => "completed" as const)(prev))
      setLoading(false)
    }
  }, [progressMap])

  const value = {
    cache,
    progressMap,
    setProgressMap,
    loading,
    setLoading,
    progress,
    setProgress,
  }

  return <PreloaderContext.Provider value={value}>{children}</PreloaderContext.Provider>
}
