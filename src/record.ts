import { format } from "date-fns";
import { Page } from "puppeteer-core";
import { getStream } from "puppeteer-stream";
import { spawn } from "child_process";

import { getEnv } from "./env";

export function generateVideoName(name: string) {
  const basePath = "./out/";
  const videoName = `${name}-${format(Date.now(), "yyyy-MM-dd_kk-mm-ss")}`;
  return `${basePath}${videoName}.mp4`;
}

export async function startRecording(
  page: Page,
  name: string
): Promise<() => void> {
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
    "-max_muxing_queue_size",
    "1024",
    generateVideoName(name),
  ]);
  console.log("started recording");
  ffmpeg.stderr.on("data", (chunk) => {
    console.log(chunk.toString());
  });
  stream.pipe(ffmpeg.stdin);

  stream.on("error", (err) => {
    console.log(err);
  });
  stream.on("end", () => {
    console.log("stream ended");
  });

  return async () => {
    if (!stream.destroyed) {
      await stream.destroy();
      console.log("stopped recording");
    }
  };
}

export async function startRecordingAndPlayingSound(
  page: Page,
  name: string
): Promise<() => void> {
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
    "-max_muxing_queue_size",
    "1024",
    generateVideoName(name),
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
  ffmpeg.stderr.on("data", (chunk) => {
    console.log(chunk.toString());
  });
  ffmpeg.stdout.pipe(ffplay.stdin);
  stream.pipe(ffmpeg.stdin);

  stream.on("error", (err) => {
    console.log(err);
  });
  stream.on("end", () => {
    console.log("stream ended");
  });

  return async () => {
    if (!stream.destroyed) {
      await stream.destroy();
      console.log("stopped recording");
      const ffmpegClosed = ffmpeg.kill("SIGINT");
      if (ffmpegClosed) {
        console.log("ffmpeg process exited successfully");
      }
    }
  };
}
