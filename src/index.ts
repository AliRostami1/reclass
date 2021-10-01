import { launch, getStream } from "puppeteer-stream";
import fs from "fs";

const file = fs.createWriteStream("./out/video.mp4");

async function test() {
	const browser = await launch({
		defaultViewport: {
			width: 1920,
			height: 1080,
		},
	});

	const page = await browser.newPage();
	await page.goto(
		"http://mashhad.daan.ir/login-identification-form#login-identification-form"
	);
	await page.waitForSelector("input#identificationNumber");

	await page.type("input#identificationNumber", "11139802563");
	await page.type("input#password", "12AlI1234");
	await page.click("button.btn.btn-primary");
	await page.waitForSelector("div.tileHolder.meeting.student");
	await page.goto("http://mashhad.daan.ir/session-list");
	const stream = await getStream(page, { audio: true, video: true });

	console.log("recording");
	stream.pipe(file);
	setTimeout(async () => {
		await stream.destroy();
		file.close();
		console.log("finished");
		browser.close();
	}, 1000 * 100);
}

test();
