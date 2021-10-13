#!/usr/bin/env node

import { openBrowser, getFirstTab } from "./page";
import { startRecording } from "./record";

process.on("SIGINT", () => {
  console.log("SIGNIT received");
  process.exit(0);
});

async function main() {
  const browser = await openBrowser();
  browser.on("disconnected", (ev) => {
    console.log("browser closed");
  });
  const page = await getFirstTab(browser);
  const stopRecording = await startRecording(page, "test");
  await page.goto("https://www.youtube.com/watch?v=D9DBEMol5cU");
  const button = await page.waitForSelector(
    'tp-yt-paper-button[aria-label="Agree to the use of cookies and other data for the purposes described"]'
  );
  if (button) {
    button.click();
  } else {
    console.log("button not found");
  }
  setTimeout(() => {
    stopRecording();
  }, 100000);
}

main();
