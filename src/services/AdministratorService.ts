import BaseService from "./base/BaseService";
import AdministratorRepository from "../repositories/AdministratorRepository";
import Administrator from "../models/Administrator";

class AdministratorService extends BaseService<AdministratorRepository> {

    constructor() {
        super(new AdministratorRepository(Administrator));
    }
}

export default AdministratorService;
