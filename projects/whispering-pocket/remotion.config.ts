import { Config } from "@remotion/cli/config";
import fs from "fs";
import path from "path";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// In the cloud container remotion.media is unreachable, so use its pre-installed headless shell when present
const HEADLESS_SHELL = "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
if (fs.existsSync(HEADLESS_SHELL)) Config.setBrowserExecutable(HEADLESS_SHELL);

// Ensure shared lib/ imports resolve packages from this project's node_modules
// Without this, imports like `@remotion/transitions` in lib/transitions/ fail
// because webpack resolves them relative to lib/, not the project root.
Config.overrideWebpackConfig((config) => {
  return {
    ...config,
    resolve: {
      ...config.resolve,
      modules: [
        path.resolve(__dirname, "node_modules"),
        ...(config.resolve?.modules || ["node_modules"]),
      ],
    },
  };
});
