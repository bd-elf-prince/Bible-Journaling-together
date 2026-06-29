# Bible data drop zone

`v4-reader.js` looks for this runtime file:

```text
data/bible-kor.json
```

Do not add a full copyrighted Bible text until the project has permission to use that translation.

## Quick start

1. Put a rights-cleared Bible source file somewhere outside this folder.
2. Convert it into the app format:

```bash
node tools/normalize-bible-data.mjs source-bible.json data/bible-kor.json
```

3. Validate the converted file:

```bash
node tools/validate-bible-data.mjs data/bible-kor.json
```

4. For a final 66-book Bible file, run the stricter check:

```bash
node tools/validate-bible-data.mjs data/bible-kor.json --strict
```

5. Commit `data/bible-kor.json` after confirming the translation can be used.

A tiny non-runtime example is available here:

```text
data/bible-kor.sample.json
```

## Accepted nested shape

```json
[
  {
    "key": "gen",
    "name": "창세기",
    "english": "Genesis",
    "startPage": 3,
    "chapters": [
      {
        "number": 1,
        "subtitle": "태초의 빛과 창조의 질서",
        "pageLeft": "창세기 · 첫째 날",
        "pageRight": "창세기 · 좋았더라",
        "verses": [
          [1, "태초에 하나님이 천지를 창조하시니라"],
          [2, "..."]
        ]
      }
    ]
  }
]
```

## Accepted flat shape

```json
[
  {"bookKey":"gen","bookName":"창세기","chapter":1,"verse":1,"text":"태초에 하나님이 천지를 창조하시니라"}
]
```
