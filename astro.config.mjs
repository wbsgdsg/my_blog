import { defineConfig } from "astro/config";

const repository = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";
const owner = process.env.GITHUB_REPOSITORY_OWNER ?? "your-github-name";
const isUserSite = repository.endsWith(".github.io");

export default defineConfig({
  site: `https://${owner}.github.io`,
  base: repository && !isUserSite ? `/${repository}` : "/",
  output: "static"
});
