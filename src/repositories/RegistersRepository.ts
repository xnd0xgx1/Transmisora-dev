

import { BaseRepository } from './base/BaseRepository';
import Registers from '../models/Registers';

class RegistersRepository extends BaseRepository<typeof Registers> {
    /**
     * Get by account_id and status.
     * 
     * @param account_id 
     * @param status 
     * @returns 
     */
    getByAccountIdAndStatus(account_id: string, status: string): Promise<typeof Registers> {
    return this.collection.findOne({ account_id: account_id, status: status });
    }

    /**
     * Update entire register object.
     * @param register
     * @returns
     */
    updateRegister(register: any): Promise<typeof Registers> {
        let objectDb = this.collection.findOne({ account_id: register.account_id, status: "created" });
        if (objectDb !== undefined) {
            Object.assign(objectDb, register);
            return objectDb.save();
        }
        else
            return register;
    }


}

export default RegistersRepository;
