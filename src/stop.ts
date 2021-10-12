import { Browser, Page } from "puppeteer-core";
import { createInterface } from "readline";

import { isBrowserOpen } from "./page";
import { delay } from "./util";

export async function stopBasedOnStdin(exitFn: () => Promise<void>) {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.on("line", async (input) => {
    if (input === "stop") {
      await exitFn();
    }
  });
}

export async function stopBasedOnTimeout(exitFn: () => Promise<void>) {
  setTimeout(async () => {
    console.log("reached limit");
    await exitFn();
  }, 1000 * 60 * 90);
}

export async function stopBasedOnNumberOfParticipants(
  browser: Browser,
  page: Page,
  exitFn: () => Promise<void>
) {
  while (await isBrowserOpen(browser)) {
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
        await exitFn();
      }
      await delay(1000 * 60);
    } catch (e) {
      console.log(e);
      await delay(1000 * 60);
      continue;
    }
  }
}

export async function stopBasedOnClassEnding(
  browser: Browser,
  page: Page,
  exitFn: () => Promise<void>
) {
  await delay(1000 * 60 * 20);
  let counter = 0;
  while (await isBrowserOpen(browser)) {
    try {
      const users = await page.$$("div.userListItem--Z1qtuLG");
      if (users.length < 5) {
        console.log("there are less than 5 people in the class");
        counter += 1;
      } else {
        counter = 0;
      }
      if (counter >= 2) {
        await exitFn();
      }
      await delay(1000 * 60);
    } catch (e) {
      console.log(e);
      await delay(1000 * 60);
      continue;
    }
  }
}
