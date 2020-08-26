import * as fs from 'fs';
import * as Telegraf from 'telegraf';
import { MainService } from './main-service';
import { Actions } from './actions';
import { fetch, Headers } from 'cross-fetch';
import { User } from 'telegraf/typings/telegram-types';

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
    bot.start(ctx => ctx.reply('I will moderate delete hate messages and/or kick users. Please make me an admin'));
    bot.use(ctx => {
        if (ctx.message) {
            const text = ctx.message.text || ctx.message.caption;
            if (text && ctx.message.from) {
                checkText(text, ctx).then((result) => {
                    if (result === Actions.KICK || result === Actions.DELETE) {
                        ctx.deleteMessage();
                        if (result === Actions.DELETE) {
                            ctx.reply(`⚠ ${makeUserLink(ctx.from)} watch your language or you'll be banned`, {parse_mode: 'Markdown'});
                        }
                    }
                    if (result === Actions.KICK) {
                        ctx.kickChatMember(ctx.from.id);
                    }
                });
            }
        }
    });
    bot.launch();
}

async function checkText(text: string, ctx: Telegraf.Context) {
    // const result = await python.ex`json.dumps(sonar.ping(text=${text}))`;
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    const result = await (await fetch(MainService.conf.serverUrl + 'model/predict', {method: 'POST', headers: headers, body: JSON.stringify({text: [text]})})).json();
    if (MainService.conf.debugMode) {
        ctx.reply(JSON.stringify(result, null, 2));
    }

    const prediction = result.results[0].predictions;
        if (prediction.toxic >= MainService.conf.toxicKickConfidence
            || prediction.severe_toxic >= MainService.conf.severeToxicKickConfidence
            || prediction.obscene >= MainService.conf.obsceneKickConfidence
            || prediction.threat >= MainService.conf.threatKickConfidence
            || prediction.insult >= MainService.conf.insultKickConfidence
            || prediction.identity_hate >= MainService.conf.hateKickConfidence) {
            console.log(new Date().toISOString() + ' kick');
            return Actions.KICK;
        }
        if (prediction.toxic >= MainService.conf.toxicDeleteConfidence
            || prediction.severe_toxic >= MainService.conf.severeToxicDeleteConfidence
            || prediction.obscene >= MainService.conf.obsceneDeleteConfidence
            || prediction.threat >= MainService.conf.threatDeleteConfidence
            || prediction.insult >= MainService.conf.insultDeleteConfidence
            || prediction.identity_hate >= MainService.conf.hateDeleteConfidence) {
            console.log(new Date().toISOString() + ' kick');
            return Actions.DELETE;
        }
    return Actions.NOTHING;
}

function makeUserLink(usr: User) {
    return `[${usr.first_name}](tg://user?id=${usr.id})`
}

main().then(() => {});