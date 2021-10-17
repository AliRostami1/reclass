import { parse, hoursToMilliseconds } from "date-fns";

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function hhmmToDate(time: string) {
  return new Date(
    parse(time, "kk:mm", Date.now()).valueOf() + hoursToMilliseconds(3.5)
  );
}

export function biweeklyToNormal(time: string) {
  const hh = time.match(/\d\d/);
  const rest = time.match(/:\d\d/);
  if (hh) {
    let hhnum = parseInt(hh.toString());
    if (hhnum % 2 === 1) {
      hhnum -= 1;
      return `${hhnum}${rest}`;
    } else {
      return time;
    }
  } else {
    throw "can't match regex";
  }
}
