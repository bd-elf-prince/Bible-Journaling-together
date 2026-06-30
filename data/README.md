# Bible data drop zone

`v5-reader.js` first tries this runtime file:

```text
data/bible-kor.json
```

`v5-bible-data-loader.js` also supports a split manifest:

```text
data/bible-index.json
```

Do not add a full copyrighted Bible text until the project has permission to use that translation.

## Recommended V5 split setup

For the full Korean Bible, prefer split files instead of one huge JSON when possible.

Create `data/bible-index.json`:

```json
{
  "books": [
    { "key": "gen", "url": "books/gen.json" },
    { "key": "exo", "url": "books/exo.json" }
  ]
}
```

Then create one file per book under `data/books/`:

```json
{
  "key": "gen",
  "name": "창세기",
  "english": "Genesis",
  "startPage": 1,
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
```

## Single-file option

The app still supports a single rights-cleared `data/bible-kor.json` file.

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

## Existing converter flow

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

5. Commit Bible text only after confirming the translation can be publicly distributed in this repository.
