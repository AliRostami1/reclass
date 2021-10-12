import { Browser, Page } from "puppeteer-core";
import { launch } from "puppeteer-stream";

import { getEnv } from "./env";

export async function minimizeBrowser(page: Page) {
  const session = await page.target().createCDPSession();
  const { windowId } = await session.send("Browser.getWindowForTarget");
  await session.send("Browser.setWindowBounds", {
    windowId,
    bounds: { windowState: "minimized" },
  });
}

export async function openBrowser() {
  return launch({
    defaultViewport: {
      width: 0,
      height: 0,
    },
    args: ["--start-maximized"],
    executablePath: getEnv("GOOGLE_CHROME_PATH"),
  }) as unknown as Promise<Browser>;
}

export async function getFirstTab(browser: Browser) {
  const [page] = await browser.pages();
  return page as Page;
}

export async function isBrowserOpen(browser: Browser) {
  try {
    const pages = await browser.pages();
    return pages.length !== 0;
  } catch (error) {
    return false;
  }
}
