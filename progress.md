Original prompt: every level 10 up boss have the ability to dash backward from the hero tank if tank has ultimate shield, but if non, chase the hero tank... but every boss can use it once every 10 seconds

- Updated boss dash to use a short burst state with an extra speed bonus and a 10 second cooldown.
- Bosses only retreat from ultimate shield; normal shield does not change boss aggression.
- Added boss after-image trail rendering during dash.
- Validation: `npm run build` passed and a Playwright screenshot check rendered the game canvas successfully from the live app.
- Added a freeze-time power-up: enemies stop moving for 5 seconds, then recover movement gradually over 3 seconds with a freeze visual effect and tweak button.
- Added a scare power-up: enemies flee from the player for 5 seconds with a panic-style animation and tweak button.
- TODO: Keep using this file for future gameplay tweaks and validation notes.
