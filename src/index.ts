import { launch, getStream } from "puppeteer-stream";
import fs from "fs";

const file = fs.createWriteStream("./out/video.mp4");

async function test() {
	const browser = await launch({
		defaultViewport: {
			width: 1920,
			height: 1080,
		},
		headless: false,
		args: [
			`--disable-extensions-except=${StayFocusd}`,
			`--load-extension=${StayFocusd}`,
			"--enable-automation",
		],
	});

	const page = await browser.newPage();
	await page.goto("http://mashhad.daan.ir/");
	const stream = await getStream(page, { audio: true, video: true });
	console.log("recording");
	stream.pipe(file);
	setTimeout(async () => {
		await stream.destroy();
		file.close();
		console.log("finished");
	}, 1000 * 5);
}

test();
