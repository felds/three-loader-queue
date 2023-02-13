export class EventDispatcher {
  private events: { [key: string]: { listeners: Function[] } }

  constructor() {
    this.events = {}
  }

  addListener(event: string, callback: Function) {
    // Check if the callback is not a function
    if (typeof callback !== "function") {
      console.error(`The listener callback must be a function, the given type is ${typeof callback}`)
      return false
    }
    // Check if the event is not a string
    if (typeof event !== "string") {
      console.error(`The event name must be a string, the given type is ${typeof event}`)
      return false
    }

    // Create the event if not exists
    if (this.events[event] === undefined) {
      this.events[event] = {
        listeners: [],
      }
    }

    this.events[event].listeners.push(callback)
  }

  removeListener(event: string, callback: Function) {
    // Check if this event not exists
    if (this.events[event] === undefined) {
      console.error(`This event: ${event} does not exist`)
      return false
    }

    this.events[event].listeners = this.events[event].listeners.filter((listener) => {
      return listener.toString() !== callback.toString()
    })
  }

  dispatch(event: string, details: any) {
    // Check if this event not exists
    if (this.events[event] === undefined) {
      console.error(`This event: ${event} does not exist`)
      return false
    }
    this.events[event].listeners.forEach((listener) => {
      listener(details)
    })
  }
}
