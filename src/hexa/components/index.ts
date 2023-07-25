import {
  ATTRIBUTE_PREFIX,
  PROJECT_NAME,
  docuhead,
  getAttributeName,
} from "../CONSTANTS";
import { Emitter } from "../utils/emitter";
import log, { logEnabled } from "../utils/log";
import assetStorage from "../../assets.hexa";

export const SELECTOR = `component:not(component[${ATTRIBUTE_PREFIX}-asset-loading="false"]):not(component[${ATTRIBUTE_PREFIX}-asset-loading="true"])`;
export const HREF_TAG_REGEX = /<import(.*?)href=(.*?)>([ \t]+)?<\/import>/g;
export const STYLE_REGEX = /<style(.*?)>(.|\n)*<\/style>/g;
export const PROP_REGEX = /<props(.*?)path="(.*?)"(.*?)>([ \t]+)?<\/props>/g;
export const CONST_PROP_REGEX = /__props_(.*?)__/g;
export const INTERVAL_DELAY = 50;
export const config = { attributes: true, childList: true, subtree: false };
export let RENDER_INTERVAL: null | number = null;
export let LAST_RENDER = new Date().getTime() - 10000;
export let cssLoadSet = new Set();
export let htmlLoaderSet = new Set();
export let htmlCache: { [key: string]: string } = {};
export let loadEmitter = new Emitter();
export let paused = true;
export let useCacheStorage = false;

export let cache: Cache;

export function setUseCacheStorage(usage: boolean) {
  useCacheStorage = usage;
}

