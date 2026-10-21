# Implementation plan

1. Add failing tests for source selection, preflight errors and the three initial output formats.
2. Implement one CLI with a shared article model and channel-specific rendering and paths. Keep external writes behind explicit CLI arguments and refuse collisions by default.
3. Port the existing skill guidance into the standalone repository, update it for the current writer artifact, and split detailed channel procedures into references.
4. Run Node tests, skill validator, and an isolated dry run against a real Open Context Forge article. Report the delivery level accurately.
