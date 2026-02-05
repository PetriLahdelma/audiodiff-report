1/ Audio regressions are subtle. I wanted deterministic diffs for CI.
2/ audiodiff-report aligns two renders before comparing them.
3/ It outputs HTML/JSON/MD reports with producer-friendly metrics.
4/ It can also fail CI with `--fail` thresholds.
5/ Try: `npx audiodiff-report before.wav after.wav --format html --out ./audiodiff`
6/ Repo: PetriLahdelma/audiodiff-report
