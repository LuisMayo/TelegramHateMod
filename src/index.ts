import { pythonBridge, PythonBridge } from 'python-bridge';
import * as fs from 'fs';
import * as Telegraf from 'telegraf';
import { MainService } from './main-service';
import { Actions } from './actions';

const schinquirer = require("@luismayo/schinquirer");


async function main() {
    if (fs.existsSync('./conf/conf.json')) {
        MainService.conf = JSON.parse(fs.readFileSync('./conf/conf.json', {encoding: 'utf-8'}));
    } else {
        const schema = JSON.parse(fs.readFileSync('./conf/conf.schema.json', {encoding: 'utf-8'})).data.attributes;
        MainService.conf = await schinquirer.prompt(schema);
        fs.writeFile('./conf/conf.json', JSON.stringify(MainService.conf), {encoding: 'utf-8'}, () => {});
    }
    const bot = new Telegraf.default(MainService.conf.token);
    const python = pythonBridge({
        python: MainService.conf.pythonInterpreter,
        stdio: ['ignore', 'pipe', 'ignore']
    });
    python.ex`from hatesonar import Sonar`;
    python.ex`import json`;
    python.ex`sonar = Sonar()`;

    bot.start(ctx => ctx.reply('I will moderate delete hate messages and/or kick users. Please make me an admin'));
    bot.use(ctx => {
        const text = ctx.message.text || ctx.message.caption;
        if (text && ctx.message.from) {
            checkText(text, python, ctx).then((result) => {
                if (result === Actions.KICK || result === Actions.DELETE) {
                    ctx.deleteMessage();
                }
                if (result === Actions.KICK) {
                    ctx.kickChatMember(ctx.from.id);
                }
            });
        }
    });
    bot.launch();
}

async function checkText(text: string, python: PythonBridge, ctx: Telegraf.Context) {
    // const result = await python.ex`json.dumps(sonar.ping(text=${text}))`;
    const result = await python`sonar.ping(text=${text})`;
    if (MainService.conf.debugMode) {
        ctx.reply(JSON.stringify(result));
    }
    if (result.top_class !== 'neither') {
        const hate = result.classes.find(item => item.class_name === 'hate_speech');
        const offensive = result.classes.find(item => item.class_name === 'offensive_language');
        if (hate.confidence >= MainService.conf.kickConfidenceHate || offensive.confidence >= MainService.conf.kickConfidenceOffensive) {
            console.log(new Date().toISOString() + ' kick');
            return Actions.KICK;
        }
        if (hate.confidence >= MainService.conf.deleteConfidenceHate || offensive.confidence >= MainService.conf.deleteConfidenceOffensive) {
            console.log(new Date().toISOString() + ' delete');
            return Actions.DELETE;
        }
    }
    return Actions.NOTHING;
}

main().then(() => {});