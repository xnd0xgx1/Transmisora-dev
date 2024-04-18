import BaseService from "./base/BaseService";
import StatusDictionary from "../repositories/DictRepository";
import DictionaryStatus from "../models/DictionaryStatus";

class DictService extends BaseService<StatusDictionary> {
    constructor() {
        super(new StatusDictionary(DictionaryStatus));
    }

    // async getByProcessId(process_id: string) {
    //     return await this.repository.getByProcessId(process_id);
    // }

    // //check if a register with the same phone number already exists and its status is created
    // async checkIfRegisterExists(phone: string) {
    //     return await this.repository.checkIfRegisterExists(phone);
    // }

    
}

export default DictService;
