
const telegramClient = require ('./telegram-client.js');
const {readLine, isNumber, readAsJson, saveAsJson, read} =
    require  ('./core.js');
const {inspect} = require ('util');

let groups;
let chats;

const loadGroups = () => groups = readAsJson ('groups.json') || [];
const saveGroups = () => saveAsJson ('groups.json', groups);
const printGroups = () => console.log (inspect (groups, false, null, true));


const isUniqueAliases = (aliases) => {

    for (const alias of aliases) {

        for (const group of groups) {

            if (group.aliases.includes (alias)) {

                return {alias, group};
            }
        }
    }

    return true;
};

const createGroup = (aliases) => {

    if (aliases.length === 0) {

        console.log ('Aliases expected');
        return;
    }

    const uniqueRes = isUniqueAliases (aliases);
    if (uniqueRes === true) {

        groups.push ({
        
            aliases,
            members: []
        });

        saveGroups ();
        console.log ('Created group with aliases: ', aliases);
    } else {

        console.log (`Error: alias '${uniqueRes.alias}' ` +
            `is in group: '${uniqueRes.group.aliases}'`);
    }
};

const addAliases = (targetGroupAlias, aliases) => {

    if (targetGroupAlias === undefined) {

        console.log ('Target group alias expected');
        return;
    }

    if (aliases.length === 0) {

        console.log ('Aliases expected');
        return;
    }

    const targetGroup = groups.find (group =>
        group.aliases.includes (targetGroupAlias));

    if (targetGroup === undefined) {

        console.log (`No group with alias: ${targetGroupAlias}`);
        return;
    }

    const uniqueRes = isUniqueAliases (aliases);
    if (uniqueRes === true) {

        targetGroup.aliases.push (...aliases);

        saveGroups ();
        console.log ('Added aliases to group: ', targetGroup.aliases);
    } else {

        console.log (`Error: alias '${uniqueRes.alias}' ` +
            `is in group: '${uniqueRes.group.aliases}'`);
    }
};

const addMembers = (targetGroupAlias, members) => {

    if (targetGroupAlias === undefined) {

        console.log ('Target group alias expected');
        return;
    }

    if (members.length === 0) {

        console.log ('Members expected (name, username, id)');
        return;
    }

    const targetGroup = groups.find (group =>
        group.aliases.includes (targetGroupAlias));

    if (targetGroup === undefined) {

        console.log (`No group with alias: ${targetGroupAlias}`);
        return;
    }
    
    let added = 0;

    for (const member of members) {

        const variants = chats.filter (chat => (
            isNumber (member) ? chat.id === parseInt (member) :
                chat.display.includes (member)
        ));

        if (variants.length === 0) {

            console.log ('\x1b[31m', `No chat '${member}'`);
        } else if (variants.length === 1) {

            if (targetGroup.members.find (member =>
                member.id === variants [0].id)) {

                console.log ('\x1b[31m', `'${member}' is already in a group`);
            } else {

                added ++;
                targetGroup.members.push (variants [0]);
                console.log ('\x1b[32m', `Added ${member}: `, variants [0]);
            }
        } else {

            console.log ('\x1b[31m', `Too much variants for '${member}': `,
                variants);
        }

    }

    if (added > 0) {
    
        saveGroups ();
    }

    console.log ('\x1b[0m', `Added ${added} members to group: `, targetGroup);
};

const removeMembers = (targetGroupAlias, members) => {

    if (targetGroupAlias === undefined) {

        console.log ('Target group alias expected');
        return;
    }

    if (members.length === 0) {

        console.log ('Members expected (name, username, id)');
        return;
    }

    const targetGroup = groups.find (group =>
        group.aliases.includes (targetGroupAlias));

    if (targetGroup === undefined) {

        console.log (`No group with alias: ${targetGroupAlias}`);
        return;
    }
    
    let removed = 0;

    for (const member of members) {

        const variants = chats.filter (chat => (
            isNumber (member) ? chat.id === parseInt (member) :
                chat.display.includes (member)
        ));

        if (variants.length === 0) {

            console.log ('\x1b[31m', `No chat '${member}'`);
        } else if (variants.length === 1) {


            const toRemove = targetGroup.members.find (member =>
                member.id === variants [0].id);

            if (toRemove === undefined) {

                console.log ('\x1b[31m', `Group has no '${member}'`);
            } else {

                removed ++;
                
                const index = targetGroup.members.indexOf (toRemove);
                targetGroup.members.splice (index, 1);


                console.log ('\x1b[32m', `Removed ${member}: `, variants [0]);
            }
        } else {

            console.log ('\x1b[31m', `Too much variants for '${member}': `,
                variants);
        }

    }

    if (removed > 0) {
    
        saveGroups ();
    }

    console.log ('\x1b[0m', `Added ${removed} members to group: `, targetGroup);
};

const printHelp = () => console.log (read ('manage-help.txt'));

const main = async () => {

    console.log ('Loading...');
    chats = await telegramClient.getAndSaveChatsData ();

    loadGroups ();
    printGroups ();
    printHelp ();
    let command = readLine ('Command:');

    while (command !== 'q') {

        const words = command.split (' ');

        switch (words [0]) {

            case 'h':
            case 'help':
                printHelp ();
                break;
            case 'ls':
                printGroups ();
                break;
            case 'new':
            case 'n':
            case 'create':
                createGroup (words.slice (1));
                break;
            case 'aa':
            case 'add-aliases':
                addAliases (words [1], words.slice (2));
                break;
            case 'am':
            case 'add':
            case 'add-members':
                addMembers (words [1], words.slice (2));
                break;
            case 'rm':
            case 'remove':
            case 'remove-members':
                removeMembers (words [1], words.slice (2));
        }

        command = readLine ('Command:');
    }

};

main ();
