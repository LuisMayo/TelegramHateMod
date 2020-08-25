![Build](https://github.com/LuisMayo/TelegramHateMod/workflows/Build/badge.svg)
# TelegramHateMod
Telegram bot to moderate hate speech and toxicity in general

### Prerequisites
 - Node.js
 - A server/kubernetes/whatever executing [IBM's MAX-Toxic-Comment-Classifier](https://github.com/IBM/MAX-Toxic-Comment-Classifier)
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


Build the project
`tsc`
Start the project
`node build/index.js`


## Contributing
Since this is a tiny project we don't have strict rules about contributions. Just open a Pull Request to fix any of the project issues or any improvement you have percieved on your own. Any contributions which improve or fix the project will be accepted as long as they don't deviate too much from the project objectives. If you have doubts about whether the PR would be accepted or not you can open an issue before coding to ask for my opinion
