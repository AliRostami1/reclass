const { spawn } = require("child_process");
const { normalize } = require("path/win32");
require("dotenv").config();

// const path = process.env.FFPLAY_PATH.replace(/(\s+)/g, "\\$1");
const path = process.env.FFMPEG_PATH;
console.log(path);

const ffmpeg = spawn(process.env.FFMPEG_PATH, ["-"], { shell: true });

ffmpeg.on("error", (err) => {
  console.error(err);
});

ffmpeg.stderr.pipe(process.stdout);

setTimeout(() => {}, 100000);
