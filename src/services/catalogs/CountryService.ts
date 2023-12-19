import Country from "../../models/catalogs/Country";
import CountryRepository from "../../repositories/catalogs/CountryRepository";
import BaseService from "../base/BaseService";

class CountryService extends BaseService<CountryRepository> {

    constructor() {
        super(new CountryRepository(Country));
    }
}

export default CountryService;
