![Build](https://github.com/LuisMayo/TelegramHateMod/workflows/Build/badge.svg)
# TelegramHateMod
⚠ This project was never really optimized/finished. Hatesonar detects things as "I'm gay" as hate speech with more confidence than "nigger". Since this project was meant to be an automoderator for an LGTB group this problems weren't ignorable.
I haven't archived it because I'm willing to accept PRs improving it, but I'm not using it myself so I won't put much time into it.
Mod to avoid hate speech on Telegram using [hatesonar](https://github.com/Hironsan/HateSonar).

### Prerequisites
 - Node.js
 - Python >=3.6 (2.7 should theorically work but I haven't managed to make it work)
 - A bot token. You can get one chatting with BotFather

### Installing

Clone the repository

```
git clone https://github.com/LuisMayo/TelegramHateMod.git
```
npm install into the cloned repo
```
npm i
```
Install Python dependencies
```
pip install hatesonar
```
There are thousands of reasons a pip install can fail, for me it failed because I didn't have Cython, so if it fails try installing it using, then try installing hatesonar again
```
(optional)
pip install Cython
pip install hatesonar
```

Build the project
`tsc`
Start the project
`node build/index.js`


## Contributing
Since this is a tiny project we don't have strict rules about contributions. Just open a Pull Request to fix any of the project issues or any improvement you have percieved on your own. Any contributions which improve or fix the project will be accepted as long as they don't deviate too much from the project objectives. If you have doubts about whether the PR would be accepted or not you can open an issue before coding to ask for my opinion
