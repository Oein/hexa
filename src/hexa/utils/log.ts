export let logEnabled = false;

export function setLogEnabled(enabled: boolean) {
  logEnabled = enabled;
}

export default function log(type: string, subType: string, message: string) {
  if (logEnabled)
    console.log(
      `%c ${type} %c ${subType} %c ${message}`,
      "background:#444;padding: 1px;border-radius: 3px 0 0 3px;color:#fff",
      "background:deepskyblue;padding: 1px;border-radius: 0 3px 3px 0;color:#fff",
      "background:transparent"
    );
}
