import BaseService from "./base/BaseService";
import RegistersRepository from "../repositories/RegistersRepository";
import Registers from "../models/Registers";


class RegistersService extends BaseService<RegistersRepository> {

    constructor() {
        super(new RegistersRepository(Registers));
    }
}

export default RegistersService;
