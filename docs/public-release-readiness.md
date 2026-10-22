# Public release readiness

This is a short review record for making the repository public. It does not authorize or perform a visibility change.

## In place

- GitHub description and topics identify this as the reviewed-article publishing stage of Open Context Forge.
- The English [README](../README.md) links to a Chinese version and states the limits of each channel. The [MIT license](../LICENSE) is present.
- The Skill uses only Node.js built-ins. `npm test` covers the export CLI, and CI runs those tests on Node.js 20 and 22 for pushes and pull requests. Both jobs passed in [the first CI run](https://github.com/apframework-studio/open-context-forge-article-publisher/actions/runs/39787788470).
- The current channel rules use generic example paths instead of a maintainer's home directory.

## Check before changing visibility

1. **Decide how to handle Git history.** Commit `4e1393b` contains a maintainer-specific home directory in `references/apframework.md`. The current file has been corrected, but making the repository public also makes that historical text visible. If the path itself must remain private, rewrite the history and coordinate the resulting force push before changing visibility. If it is acceptable, record that decision and keep the history intact.
2. **Check the latest CI result.** Confirm that the most recent commit also passes both GitHub jobs before changing visibility.
3. **Review a fresh checkout.** Follow the English README from a clean clone, load the whole Skill directory in the intended agent, and prepare a synthetic article for each channel. Confirm that no machine-specific paths or private project content are needed.
4. **Review the public-facing language.** The README is bilingual, while `SKILL.md` and channel references are in Chinese. Decide whether this matches the intended users before announcing an English-language release.
5. **Review repository settings.** Confirm the desired Issues/Discussions policy and add a support or contribution guide only if outside contributors are expected. Choose a homepage only if there is a canonical public project page.

The WeChat channel currently prepares an editor import package; it does not publish to an account. For the apframework channel, a generated package, a repository write, and a verified public article URL are distinct states.

GitHub documents the [effects of changing repository visibility](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/setting-repository-visibility) and [Node.js CI workflows](https://docs.github.com/en/actions/tutorials/build-and-test-code/nodejs).
