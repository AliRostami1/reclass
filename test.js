const { parse, hoursToMilliseconds } = require("date-fns");

function hhmmToDate() {
  return new Date(
    parse("18:00", "kk:mm", Date.now()).valueOf() + hoursToMilliseconds(3.5)
  );
}

function biweeklyToNormal(time) {
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

console.log(biweeklyToNormal("11:00"));
