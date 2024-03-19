

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
    async getByAccountIdAndStatus(account_id: string, status: string): Promise<typeof Registers> {
    return await this.collection.findOne({ account_id: account_id, status: status });
    }

     /**
     * Update entire register object.
     * 
     * @param register
     * @returns
     */
    async updateRegister(register: any): Promise<typeof Registers> {
        let objectDb = await this.collection.findOne({ account_id: register.account_id, status: "created" });
        if (objectDb !== undefined) {
            Object.assign(objectDb, register);
            return objectDb.save();
        }
        else
            return register;
    }

    /**
     * Get last register by account_id.
     * 
     * @param account_id 
     * @returns 
     */
    async getLastRegisterByAccountId(account_id: string): Promise<typeof Registers> {
        return await this.collection.findOne({ account_id: account_id }).sort({ createdAt: -1 });
    }

    // create a method that receives the account_id and a field named test and updates the register with the account_id adding the test field to it
    async updateStatusByAccountId(account_id: string, data: any): Promise<any> {
        console.log('Updating register:', account_id, data);
        let objectDb = await this.collection.findOne({ account_id: account_id }).sort({ createdAt: -1 });
        console.log('objectDb:', objectDb);
        if (objectDb !== null) {
            // Añadir o actualizar campos en el documento
            Object.keys(data).forEach(key => {
                objectDb.set(`extras.${key}`, data[key]);
            });
            await objectDb.save(); // Intenta guardar los cambios en la base de datos
            console.log('Updated register:', objectDb);
            return objectDb;
        } else {
            // Manejo del caso en que el documento no se encuentra
            throw new Error('Document not found');
        }
    }
    
    
    


}

export default RegistersRepository;
