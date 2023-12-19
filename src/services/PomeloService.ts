import { URLSearchParams } from "url";
import FetchMethods from "../enums/FetchMethods";
const _importDynamic = new Function("modulePath", "return import(modulePath)");
async function fetch(...args) {
    const { default: fetch } = await _importDynamic("node-fetch");
    return fetch(...args);
}

class PomeloService {

    private hostPomelo = 'https://api-sandbox.pomelo.la';

    constructor() {
    }

    createUser = async (data: any) => {
        const host = `${this.hostPomelo}/users/v1/`;
        const res = await this.fetchPomelo(host, data, FetchMethods.POST);
        return res;
    }

    createCard = async (data: any) => {

        // https://developers.pomelo.la/api-reference/cards/issuing/tarjetas#crear-tarjeta

        const host = `${this.hostPomelo}/cards/v1/`;
        const res = await this.fetchPomelo(host, data, FetchMethods.POST);
        return res;
    }

    testPomeloSearchCards = async (shipment_id: string) => {
        const host = `${this.hostPomelo}/cards/v1/?filter[shipment_id]=${shipment_id}`;
        const res = await this.fetchPomelo(host, null, FetchMethods.GET);
        return res;
    }

    activateCard = async (data: any) => {

        // https://developers.pomelo.la/api-reference/cards/issuing/tarjetas#activar-tarjeta

        const host = `${this.hostPomelo}/cards/v1/activation`;
        const res = await this.fetchPomelo(host, data, FetchMethods.POST);
        return res;
    }

    updateCard = async (id: string, data: any) => {
        const host = `${this.hostPomelo}/cards/v1/${id}`;
        const res = await this.fetchPomelo(host, data, FetchMethods.PATCH);
        return res;
    }

    private fetchPomelo = async (host: string, data: any, method: string) => {
        const resLogin = await this.loginPomelo();
        let options: any = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${resLogin.access_token}`
            }
        }
        if (method === FetchMethods.POST || method === FetchMethods.PATCH)
            options.body = JSON.stringify(data);
        const res = await fetch(host, options);
        return await res.text();
    }

    private loginPomelo = async () => {
        var urlencoded = new URLSearchParams();
        urlencoded.append("client_id", process.env.POMELO_CLIENT_ID);
        urlencoded.append("client_secret", process.env.POMELO_CLIENT_SECRET);
        urlencoded.append("audience", "https://auth-sandbox.pomelo.la");
        urlencoded.append("grant_type", "client_credentials");

        const requestOptions = {
            method: FetchMethods.POST,
            body: urlencoded,
            redirect: 'follow'
        };

        const host = `${this.hostPomelo}/oauth/token`;
        const res = await fetch(host, requestOptions);
        return await res.json();
    }
}

export default PomeloService;
