import pptr from "puppeteer";
import { PuppeteerScreenRecorder } from "puppeteer-screen-recorder";

function sleep(time: number) {
	return new Promise(function (resolve) {
		setTimeout(resolve, time);
	});
}

(async () => {
	const browser = await pptr.launch({
		defaultViewport: {
			width: 1920,
			height: 1080,
		},
	});
	const page = await browser.newPage();
	const recorder = new PuppeteerScreenRecorder(page, {
		followNewTab: true,
		fps: 24,
		ffmpeg_Path: "/usr/bin/ffmpeg",
		videoFrame: {
			width: 1920,
			height: 1080,
		},
	});
	await recorder.start("/mnt/c/Users/AliRs/Desktop/test.mp4"); // supports extension - mp4, avi, webm and mov
	console.log("Started recording");
	await page.goto("http://mashhad.daan.ir/");
	await sleep(5 * 1000);
	await await recorder.stop();
	console.log("Finished recording");
	await browser.close();
})();
