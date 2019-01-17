/* eslint-disable camelcase */

const mtproto = require ('telegram-mtproto').MTProto;
const {Storage} = require ('mtproto-storage-fs');
const loginData = require ('./login-data.json');

const sessions = {};

const api = {
    invokeWithLayer: 0xda9b0d0d,
    layer: 57,
    initConnection: 0x69796de9,
    api_id: loginData.app.api_id,
    app_version: '1.0.1',
    lang_code: 'en',
};

const server = {
    webogram: true,
    dev: false,
};

function init (fileName) {

    if (sessions && sessions[fileName]) {

        return sessions[fileName];
    }

    const app = {
        storage: new Storage ('./sessions/' + fileName + '.json')
    };

    sessions[fileName] = mtproto ({
        api,
        server,
        app
    });

    return sessions[fileName];
}

const result = init (loginData.phone);

module.exports = result;
