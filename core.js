
const fs = require ('fs');
const readlineSync = require ('readline-sync');
const loginData = require ('./login-data.json');

const delay = (ms) => new Promise (res => setTimeout (res, ms));

const saveAsJson = (fileName, data) => {

    fs.writeFileSync (fileName, JSON.stringify (data));
};

const save = (...args) => fs.writeFileSync (...args);
const read = (fileName) => fs.readFileSync (fileName, 'utf8');

const readAsJson = (fileName) => {

    if (fs.existsSync (fileName)) {

        return JSON.parse (read (fileName));
    }

    return null;
};

const readLine = (prompt) => {
    
    if (prompt !== undefined) {
     
        console.log (prompt);
    }

    return readlineSync.question ();
};

const isNumber = (val) => !isNaN (val);

module.exports = {

    save,
    read,
    saveAsJson,
    readAsJson,
    loginData,
    readLine,
    isNumber,
    delay,
};
