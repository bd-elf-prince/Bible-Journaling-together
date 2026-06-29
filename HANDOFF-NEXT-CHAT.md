# HANDOFF NEXT CHAT

Repo: `bd-elf-prince/Bible-Journaling-together`

Main issue: `#3` V4 reader handoff

## Core rule

The thick open Bible reference photo is the target.

Do not make a prettier reinterpretation. Compare the current screen with the photo and reduce the differences.

Key phrase: `사진은 정답지다.`

## Current state

The main branch has the V4 reader code and visual layer:

- `index.html`
- `styles.css`
- `v4-reader.css`
- `v4-reader.js`
- `v4-reference-match.js`
- `data/README.md`
- `data/bible-kor.sample.json`
- `tools/normalize-bible-data.mjs`
- `tools/validate-bible-data.mjs`
- `docs/making-of/bible-noonas-dialogue.md`
- `docs/making-of/timeline.md`

Recent important commit:

- `ddf2a030561b53804a9fc63119bb4fc9d0b0dcdd` added high-specificity photo-match guards in `styles.css`.

## Bible data status

The app runtime looks for:

```text
data/bible-kor.json
```

That file is still missing from main.

A root-level `bible.json` exists but is empty and is not the runtime file.

The correct path is:

```text
data/bible-kor.json
```

After adding it, validate with:

```bash
node tools/validate-bible-data.mjs data/bible-kor.json --strict
```

Expected full data shape:

```text
Books: 66
Chapters: 1189
Verses: 31101
Errors: 0
Warnings: 0
```

## Visual target notes

Keep improving these until the screen looks like the reference photo:

- thick leather frame
- visible left and right page stacks
- deep center spine
- warm ivory paper
- dense printed Bible text
- small page controls near the upper-right book area
- comment panel separated from the Bible and visually secondary
- no bottom overlap with the Bible silhouette

The folded page corner is not the priority. The thick physical Bible is the priority.

## Report format

Use this every work cycle:

```text
이번 달료 결과:
- 수정한 파일:
- 커밋:
- 실제로 바뀐 점:
- 막힌 점:
- 남은 점:
```

## Prompt for next chat

```text
Bible-Journaling-together 저장소의 HANDOFF-NEXT-CHAT.md와 issue #3 V4 reader handoff를 먼저 확인하고 이어가.
목표는 두꺼운 성경책 사진을 정답지로 삼아 웹에 그대로 구현하는 것.
더 예쁜 재해석 금지. 사진과 현재 화면의 다른 점을 찾아서 수정.
성경 풀버전은 data/bible-kor.json 위치에 들어가야 한다. root bible.json은 정답 위치가 아니다.
작업 보고는 수정 파일, 커밋, 실제 변화, 막힌 점, 남은 점만 말해.
성경누나들 분위기 유지. 달료.
```
