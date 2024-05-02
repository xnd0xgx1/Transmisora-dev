import BaseService from "./base/BaseService";
import { Preregisters } from "../models/Registers";
import PreregistersRepository from "../repositories/PreregistersRepository";
import RecoverPasswordDto from "../dto/RecoverPasswordDto";

class PreregistersService extends BaseService<PreregistersRepository> {
    constructor() {
        super(new PreregistersRepository(Preregisters));
    }

    // async getByProcessId(process_id: string) {
    //     return await this.repository.getByProcessId(process_id);
    // }

    // //check if a register with the same phone number already exists and its status is created
    // async checkIfRegisterExists(phone: string) {
    //     return await this.repository.checkIfRegisterExists(phone);
    // }

    async getByAccountIdAndStatus(account_id: string, status: string) {
        return await this.repository.getByAccountIdAndStatus(account_id, status);
    }


    async getByPhoneAndEmail(userdata:RecoverPasswordDto) {
        return await this.repository.getByEmailAndPhone(userdata);
    }

    async updateRegister(register: any) {
        return await this.repository.updateRegister(register);
    }

    async getStatusByAccountId(account_id: string) {
        return await this.repository.getLastRegisterByAccountId(account_id);
    }

    async updateStatusByAccountId(account_id: string, data: any,status:any) {
        return await this.repository.updateStatusByAccountId(account_id, data,status);
    }
}

export default PreregistersService;
