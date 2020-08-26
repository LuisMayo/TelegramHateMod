import * as fs from 'fs';
import * as Telegraf from 'telegraf';
import { MainService } from './main-service';
import { Actions } from './actions';
import { fetch, Headers } from 'cross-fetch';
import { User } from 'telegraf/typings/telegram-types';
import * as storage from 'node-persist';
import { GroupInfo } from './groupinfo';

const schinquirer = require("@luismayo/schinquirer");


async function main() {
    if (fs.existsSync('./conf/conf.json')) {
        MainService.conf = JSON.parse(fs.readFileSync('./conf/conf.json', { encoding: 'utf-8' }));
    } else {
        const schema = JSON.parse(fs.readFileSync('./conf/conf.schema.json', { encoding: 'utf-8' })).data.attributes;
        MainService.conf = await schinquirer.prompt(schema);
        fs.writeFile('./conf/conf.json', JSON.stringify(MainService.conf), { encoding: 'utf-8' }, () => { });
    }
    storage.init({ dir: 'db/group' });
    const bot = new Telegraf.default(MainService.conf.token);
    bot.start(ctx => ctx.reply('I will moderate delete hate messages and/or kick users. Please make me an admin'));
    bot.command('about', ctx => ctx.reply('Made with ❤ by @TLuigi003. Source code avaiable at https://github.com/LuisMayo/TelegramHateMod'))
    bot.command('reload', ctx => {
        bot.telegram.getChatAdministrators(ctx.chat.id).then(adminList => { // we save the admins
            storage.set(ctx.chat.id.toString(), { id: ctx.chat.id.toString(), adminList: adminList.map(admin => admin.user) }).then(() => {
                storage.get(ctx.chat.id.toString()).then((value: GroupInfo) => {
                    ctx.reply('Admin list:\n' + value.adminList.map(usr => makeUserLink(usr)).join('\n'), { parse_mode: 'Markdown' });
                });
            })
        });
    });
    bot.use(ctx => {
        checkMessage(ctx);
    });
    bot.launch();

    async function checkMessage(ctx: Telegraf.Context) {
        const groupInfo: GroupInfo = await storage.get(ctx.chat.id.toString());
        const text = ctx.message ? (ctx.message.text || ctx.message.caption) : (ctx.editedMessage ? (ctx.editedMessage.text || ctx.editedMessage.caption) : null);
        if (text && ctx.from && (!groupInfo || groupInfo.adminList.find(user => user.id === ctx.from.id) == null)) { // There must be text and user not being an admin
            const netResult = await checkText(text, ctx);
            if (netResult === Actions.KICK || netResult === Actions.DELETE) {
                ctx.deleteMessage();
                if (netResult === Actions.DELETE) {
                    ctx.reply(`⚠ ${makeUserLink(ctx.from)} watch your language or you'll be banned`, { parse_mode: 'Markdown' });
                }
            }
            if (netResult === Actions.KICK) {
                ctx.kickChatMember(ctx.from.id);
            }
        }
    }
}

async function checkText(text: string, ctx: Telegraf.Context) {
    // const netResult = await python.ex`json.dumps(sonar.ping(text=${text}))`;
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    const netResult = await (await fetch(MainService.conf.serverUrl + 'model/predict', { method: 'POST', headers: headers, body: JSON.stringify({ text: [text] }) })).json();
    if (MainService.conf.debugMode) {
        ctx.reply(JSON.stringify(netResult, null, 2));
    }

    const prediction = netResult.results[0].predictions;
    if (prediction.toxic >= MainService.conf.toxicKickConfidence
        || prediction.severe_toxic >= MainService.conf.severeToxicKickConfidence
        || prediction.obscene >= MainService.conf.obsceneKickConfidence
        || prediction.threat >= MainService.conf.threatKickConfidence
        || prediction.insult >= MainService.conf.insultKickConfidence
        || prediction.identity_hate >= MainService.conf.hateKickConfidence) {
        console.log(new Date().toISOString() + ' kick');

        if (MainService.conf.logId) {
            ctx.telegram.sendMessage(MainService.conf.logId,
                `❌ User ${makeUserLink(ctx.from)} has been kicked.\nMessage: ${text}|\nDetected values:\n=====\n\`${JSON.stringify(prediction, null, 2)}\``,
                { parse_mode: 'Markdown' });
        }
        return Actions.KICK;
    }
    if (prediction.toxic >= MainService.conf.toxicDeleteConfidence
        || prediction.severe_toxic >= MainService.conf.severeToxicDeleteConfidence
        || prediction.obscene >= MainService.conf.obsceneDeleteConfidence
        || prediction.threat >= MainService.conf.threatDeleteConfidence
        || prediction.insult >= MainService.conf.insultDeleteConfidence
        || prediction.identity_hate >= MainService.conf.hateDeleteConfidence) {
        console.log(new Date().toISOString() + ' kick');

        if (MainService.conf.logId) {
            ctx.telegram.sendMessage(MainService.conf.logId,
                `⚠ User ${makeUserLink(ctx.from)} has been warned.\nMessage: ${text}\nDetected values:\n=====\n\`${JSON.stringify(prediction, null, 2)}\``,
                { parse_mode: 'Markdown' });
        }
        return Actions.DELETE;
    }
    return Actions.NOTHING;
}

function makeUserLink(usr: User) {
    return `[${usr.first_name}](tg://user?id=${usr.id})`
}

main().then(() => { });