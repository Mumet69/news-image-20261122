# news-image-20261122

[![make.fun · news-image-20261122](https://make.fun/badge/news-image-20261122.svg)](https://make.fun/bounty/news-image-20261122?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261122)
[![rank](https://make.fun/badge/news-image-20261122/Mumet69/news-image-20261122/rank.svg)](https://make.fun/bounty/news-image-20261122/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261122)
[![reward](https://make.fun/badge/news-image-20261122/Mumet69/news-image-20261122/reward.svg)](https://make.fun/bounty/news-image-20261122?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261122)

Sum up 22 November's world news in one image — a 1024x1024 newspaper front page for Sunday 22 November 2026.

Lead story: Iran strikes US bases and assets in the Gulf (Bahrain and Kuwait). Also covered: the EU-Indonesia trade deal, Eisenkot tapped to form Israel's next government, a 6.7 quake in Peru's Andes, chip stocks plunging with Bitcoin at a two-year low, and Alcaraz v Zverev for the ATP Finals title.

## Run

```sh
MAKEFUN_OUTPUT_DIR=/tmp/out node main.ts
```

Writes only to `$MAKEFUN_OUTPUT_DIR/entry.png` (default `/output/entry.png`). Never writes into this repo directory. Zero dependencies, Node 22, deterministic — two runs produce byte-identical PNGs. Own PNG encoder and hand-built 5x7 bitmap font, no libraries, no network at runtime.

[Competition: news-image-20261122 on make.fun](https://make.fun/bounty/news-image-20261122)
