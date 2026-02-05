# Audio Regression Testing in CI

```yaml
- uses: PetriLahdelma/audiodiff-report/.github/actions/audiodiff-report@v0.1.0
  with:
    before-path: ./renders/before
    after-path: ./renders/after
    glob: "**/*.{wav,aiff,flac}"
    thresholds: "lufs>0.3,tp>-1.0,clip=true"
    upload-artifact: true
    comment: true
```
