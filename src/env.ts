import { config } from "dotenv";
// load .env
config();

type EnvironmentVariables =
  | "GOOGLE_CHROME_PATH"
  | "FFMPEG_PATH"
  | "FFPLAY_PATH"
  | "DAAN_USERNAME"
  | "DAAN_PASSWORD";

console.log(getEnv("FFMPEG_PATH"));
// console.log(getEnv("FFPLAY_PATH"));

export function getEnv(env: EnvironmentVariables): string {
  const ENV = process.env[env];
  if (ENV && ENV !== "") {
    return ENV;
  } else {
    throw `${env} environment variable should be set`;
  }
}
