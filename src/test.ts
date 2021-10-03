import { launch, getStream } from "puppeteer-stream";
import { path as ffmpegPath } from "@ffmpeg-installer/ffmpeg";
import { format } from "date-fns";
import ffmpeg from "fluent-ffmpeg";

import { createWriteStream } from "fs";

ffmpeg.setFfmpegPath(ffmpegPath);

async function test() {
	const browser = await launch({
		defaultViewport: {
			width: 0,
			height: 0,
		},
		args: ["--start-maximized"],
		executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
	});
	process.on("beforeExit", () => {
		browser.close();
	});

	const pages = await browser.pages();
	const page = pages[0];

	try {
		await page.goto("https://www.youtube.com/watch?v=NqpgYoLqXrU");
	} catch (e) {
		console.log(e);
	}

	const basePath = "./out/";
	const videoName = `test-${format(Date.now(), "yyyy-MM-dd")}`;
	const plainVideoPath = `${basePath}${videoName}.mp4`;
	const x265VideoPath = `${basePath}${videoName}-x265.mp4`;
	const file = createWriteStream(plainVideoPath);
	const stream = await getStream(page, { audio: true, video: true });
	stream.pipe(file);
	console.log("started recording");

	const exitProcedure = async () => {
		await stream.destroy();
		console.log("stopped recording");
		file.close();
		console.log("file saved!");
		ffmpeg(plainVideoPath)
			.fps(24)
			.format("mp4")
			.videoCodec("libx265")
			.addOption(["-crf 20", "-max_muxing_queue_size 512"])
			.save(x265VideoPath)
			.on("start", () => {
				console.log(" ------- started  ------- ");
			})
			.on("stderr", (err) => {
				console.error(err);
			})
			.on("end", () => {
				console.log("  ------- finished  ------- ");
				process.exit(0);
			});
	};

	setTimeout(async () => {
		await exitProcedure();
	}, 1000 * 60 * 15);
}

test();
