/* eslint-disable camelcase */

const readlineSync = require ('readline-sync');
const telegramClient = require ('./init-telegram-client.js');
const {loginData, save, saveAsJson, read} = require ('./core.js');

let sendMessageId = 11;

const createSendMessageId = () => {

    sendMessageId = (sendMessageId + 1) % 1000000007;
    return sendMessageId;
};

const readLine = (prompt) => {
    
    console.log (prompt);
    return readlineSync.question ();
};

const processLogin = async () => {

    try {
        
        console.log ('Logging in...');
        //await telegramClient.storage.clear ();
        const phone = loginData.phone;
        const {phone_code_hash} = await telegramClient ('auth.sendCode', {
            phone_number: phone,
            current_number: true,
            api_id: loginData.app.api_id,
            api_hash: loginData.app.api_hash,
        });

        const code = readLine ('Telegram code:');
        
        const res = await telegramClient ('auth.signIn', {
            phone_number: phone,
            phone_code_hash,
            phone_code: code
        });

        //await telegramClient.storage.save ();

        const {user} = res;

        const {
            first_name = '',
            username = ''
        } = user;
        
        console.log (['signIn', first_name, username, user.phone]);
        return first_name;

    } catch (error) {

        console.error (error);
    }
};
  
const getChats = async () => {
    
    const dialogs = await telegramClient ('messages.getDialogs', {

        limit: 1000,
    });
    
    const {chats, users} = dialogs;

    users.forEach (user => {

        user.display = () => {
          
            let res = '';
            res += user.first_name;

            if (user.last_name !== undefined) {

                res += ' ' + user.last_name;
            }
            
            if (user.username !== undefined) {

                res += ' @' + user.username;
            }

            return res;
        };
    });

    chats.forEach (chat => {

        chat.display = () => {
          
            let res = '';
            res += chat.title;
            
            if (chat.username !== undefined) {

                res += ' @' + chat.username;
            }

            return res;
        };
    });

    return [...users, ...chats];
};

const getAndSaveChatsData = async () => {

    const chats = await getChats ();

    const chatsData = chats.map (chat => {

        const result = {
        
            display: chat.display (),
            id: chat.id,
            type: chat._,
        };

        if (chat.access_hash !== undefined) {

            result.access_hash = chat.access_hash;
        }

        return result;
    });

    saveAsJson ('chats.json', chatsData);
    save ('chats.txt', chatsData.reduce ((acc, val) =>
        acc + val.type + ' ' + val.display + ' | id: ' +
        val.id + '\r\n', 'Chats:\r\n'));

    return chatsData;
};

class InputPeer {

    constructor (target) {

        switch (target._ || target.type) {

            case 'user':
                this ['_'] = 'inputPeerUser';
                this.user_id = target.id;
                this.access_hash = target.access_hash;
                break;
            case 'channel':
                this ['_'] = 'inputPeerChannel';
                this.channel_id = target.id;
                this.access_hash = target.access_hash;
                break;
            case 'chat':
                this ['_'] = 'inputPeerChat';
                this.chat_id = target.id;
                break;
        
            default:
                throw new Error (`Unknown target type: '${target._}'`);
        }
    }
}


const sendMessage = (target, message) =>
    telegramClient ('messages.sendMessage', {
        peer: new InputPeer (target),
        random_id: createSendMessageId (),
        message,
    });

const login = async () => {

    if (read (telegramClient.storage.file).substr (0, 2) !== '{}') {

        console.log ('Already logged in Telegram as ' + loginData.phone);
    } else {

        console.log ('Not logged in');
        await processLogin ();
    }
};

const chatHistory = async (chat) => {
    
    const max = 400;
    const limit = 100;
    let offset = 0;
    let full = [];
    let messages = [];
    
    do {

        const history = await telegramClient ('messages.getHistory', {
            peer: new InputPeer (chat),
            max_id: offset,
            offset: -full.length,
            limit
        });
        messages = history.messages;
        full = full.concat (messages);
        messages.length > 0 && (offset = messages[0].id);
    } while (messages.length === limit && full.length < max);
    
    return full;
};

const forwardMessages = async (from, to, messages) =>
    telegramClient ('messages.forwardMessages', {
        from_peer: new InputPeer (from),
        to_peer: new InputPeer (to),
        random_id: messages.map (() => createSendMessageId ()),
        id: messages.map (m => m.id),
    });

const deleteMessagesFromChannel = async (from, messages) =>
    telegramClient ('channels.deleteMessages', {
        channel: new InputPeer (from),
        id: messages.map (m => m.id),
    });

module.exports = {

    login,
    getChats,
    sendMessage,
    forwardMessages,
    getAndSaveChatsData,
    chatHistory,
    deleteMessagesFromChannel,
};

if (require.main === module) {

    (async () => {

        await login ();
        const chats = await getChats ();

        console.log (chats);
    }) ();
}