export function cssApplyer(html: string, assetID: string) {
  let cssTags = html.match(HREF_TAG_REGEX);

  if (cssTags)
    for (let i = 0; i < cssTags.length; i++) {
      let cssTag = cssTags[i];
      html = html.replace(cssTag, "");
      cssTag = cssTag
        .replace(/<import(.*?)href="/g, "")
        .replace("</import>", "")
        .replace(/"([ \t]+)?>([ \t]+)?/g, "")
        .trim();

      if (cssTag.startsWith("./"))
        cssTag = assetStorage[assetID] + "/../" + cssTag;

      if (cssLoadSet.has(cssTag)) continue;
      else cssLoadSet.add(cssTag);

      let loadStartTime = new Date().getTime();

      let link = document.createElement("link");
      link.href = cssTag;
      link.rel = "stylesheet";
      link.setAttribute(getAttributeName(`css-for`), assetID);

      link.addEventListener("load", () => {
        log(
          "components.css",
          "loaded",
          `Applyed css for ${assetID} and took ${
            new Date().getTime() - loadStartTime
          }ms`
        );
      });

      docuhead.appendChild(link);

      if (logEnabled) {
        console.group("components.css::" + assetID);
        log("components.css", "apply", `Apply css for ${assetID}.`);
        log("components.css", "url", cssTag);
        console.groupEnd();
      }
    }

  return html;
}

export function styleApplyer(html: string, assetID: string) {
  let styles = html.match(STYLE_REGEX);

  if (!styles) return html;

  let removed = 0;

  for (let i = 0; i < styles.length; i++) {
    let style = styles[i];

    if (style.includes("x-save")) {
      removed++;
      continue;
    }

    html = html.replace(style, "");
    style = style.replace("<style", `<style x-loaded-for="${assetID}"`);
    docuhead.innerHTML += style;
  }

  log(
    "components.style",
    "apply",
    `${styles.length - removed} styles applyed for ${assetID}`
  );

  return html;
}

export function vitePatcher(html: string) {
  return html.replace(
    `<script type="module" src="/@vite/client"></script>`,
    ""
  );
}

export function rednerInterval() {
  if (new Date().getTime() - LAST_RENDER < INTERVAL_DELAY) {
    RENDER_INTERVAL = null;
    setRednerInterval();
    return;
  }

  renderComponents();
}

export function setRednerInterval() {
  if (RENDER_INTERVAL) clearInterval(RENDER_INTERVAL);
  let DELAY = INTERVAL_DELAY;
  if (new Date().getTime() - LAST_RENDER < INTERVAL_DELAY) {
    DELAY = INTERVAL_DELAY - new Date().getTime() + LAST_RENDER;
    log(
      "components.renderInterval",
      "time fix",
      `Interval delay fixed to ${DELAY}ms`
    );
  }
  RENDER_INTERVAL = setInterval(rednerInterval, DELAY);
}

export function constPropsApplyer(html: string, props: any) {
  let matches = html.match(CONST_PROP_REGEX);
  if (!matches) return html;

  for (let i = 0; i < matches.length; i++) {
    let match = matches[i];
    let data = match
      .replace("__props_", "")
      .slice(0, -2)
      .split("_")
      .reduce(function (o, k) {
        return o && o[k];
      }, props);
    html = html.replace(match, data);
  }

  return html;
}

export function propsApplyer(element: Element) {
  let attributeData = element.getAttribute(getAttributeName("props"));
  if (!attributeData) return;
  let props = JSON.parse(attributeData);

  let id = element.getAttribute(getAttributeName("id"));
  if (!id) return;

  let elements = element.querySelectorAll(
    `props[${getAttributeName("parent-id")}="${id}"]`
  );

  for (let i = 0; i < elements.length; i++) {
    let element = elements[i];

    let path = element.getAttribute("path");
    if (!path) {
      element.innerHTML = "";
      continue;
    }

    let data = path.split(".").reduce(function (o, k) {
      return o && o[k];
    }, props);

    element.innerHTML = data;
  }
}

export function initProps(html: string, componentID: string) {
  let propElements = html.match(PROP_REGEX);
  if (!propElements) return html;

  for (let i = 0; i < propElements.length; i++) {
    let propElement = propElements[i];
    html = html.replace(
      propElement,
      propElement.replace(
        "<props",
        `<props ${getAttributeName("parent-id")}="${componentID}"`
      )
    );
  }

  return html;
}

export function waitLoad(assetID: string) {
  return new Promise<string>((res) => {
    if (assetID in htmlCache) return res(htmlCache[assetID]);
    loadEmitter.addEventListener(`load.${assetID}`, () => {
      res(htmlCache[assetID]);
    });
  });
}

export async function getHTML(assetID: string) {
  if (!(assetID in assetStorage))
    throw new Error(`Asset not found. ID: ${assetID}`);
  if (assetID in htmlCache) return htmlCache[assetID];
  if (htmlLoaderSet.has(assetID)) return await waitLoad(assetID);

  let loadStartTime = new Date().getTime();

  log(`components.getHTML`, assetID, `Started to load`);

  htmlLoaderSet.add(assetID);

  let res: Response;
  let url = assetStorage[assetID];
  if (useCacheStorage) {
    let match = await cache.match(url);
    if (match) res = match;
    else {
      res = await fetch(url);
      await cache.put(url, res);
      res = (await cache.match(url))!;
    }
  } else res = await fetch(url);
  let data = await res.text();

  htmlCache[assetID] = styleApplyer(
    vitePatcher(cssApplyer(data, assetID)),
    assetID
  );
  loadEmitter.emit(`load.${assetID}`);
  htmlLoaderSet.delete(assetID);

  log(
    `components.getHTML`,
    assetID,
    `Loaded within ${new Date().getTime() - loadStartTime}ms`
  );

  return htmlCache[assetID];
}

export function renderComponents() {
  setRednerInterval();
  LAST_RENDER = new Date().getTime();
  let elements = document.querySelectorAll(SELECTOR);

  if (elements.length == 0) return new Promise<void>((res) => res());

  log(
    "components.renderComponents",
    "render",
    `Started to render ${elements.length} components.`
  );

  let emitter = new Emitter();

  let loadedCount = 0;
  let includesComponent = false;

  for (let i = 0; i < elements.length; i++) {
    let component = elements[i];
    let assetID = component.getAttribute(getAttributeName(`asset-id`));
    if (!assetID)
      throw new Error(
        getAttributeName(`asset-id`) + ` not found for element ` + component
      );
    component.setAttribute(getAttributeName(`asset-loading`), "true");

    if (component.getAttribute(getAttributeName("props")) == null)
      component.setAttribute(getAttributeName("props"), "{}");

    let id = Math.round(Math.random() * 36 * 36 * 36 * 36 * 36 * 36).toString(
      36
    );
    component.setAttribute(getAttributeName("id"), id);
    (async () => {
      const observer = new MutationObserver(() => {
        propsApplyer(component);
      });
      let html = await getHTML(assetID);
      html = constPropsApplyer(
        html,
        JSON.parse(
          component.getAttribute(getAttributeName("const-props")) || "{}"
        )
      );
      component.removeAttribute(getAttributeName("const-props"));
      component.innerHTML = initProps(html, id);
      propsApplyer(component);
      observer.observe(component, config);
      component.setAttribute(getAttributeName(`asset-loading`), "false");

      if (html.includes("<component")) includesComponent = true;

      loadedCount++;
      emitter.emit("load");
    })();
  }
  return new Promise<void>((res) => {
    const listener = () => {
      if (loadedCount != elements.length) return;
      emitter.removeEventListener("load", listener);
      res();

      if (includesComponent) renderComponents();
    };
    emitter.addEventListener("load", listener);
  });
}

export async function reopenCache() {
  cache = await caches.open(`${PROJECT_NAME}.html`);
}

export async function start() {
  await reopenCache();
  paused = false;
  renderComponents().then(() => {
    setRednerInterval();
  });
}

export function pauseRender() {
  if (paused) return;
  if (RENDER_INTERVAL) clearInterval(RENDER_INTERVAL);
  paused = true;
}

export function resumeRender() {
  if (!paused) return;
  paused = false;
  setRednerInterval();
}
