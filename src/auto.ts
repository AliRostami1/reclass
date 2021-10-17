#!/usr/bin/env node

import { openBrowser, getFirstTab } from "./page";
import { enterTheClass, listKlasses, login } from "./daan";
import { startRecordingAndPlayingSound } from "./record";
import {
  stopBasedOnClassEnding,
  stopBasedOnNumberOfParticipants,
  stopBasedOnStdin,
  stopBasedOnTimeout,
} from "./stop";

process.on("SIGINT", () => {
  console.log("SIGNIT received");
  process.exit(0);
});

async function main() {
  const browser = await openBrowser();
  const page = await getFirstTab(browser);
  // await minimizeBrowser(page);

  await login(browser, page);

  const listOfKlasses = await listKlasses(page);

  console.log(listOfKlasses);

  // await enterTheClass(browser, page, exampleklass);

  // const stopRecording = await startRecordingAndPlayingSound(page, "");

  // const exitProcedure = async () => {
  //   await stopRecording();
  //   await browser.close();
  //   console.log("closed the browser");
  // };

  // stopBasedOnStdin(exitProcedure);
  // stopBasedOnTimeout(exitProcedure);
  // stopBasedOnClassEnding(browser, page, exitProcedure);
  // stopBasedOnNumberOfParticipants(browser, page, exitProcedure);
}

main();
