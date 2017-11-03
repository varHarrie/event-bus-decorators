import {EventBus} from 'event-bus-station'

const LISTENERS = '__LISTENERS__'

const bus = new EventBus()

export type ClassDecorator = (target: any) => any

export const subscriber: ClassDecorator = function (target) {
  const prototype = target.prototype
  const listeners = prototype[LISTENERS] || []

  return function () {
    const instance = new target()

    for (let listener of listeners) {
      bus[listener.once ? 'once' : 'on'](listener.name, listener.callback.bind(instance))
    }

    return instance
  }
}

export type FunctionDecorator = (
  target: any,
  name: string,
  descriptor: TypedPropertyDescriptor<Function>
) => any

export interface IDecoratorFactory extends FunctionDecorator {
  (name: string): FunctionDecorator,
  (name: string, fn: Function): void
}

function decorator (name: string, emitOnce?: boolean): FunctionDecorator {
  return function (target, prop, descriptor) {
    if (descriptor && typeof descriptor.value === 'function') {
      const listeners = target[LISTENERS] = target[LISTENERS] || []
      listeners.push({name, once: emitOnce, callback: descriptor.value})
    }
  }
}

export const on: IDecoratorFactory = function (...args: any[]) {
  if (typeof args[0] === 'string') {
    if (typeof args[1] === 'function') {
      return bus.on(args[0], args[1])
    }

    return decorator(args[0])
  }

  return decorator(args[1]).apply(null, args)
}

export const once: IDecoratorFactory = function (...args: any[]) {
  if (typeof args[0] === 'string') {
    if (typeof args[1] === 'function') {
      return bus.once(args[0], args[1])
    }

    return decorator(args[0], true)
  }

  return decorator(args[1], true).apply(null, args)
}

export const emit: (name: string, ...args: any[]) => any = bus.emit.bind(bus)
