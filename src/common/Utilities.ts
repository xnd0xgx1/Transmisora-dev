import moment from "moment";
import FileService from "../services/FileService";
const i18n = require('../i18n.config');
const _importDynamic = new Function("modulePath", "return import(modulePath)");

async function fetch(...args) {
    const { default: fetch } = await _importDynamic("node-fetch");
    return fetch(...args);
}

export const getSlug = (str: string) => {
    str = str.replace(/^\s+|\s+$/g, ''); // trim
    str = str.toLowerCase();

    // remove accents, swap ñ for n, etc
    var from = "ãàáäâẽèéëêìíïîõòóöôùúüûñç·/_,:;";
    var to = "aaaaaeeeeeiiiiooooouuuunc------";
    for (var i = 0, l = from.length; i < l; i++) {
        str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
    }

    str = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
        .replace(/\s+/g, '-') // collapse whitespace and replace by -
        .replace(/-+/g, '-'); // collapse dashes

    return str;
};

export default function generarId(length: number) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() *
            charactersLength));
    }
    return result;
}

export const formatCurrency = (amount: number) => {
    var formatter = new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
    });
    return formatter.format(amount);
}

export const generateRandomUserName = () => {

    const first = [
        "bala",
        "perro",
        "gallo",
        "delfin",
        "rata",
    ];

    const second = [
        "blanco",
        "rojo",
        "rosa",
        "azul",
        "morado",
    ];

    const third = [
        "1",
        "2",
        "3",
        "4",
        "5",
    ];

    const one = first[Math.floor(Math.random() * first.length)];
    const two = second[Math.floor(Math.random() * second.length)];
    const three = third[Math.floor(Math.random() * third.length)];

    return `${one}${two}${three}`;
}

export const imageToBase64 = async (id: string) => {

    const fileService = new FileService();

    const img = await fileService.getById(id);
    const imageUrlData = await fetch(`https://uexchange-app-files.s3.us-east-2.amazonaws.com/${img.name}`);
    const buffer = await imageUrlData.arrayBuffer();
    const img64 = Buffer.from(buffer).toString('base64');
    return img64;
}

export const getText = (key: string) => {
    return i18n.__(key);
}

export const getMinutesPassed = (date: string) => {    
    const start = moment(date);
    const minutesPassed = moment().diff(start, 'minutes');
    return minutesPassed;
}