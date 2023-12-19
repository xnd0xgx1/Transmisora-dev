import fetch, { Headers } from "node-fetch";
import BaseService from "./base/BaseService";
import ExchangeRateRepository from "../repositories/ExchangeRateRepository";
import ExchangeRate from "../models/ExchangeRate";

class ExchangeRateService extends BaseService<ExchangeRateRepository> {

    constructor() {
        super(new ExchangeRateRepository(ExchangeRate));
    }

    get = async () => {
        try {
            const url = `https://api.apilayer.com/exchangerates_data/latest?symbols=MXN&base=USD`;

            let headers = new Headers({
                'apikey': process.env.API_LAYER_KEY
            });

            let response = await fetch(url, {
                method: 'GET',
                headers: headers
            });

            if (response.status === 401) {
                await response.json();
            } else if (response.status === 403) {
                return await response.json();
            } else if (response.status !== 200) {
                await response.json();
            }
            else {
                return await response.json();
            }
        }
        catch (e) {
            console.log(e);
            throw (e);
        }
    }

    activate = async (id: string) => {
        let rate = await this.repository.getById(id);
        rate.status = 'ACTIVE';
        return await this.repository.update(rate);
    }

    deactivate = async (id: string) => {
        let rate = await this.repository.getById(id);
        rate.status = 'DISABLED';
        return await this.repository.update(rate);
    }

    delete = async (id: string) => {
        await this.repository.delete(id);
    }
}

export default ExchangeRateService;
