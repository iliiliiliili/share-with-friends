
const {chatHistory, getChats, forwardMessages,
    deleteMessagesFromChannel, login,
    sendMessage} = require ('./telegram-client.js');
const {commands, workChatName, delays} = require ('./settings.json');
const {delay, readAsJson, splitString} = require ('./core.js');
const manage = require ('./manage.js');

const maxMessageSize = 4000;

let chats;
let workChat;
let responseMessage = '';

const groups = readAsJson ('groups.json');

if (groups === undefined) {

    throw new Error ('Groups are not set. Use node manage.js to set up groups');
}

let responseCode = null;

for (const code in commands) {

    if (commands [code] === 'response') {

        responseCode = code;
    }
}

console.log ({responseCode, commands});

if (responseCode === null) {

    throw new Error ('\'responce\' keyword is not set');
}

const updateChats = async () => chats = await getChats ();
const findGroup = (alias) =>
    groups.find (group => group.aliases.includes (alias));

const response = async (text) => {

    const messages = splitString (responseCode + ' \n' + text, maxMessageSize);

    console.log ({messages});

    for (const message of messages) {

        await sendMessage (workChat, message);
        await delay (delays.sendMessage);
    }
};

const forwardToGroup = async (groupName, messages) => {

    const group = findGroup (groupName);

    if (group === undefined) {

        await response (`No group '${groupName}'`);
        return;
    }

    if (messages.length === 0) {

        await response ('No messages');
        return;
    }

    for (const member of group.members) {

        await forwardMessages (workChat, member, messages);
        console.log ('Forwared to ', member);
        await delay (delays.forwardMessages);
    }

    console.log (`Forwarded to '${groupName}'`);
};

const sendToGroup = async (groupName, messages) => {

    const group = findGroup (groupName);

    if (group === undefined) {

        await response (`No group '${groupName}'`);
        return;
    }

    if (messages.length === 0) {

        await response ('No messages');
        return;
    }

    for (const member of group.members) {

        for (const message of messages) {

            const isForward = message.fwd_from !==  undefined;

            if (isForward) {
            
                await forwardMessages (workChat, member, [message]);
            } else {

                console.log (await sendMessage (member, message.message));
            }

            console.log ((isForward ? 'Forwarded' : 'Sent') + ' to ', member);
            await delay (delays.sendMessages);
        }
    }

    console.log (`Forwarded to '${groupName}'`);
};

const clearMessages = (messages) =>
    deleteMessagesFromChannel (workChat, messages);

const main = async () => {

    await login ();
    await updateChats ();
    await manage.init ((...args) => {
        
        responseMessage += args
            .map (obj => obj + '')
            .reduce ((acc, val) => acc + val) + '\n';
    }, false);

    workChat = chats.find (chat => chat._ === 'channel' &&
        chat.title === workChatName);

    console.log ({workChat});

    while (true) {

        const history = (await chatHistory (workChat))
            .filter (message => message._ === 'message');

        const isCommandMessage = (message) => {

            const words = message.message.split (' ');

            return message.fwd_from ===  undefined &&
                commands [words [0]] !== undefined;
        };

        const commandMessages = history.filter (isCommandMessage);
        const messagesToSend = history.filter (message =>
            !isCommandMessage (message))
            .reverse ();

        if (commandMessages.length > 0) {

            const targetCommandMessage = commandMessages [0].message;
            const words = targetCommandMessage.split (' ');
            const command = words [0];

            switch (commands [command]) {

                case 'forward':
                    await forwardToGroup (words [1], messagesToSend);
                    await clearMessages (history);
                    break;
                case 'send':
                    await sendToGroup (words [1], messagesToSend);
                    await clearMessages (history);
                    break;
                    
                case 'manage':

                    responseMessage = '';
                    await (manage.process (words.slice (1)));
                    await response (responseMessage);
                    await clearMessages ([commandMessages [0]]);
                    break;
                case 'response':
                    break;
                default:

                    if (commands [command] === undefined) {

                        console.log ('Unknown command: ', command);
                    } else {
                    
                        console.log ('Not implemented command: ',
                            commands [command]);
                    }
                    break;
            }
        }
        
        await delay (delays.checkMessages);
    }
};

main ();
