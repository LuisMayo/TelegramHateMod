import { User } from "telegraf/typings/telegram-types";

export interface GroupInfo {
    id: string;
    adminList: User[];
}