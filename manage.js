
const telegramClient = require ('./telegram-client.js');
const {readLine, isNumber, readAsJson, saveAsJson, read} =
    require  ('./core.js');
const {inspect} = require ('util');

let groups;
let chats;
let log;
let useColors = true;

const loadGroups = () => groups = readAsJson ('groups.json') || [];
const saveGroups = () => saveAsJson ('groups.json', groups);
const toStringFull = (obj) => inspect (obj, false, null, useColors);
const printFull = (obj) => log (toStringFull (obj));
const printGroups = () => printFull (groups);


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

        log ('Aliases expected');
        return;
    }

    const uniqueRes = isUniqueAliases (aliases);
    if (uniqueRes === true) {

        groups.push ({
        
            aliases,
            members: []
        });

        saveGroups ();
        log ('Created group with aliases: ', aliases);
    } else {

        log (`Error: alias '${uniqueRes.alias}' ` +
            `is in group: '${uniqueRes.group.aliases}'`);
    }
};

const addAliases = (targetGroupAlias, aliases) => {

    if (targetGroupAlias === undefined) {

        log ('Target group alias expected');
        return;
    }

    if (aliases.length === 0) {

        log ('Aliases expected');
        return;
    }

    const targetGroup = groups.find (group =>
        group.aliases.includes (targetGroupAlias));

    if (targetGroup === undefined) {

        log (`No group with alias: ${targetGroupAlias}`);
        return;
    }

    const uniqueRes = isUniqueAliases (aliases);
    if (uniqueRes === true) {

        targetGroup.aliases.push (...aliases);

        saveGroups ();
        log ('Added aliases to group: ', targetGroup.aliases);
    } else {

        log (`Error: alias '${uniqueRes.alias}' ` +
            `is in group: '${uniqueRes.group.aliases}'`);
    }
};

const addMembers = (targetGroupAlias, members) => {

    if (targetGroupAlias === undefined) {

        log ('Target group alias expected');
        return;
    }

    if (members.length === 0) {

        log ('Members expected (name, username, id)');
        return;
    }

    const targetGroup = groups.find (group =>
        group.aliases.includes (targetGroupAlias));

    if (targetGroup === undefined) {

        log (`No group with alias: ${targetGroupAlias}`);
        return;
    }
    
    let added = 0;

    for (const member of members) {

        const variants = chats.filter (chat => (
            isNumber (member) ? chat.id === parseInt (member) :
                chat.display.includes (member)
        ));

        if (variants.length === 0) {

            log (useColors ? '\x1b[31m' : '',
                `No chat '${toStringFull (member)}'`);
        } else if (variants.length === 1) {

            if (targetGroup.members.find (member =>
                member.id === variants [0].id)) {

                log (useColors ? '\x1b[31m' : '',
                    `'${toStringFull (member)}' is already in a group`);
            } else {

                added ++;
                targetGroup.members.push (variants [0]);
                log (useColors ? '\x1b[32m' : '',
                    `Added ${toStringFull (member)}: `, variants [0]);
            }
        } else {

            log (useColors ? '\x1b[31m' : '',
                `Too much variants for '${toStringFull (member)}': `,
                variants);
        }

    }

    if (added > 0) {
    
        saveGroups ();
    }

    log (useColors ? '\x1b[0m' : '',
        `Added ${added} members to group: `, printFull (targetGroup));
};

const removeMembers = (targetGroupAlias, members) => {

    if (targetGroupAlias === undefined) {

        log ('Target group alias expected');
        return;
    }

    if (members.length === 0) {

        log ('Members expected (name, username, id)');
        return;
    }

    const targetGroup = groups.find (group =>
        group.aliases.includes (targetGroupAlias));

    if (targetGroup === undefined) {

        log (`No group with alias: ${targetGroupAlias}`);
        return;
    }
    
    let removed = 0;

    for (const member of members) {

        const variants = chats.filter (chat => (
            isNumber (member) ? chat.id === parseInt (member) :
                chat.display.includes (member)
        ));

        if (variants.length === 0) {

            log (useColors ? '\x1b[31m' : '',
                `No chat '${toStringFull (member)}'`);
        } else if (variants.length === 1) {

            const toRemove = targetGroup.members.find (member =>
                member.id === variants [0].id);

            if (toRemove === undefined) {

                log (useColors ? '\x1b[31m' : '',
                    `Group has no '${toStringFull (member)}'`);
            } else {

                removed ++;
                
                const index = targetGroup.members.indexOf (toRemove);
                targetGroup.members.splice (index, 1);


                log (useColors ? '\x1b[32m' : '',
                    `Removed ${toStringFull (member)}: `, variants [0]);
            }
        } else {

            log (useColors ? '\x1b[31m' : '',
                `Too much variants for '${member}': `, variants);
        }

    }

    if (removed > 0) {
    
        saveGroups ();
    }

    log (useColors ? '\x1b[0m' : '',
        `Removed ${removed} members from group: `, printFull (targetGroup));
};

const printHelp = () => log (read ('manage-help.txt'));

const process = async (words) => {

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
};

const init = async (logger, colors) => {

    log = logger;
    chats = await telegramClient.getAndSaveChatsData ();
    useColors = colors;
    loadGroups ();
};

const main = async () => {

    console.log ('Loading...');

    await init (console.log, true);

    printGroups ();
    printHelp ();

    let command = readLine ('Command:');

    while (command !== 'q') {

        const words = command.split (' ');

        process (words);

        command = readLine ('Command:');
    }

};

module.exports = {

    init,
    process,
};

if (require.main === module) {

    main ();
}
