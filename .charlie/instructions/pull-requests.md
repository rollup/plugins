# Pull Requests: house rules

- Always use the repository’s Pull Request (PR) Template. Fill out all sections, including links, context, and checklists. For breaking changes, document the migration clearly in the template.
- Always analyze the change for potential breaking changes. If any public API, runtime behavior, defaults, or supported environments change, treat it as breaking.
- Always use Conventional Commits format for PR titles: `type(scope): summary`.
  - Use lowercase `type` and `scope` (e.g., `fix(node-resolve): …`, `feat(babel): …`).
  - Keep the summary under ~72 characters; be specific and action‑oriented.
- For breaking changes, use the bang after the scope and annotate the PR template:
  - Example: `feat(commonjs)!: drop Node 14 support`
  - Also mark the PR Template’s breaking‑change section and include migration notes.
- Use `chore(repo): …` in PR titles for any PR that does not modify package source code (implementation) — docs, CI, release scripts, templates, configs, repo maintenance.
- If a PR is a repository management task (even when it touches a package’s meta files like `package.json`, `.d.ts`, or config), title it with `chore(repo): …`.
- Before marking a PR ready for review, run locally:
  - `pnpm lint`
  - `pnpm fix:js`

Examples

- Non‑breaking feature to a plugin: `feat(babel): add includeChunks/excludeChunks`
- Breaking change to a plugin: `fix(node-resolve)!: change default resolution for "imports" bare targets`
- Repo maintenance: `chore(repo): update PR template and lint settings`
