import {Message} from "../types/message";

export const getDateString = (message: Message): string => {
  return message.date.toISOString().substring(11, 19);
}
