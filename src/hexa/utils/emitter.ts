export type Listener = (...data: any[]) => any;

export class Emitter {
  eventListeners: { [key: string]: Listener[] } = {};

  addEventListener(type: string | string[], listener: Listener) {
    if (typeof type == "object") {
      type.forEach((t) => this.addEventListener(t, listener));
      return;
    }

    if (!this.eventListeners[type]) this.eventListeners[type] = [listener];
    else this.eventListeners[type].push(listener);
  }

  removeEventListener(type: string | string[], listener: Listener) {
    if (typeof type == "object") {
      type.forEach((t) => this.removeEventListener(t, listener));
      return;
    }

    if (this.eventListeners[type])
      this.eventListeners[type] = this.eventListeners[type].filter(
        (l) => l != listener
      );
  }

  emit(type: string | string[], ...datas: any[]) {
    if (typeof type == "object") {
      type.forEach((t) => this.emit(t, datas));
      return;
    }
    if (this.eventListeners[type])
      this.eventListeners[type].forEach((l) => l(...datas));
  }
}
