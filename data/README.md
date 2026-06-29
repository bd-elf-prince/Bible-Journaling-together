# Bible data drop zone

`v4-reader.js` now looks for this file at runtime:

```text
data/bible-kor.json
```

Use this shape for the full Bible text when a rights-cleared Korean Bible file is ready:

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

A flat verse list is also accepted:

```json
[
  {"bookKey":"gen","bookName":"창세기","chapter":1,"verse":1,"text":"태초에 하나님이 천지를 창조하시니라"}
]
```

Do not add a full copyrighted Bible text until the project has permission to use that translation.
