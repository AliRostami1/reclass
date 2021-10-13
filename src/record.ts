import { format } from "date-fns";
import { Page } from "puppeteer-core";
import { getStream } from "puppeteer-stream";
import { spawn } from "child_process";

import { Klass } from "./daan";
import { getEnv } from "./env";

export function generateVideoName(klass: Klass) {
  const basePath = "./out/";
  const videoName = `${klass.name}-${format(
    Date.now(),
    "yyyy-MM-dd_kk-mm-ss"
  )}`;
  return `${basePath}${videoName}.mp4`;
}

export async function startRecordingAndPlayingSound(page: Page, klass: Klass) {
  const stream = await getStream(page as any, { audio: true, video: true });
  const ffmpeg = spawn(getEnv("FFMPEG_PATH"), [
    "-y",
    "-i",
    "-",
    "-c:v",
    "libx265",
    "-crf",
    "26",
    "-r",
    "24",
    "-filter:v",
    "crop=in_w:in_h-155",
    "-c:a",
    "mp3",
    "-f",
    "mp4",
    generateVideoName(klass),
    "-q:a",
    "0",
    "-map",
    "a",
    "-f",
    "mp3",
    "-",
  ]);
  console.log("started recording");
  const ffplay = spawn(getEnv("FFPLAY_PATH"), ["-"]);
  stream.pipe(ffmpeg.stdin);
  ffmpeg.stderr.pipe(process.stdout);
  ffmpeg.stdout.pipe(ffplay.stdin);

  return async () => {
    if (!stream.destroyed) {
      await stream.destroy();
      console.log("stopped recording");
      const ffmpegClosed = ffmpeg.kill("SIGINT");
      if (ffmpegClosed) {
        console.log("ffmpeg process exited successfully");
      }
      const ffplayClosed = ffplay.kill("SIGINT");
      if (ffplayClosed) {
        console.log("ffplay process exited successfully");
      }
    }
  };
}
