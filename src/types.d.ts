import "three"

declare module "three" {
  export interface Loader {
    loadAsync: (...attrs: any[]) => Promise<any>
  }
}
