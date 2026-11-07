#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const web = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repo = path.dirname(web);
const git = (args, cwd = repo) =>
  execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
if (git(["status", "--porcelain"]))
  throw new Error(
    "Сначала закоммитьте изменения, чтобы опубликованная сборка соответствовала коммиту.",
  );
const remote = git(["remote", "get-url", "origin"]);
const source = git(["rev-parse", "--short=12", "HEAD"]);
const name = git(["config", "user.name"]);
const email = git(["config", "user.email"]);
execFileSync("npm", ["run", "build:pages"], { cwd: web, stdio: "inherit" });
execFileSync("node", ["--test", "tests/pages-build.test.mjs"], {
  cwd: web,
  stdio: "inherit",
});
const output = path.join(web, "dist", "pages");
if (!existsSync(path.join(output, "index.html")))
  throw new Error("Не найдена статическая сборка.");
const deployment = mkdtempSync(path.join(tmpdir(), "album-pages-"));
try {
  git(["init", "--quiet", "--initial-branch=gh-pages"], deployment);
  git(["remote", "add", "origin", remote], deployment);
  git(["config", "user.name", name], deployment);
  git(["config", "user.email", email], deployment);
  if (git(["ls-remote", "--heads", "origin", "gh-pages"], deployment)) {
    git(["fetch", "--depth=1", "origin", "gh-pages"], deployment);
    git(["checkout", "-B", "gh-pages", "FETCH_HEAD"], deployment);
    for (const file of readdirSync(deployment))
      if (file !== ".git")
        rmSync(path.join(deployment, file), { recursive: true, force: true });
  }
  cpSync(output, deployment, { recursive: true });
  git(["add", "--all"], deployment);
  if (git(["status", "--porcelain"], deployment))
    git(["commit", "-m", `Deploy draft from ${source}`], deployment);
  execFileSync("git", ["push", "origin", "HEAD:gh-pages"], {
    cwd: deployment,
    stdio: "inherit",
  });
  console.log(
    `Опубликована статическая сборка коммита ${source} в ветку gh-pages.`,
  );
} finally {
  rmSync(deployment, { recursive: true, force: true });
}
