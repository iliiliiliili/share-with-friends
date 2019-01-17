
const {chatHistory, getChats, forwardMessages,
    deleteMessagesFromChannel, login} = require ('./telegram-client.js');
const {commands, workChatName, delays} = require ('./settings.json');
const {delay, readAsJson} = require ('./core.js');
 
let chats;
let workChat;
const groups = readAsJson ('groups.json');

if (groups === undefined) {

    throw new Error ('Groups are not set. Use node manage.js to set up groups');
}

const updateChats = async () => chats = await getChats ();
const findGroup = (alias) =>
    groups.find (group => group.aliases.includes (alias));

const forwardToGroup = async (groupName, messages) => {

    const group = findGroup (groupName);

    if (group === undefined) {

        console.log (`No group '${groupName}'`);
        return;
    }

    if (messages.length === 0) {

        console.log ('No messages');
        return;
    }

    for (const member of group.members) {

        await forwardMessages (workChat, member, messages);
        console.log ('Forwared to ', member);
        await delay (delays.forwardMessages);
    }

    console.log (`Forwarded to '${groupName}'`);
};

const clearMessages = (messages) =>
    deleteMessagesFromChannel (workChat, messages);

const main = async () => {

    await login ();
    await updateChats ();

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
