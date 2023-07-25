export type KeyTypes =
  | "A"
  | "B"
  | "X"
  | "Y"
  | "LSTICK_L"
  | "LSTICK_R"
  | "LSTICK_U"
  | "LSTICK_D"
  | "RSTICK_L"
  | "RSTICK_R"
  | "RSTICK_U"
  | "RSTICK_D"
  | "LSTICK"
  | "RSTICK"
  | "PLUS"
  | "MINUS"
  | "ZL"
  | "ZR"
  | "L"
  | "R"
  | "ARROW_L"
  | "ARROW_R"
  | "ARROW_D"
  | "ARROW_U"
  | "KEYBOARD_L"
  | "KEYBOARD_R"
  | "KEYBOARD_D"
  | "KEYBOARD_U"
  | "ANY";

export type EventType = "PRESS" | "RELEASE" | "REPEAT";

interface KeysContextType {
  addEventListener: (
    type: KeyTypes | KeyTypes[],
    listener: (type: EventType) => any
  ) => void;
  removeEventListener: (
    type: KeyTypes | KeyTypes[],
    listener: (type: EventType) => any
  ) => void;
}

let eventListeners: { [key in KeyTypes]?: ((type: EventType) => any)[] } = {};
let waiters: { [key in KeyTypes]?: number } = {};
let intervalers: { [key in KeyTypes]?: number } = {};

const keymap: { [key: string]: KeyTypes } = {
  ArrowRight: "ARROW_R",
  ArrowDown: "ARROW_D",
  ArrowUp: "ARROW_U",
  ArrowLeft: "ARROW_L",
  KeyW: "LSTICK_U",
  KeyS: "LSTICK_D",
  KeyA: "LSTICK_L",
  KeyD: "LSTICK_R",
  Semicolon: "A",
  Equal: "PLUS",
  Minus: "MINUS",
};

const sendEvent = (t: EventType, kType: KeyTypes) => {
  //   if (keyboardInUse) {
  //     if (["ARROW_L", "LSTICK_L"].includes(kType))
  //       eventListeners["KEYBOARD_L"]?.forEach((func) => func(t));
  //     else if (["ARROW_R", "LSTICK_R"].includes(kType))
  //       eventListeners["KEYBOARD_R"]?.forEach((func) => func(t));
  //     else if (["ARROW_D", "LSTICK_D"].includes(kType))
  //       eventListeners["KEYBOARD_D"]?.forEach((func) => func(t));
  //     else if (["ARROW_U", "LSTICK_U"].includes(kType))
  //       eventListeners["KEYBOARD_U"]?.forEach((func) => func(t));
  //     else eventListeners[kType]?.forEach((func) => func(t));
  //   } else
  eventListeners[kType]?.forEach((func) => func(t));
};

const keyDownEvent = (ev: KeyboardEvent) => {
  if (keymap[ev.code]) {
    ev.preventDefault();
    ev.stopPropagation();
    if (ev.repeat) return;

    let kType = keymap[ev.code];
    sendEvent("PRESS", kType);
    sendEvent("PRESS", "ANY");

    waiters[kType] = setTimeout(() => {
      intervalers[kType] = setInterval(() => {
        sendEvent("REPEAT", kType);
        sendEvent("REPEAT", "ANY");
      }, 45);
      delete waiters[kType];
    }, 200);
  } else console.log(`No key map for key "${ev.code}"`);
};

const keyUpEvent = (ev: KeyboardEvent) => {
  if (keymap[ev.code]) {
    ev.preventDefault();
    ev.stopPropagation();
    let kType = keymap[ev.code];
    sendEvent("RELEASE", kType);
    sendEvent("RELEASE", "ANY");
    let wai = waiters[kType];
    if (wai) clearTimeout(wai);
    let int = intervalers[kType];
    if (int) clearInterval(int);
  }
};

window.addEventListener("keydown", keyDownEvent);
window.addEventListener("keyup", keyUpEvent);

export default function useKeys(): KeysContextType {
  return {
    addEventListener(type, listener) {
      if (typeof type == "object") {
        type.forEach((type) => this.addEventListener(type, listener));
        return;
      }

      if (!eventListeners[type]) eventListeners[type] = [];
      eventListeners[type]!.push(listener);
    },
    removeEventListener(type, listener) {
      if (typeof type == "object") {
        type.forEach((type) => this.removeEventListener(type, listener));
        return;
      }

      if (eventListeners[type])
        eventListeners[type] = eventListeners[type]!.filter(
          (handler) => handler != listener
        );
    },
  };
}
