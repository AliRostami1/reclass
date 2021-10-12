#!/usr/bin/env node

import { launch, getStream } from "puppeteer-stream";
import { Page } from "puppeteer-core";
import { format } from "date-fns";
import { createInterface } from "readline";
import { spawn } from "child_process";
import { config } from "dotenv";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

interface Klass {
  [key: string]: string | boolean;
  name: string;
  time: string;
  biweekly: boolean;
}

const exampleklass: Klass = {
  name: "انتقال داده ها",
  time: "12:00",
  biweekly: false,
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// load .env
config();

type EnvironmentVariables =
  | "GOOGLE_CHROME_PATH"
  | "FFMPEG_PATH"
  | "FFPLAY_PATH"
  | "DAAN_USERNAME"
  | "DAAN_PASSWORD";

function getEnv(env: EnvironmentVariables): string {
  const ENV = process.env[env];
  if (ENV && ENV !== "") {
    return ENV;
  } else {
    throw `${env} environment variable should be set`;
  }
}

const GOOGLE_CHROME_PATH = process.env.GOOGLE_CHROME_PATH;
const FFMPEG_PATH = process.env.FFMPEG_PATH;
const FFPLAY_PATH = process.env.FFMPEG_PATH;
const DAAN_USERNAME = process.env.FFMPEG_PATH;
const DAAN_PASSWORD = process.env.FFMPEG_PATH;

async function minimize(page: Page) {
  const session = await page.target().createCDPSession();
  const { windowId } = await session.send("Browser.getWindowForTarget");
  await session.send("Browser.setWindowBounds", {
    windowId,
    bounds: { windowState: "minimized" },
  });
}

async function main() {
  const browser = await launch({
    defaultViewport: {
      width: 0,
      height: 0,
    },
    args: ["--start-maximized"],
    executablePath: getEnv("GOOGLE_CHROME_PATH"),
  });

  const isBrowserOpen = async () => {
    try {
      const pages = await browser.pages();
      return pages.length !== 0;
    } catch (error) {
      return false;
    }
  };
  const pages = await browser.pages();
  const page = pages[0];

  await minimize(page as any);

  while (await isBrowserOpen()) {
    try {
      await page.goto(
        "http://mashhad.daan.ir/login-identification-form#login-identification-form"
      );

      const usernameInput = await page.waitForSelector(
        "input#identificationNumber"
      );
      if (usernameInput) {
        await usernameInput.type(getEnv("DAAN_USERNAME"), { delay: 100 });
      } else {
        throw "usernameInput doesn't exist";
      }

      const passInput = await page.waitForSelector("input#password");
      if (passInput) {
        await passInput.type(getEnv("DAAN_PASSWORD"), { delay: 100 });
      } else {
        throw "passInput doesn't exist";
      }

      await delay(1000);
      const btn = await page.waitForSelector("button.btn.btn-primary");
      if (btn) {
        await Promise.all([
          btn.click(),
          page.waitForNavigation({ waitUntil: "networkidle2" }),
        ]);
        const url = await page.url();
        if (url === "http://mashhad.daan.ir/class-dashboard") {
          break;
        } else {
          throw "login failed";
        }
      } else {
        throw "btn doesn't exist";
      }
    } catch (e) {
      console.error(e);
      console.log("trying again...");
      continue;
    }
  }
  console.log("logged in successfuly");

  const isInClass = () => {
    const url = page.url();
    const res = url.match(/class(\d)+\.daan\.ir/);
    return !!res;
  };
  while (await isBrowserOpen()) {
    try {
      if (isInClass()) {
        break;
      }
      await page.goto("http://mashhad.daan.ir/session-list");

      await page.waitForSelector("div.examBox");

      const klassBtnHandle = await page.evaluateHandle(
        (exampleklass: Klass) => {
          const elements = document.querySelectorAll("div.examBox");
          if (elements.length === 0) {
            // there is no class
            return;
          }

          let thisIsIt = -1;

          elements.forEach((el, index) => {
            const title = el.children[0].children[2].textContent;
            const name =
              el.children[1].children[0].children[0].children[2].textContent;
            const time =
              el.children[1].children[1].children[1].children[2].textContent;
            if (name === exampleklass.name) {
              if (exampleklass.biweekly) {
                if (title !== name) {
                  thisIsIt = index;
                }
              } else {
                if (time === exampleklass.time) {
                  thisIsIt = index;
                }
              }
            }
          });
          if (thisIsIt !== -1) {
            return elements[thisIsIt].querySelector(
              'button.btn.examBtn.resultBtn[type="submit"]'
            );
          }
        },
        exampleklass
      );

      const klassBtn = klassBtnHandle.asElement();

      if (klassBtn) {
        await Promise.all([
          klassBtn.click(),
          page.waitForNavigation({ waitUntil: "networkidle2" }),
        ]);
      } else {
        throw "klassBtn not found";
      }

      if (isInClass()) {
        console.log("enterd class");
        break;
      } else {
        throw "failed entering the class";
      }
    } catch (e) {
      console.error(e);
      console.log("trying again in a minute...");
      await delay(1000 * 60);
      continue;
    }
  }

  const basePath = "./out/";
  const videoName = `${exampleklass.name}-${format(
    Date.now(),
    "yyyy-MM-dd_kk-mm-ss"
  )}`;
  const plainVideoPath = `${basePath}${videoName}.mp4`;
  const stream = await getStream(page, { audio: true, video: true });
  const ffmpeg = spawn(
    getEnv("FFMPEG_PATH"),
    [
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
      `"crop=in_w:in_h-155"`,
      "-c:a",
      "mp3",
      "-f",
      "mp4",
      plainVideoPath,
      "-q:a",
      "0",
      "-map",
      "a",
      "-f",
      "mp3",
      "-",
    ],
    { shell: true }
  );
  console.log("started recording");
  const ffplay = spawn(getEnv("FFPLAY_PATH"), ["-"]);
  ffmpeg.stderr.pipe(process.stdout);
  ffmpeg.stdout.pipe(ffplay.stdin);
  stream.pipe(ffmpeg.stdin);

  const exitProcedure = async () => {
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
      await browser.close();
      console.log("closed the browser");
      process.exit(0);
    }
  };

  rl.on("line", async (input) => {
    if (input === "stop") {
      await exitProcedure();
    }
  });

  setTimeout(async () => {
    console.log("reached limit");
    await exitProcedure();
  }, 1000 * 60 * 90);

  (async () => {
    while (await isBrowserOpen()) {
      try {
        const audioBtn = await page.$(
          'button.jumbo--Z12Rgj4.buttonWrapper--x8uow.audioBtn--1H6rCK[aria-label="تنها شنونده"]'
        );
        if (audioBtn) {
          audioBtn.click();
        }
        const endModal = await page.$("div.modal--MalHB");
        if (endModal) {
          console.log("encountered end of class");
          await exitProcedure();
        }
        await delay(1000 * 60);
      } catch (e) {
        console.log(e);
        await delay(1000 * 60);
        continue;
      }
    }
  })();

  await (async () => {
    await delay(1000 * 60 * 20);
    let counter = 0;
    while (await isBrowserOpen()) {
      try {
        const users = await page.$$("div.userListItem--Z1qtuLG");
        if (users.length < 5) {
          console.log("there are less than 5 people in the class");
          counter += 1;
        } else {
          counter = 0;
        }
        if (counter >= 2) {
          await exitProcedure();
        }
        await delay(1000 * 60);
      } catch (e) {
        console.log(e);
        await delay(1000 * 60);
        continue;
      }
    }
  })();
}

main();
