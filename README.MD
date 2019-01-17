# Share With Friends Telegram
- Runs telegram-client and allows you to share messages with groups of users|channels|chats 

### Run
``node main.js``

### Dependencies
- [telegram-mtproto](https://www.npmjs.com/package/telegram-mtproto/v/2.2.2)
- [readline-sync](https://www.npmjs.com/package/readline-sync)
- [mtproto-storage-fs](https://www.npmjs.com/package/mtproto-storage-fs)
    - If you have problems with installing packages to RasberryPi or another PC. You can install them somwhere else and just copy node_modules folder to target PC.  

### Configuration

1. Rename ``login-data-example.json`` for ``login-data.json`` and fill your data.
    - Obtain api keys from [telegram website](https://my.telegram.org/auth?to=apps)
2. Run ``node manage.js`` and create groups of users to send messages.
    - Execute help command to see available commands.
    - You can edit groups.json manually (i.e to add aliases using symbols that your console does not support).
3. Edit settings.js (or leave it as it is)
    - if first word of message matches command words – it will be executed.
    - workChatName is a display name of supergroup or channel you will use to broadcast messages. You need to create a channel or a group (and upgrade it to supergroup) and set it unique display name among your chats.
    - delays between message sending are nessesary to limit api calls per second.
    - checkMessages delay is how often bot will check your workChat for new messages.

### Usage

1. When bot is running, forward (or write) messages to your channel or supergroup.
2. Write a command. For example: ``$ test``
3. In standart settings.json ``$`` means ``forward``, so all messages (except commands) will be sent to all members of group that has an alias ``test``.