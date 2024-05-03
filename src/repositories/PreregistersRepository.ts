

import { BaseRepository } from './base/BaseRepository';
import { Preregisters } from '../models/Registers';
import { AnyArray, Schema, model } from 'mongoose';
import RecoverPasswordDto from '../dto/RecoverPasswordDto';

class PreregistersRepository extends BaseRepository<typeof Preregisters> {
    /**
     * Get by account_id and status.
     * 
     * @param account_id 
     * @param status 
     * @returns 
     */
    async getByAccountIdAndStatus(account_id: string, status: string): Promise<typeof Preregisters> {
    return await this.collection.findOne({ account_id: account_id});
    }

    /**
     * Get by email and phone.
     * 
     * @param account_id 
     * @param status 
     * @returns 
     */
    async getByEmailAndPhone(userdata: RecoverPasswordDto): Promise<typeof Preregisters> {
        return await this.collection.findOne({ phoneCode: userdata.phoneCode,phone:userdata.phone,email:userdata.email});
        }

     /**
     * Update entire register object.
     * 
     * @param register
     * @returns
     */
    async updateRegister(register: any): Promise<any> {
        let objectDb = await this.collection.findOne({ account_id: register.account_id});
        if (objectDb !== undefined) {
            Object.assign(objectDb, {Truora:register,status: `Truora ${register.status}`});
            return objectDb.save();
        }
        else{
            return register;
        }
    }

    /**
     * Get last register by account_id.
     * 
     * @param account_id 
     * @returns 
     */
    async getLastRegisterByAccountId(account_id: string): Promise<typeof Preregisters> {
        return await this.collection.findOne({ account_id: account_id }).sort({ createdAt: -1 });
    }

    // create a method that receives the account_id and a field named test and updates the register with the account_id adding the test field to it
    async updateStatusByAccountId(account_id: string, data: any,status:any): Promise<any> {
        console.log('Updating register:', account_id, data);
        let objectDb = await this.collection.findOne({ account_id: account_id }).sort({ createdAt: -1 });
        console.log('objectDb:', objectDb);
        if (objectDb !== null) {
            // Añadir o actualizar campos en el documento
            Object.keys(data).forEach(key => {
                objectDb.set(`data_obtenida.${key}`, data[key]);
            });
            objectDb.status = status;
            await objectDb.save(); // Intenta guardar los cambios en la base de datos
            console.log('Updated register:', objectDb);
            return objectDb;
        } else {
            // Manejo del caso en que el documento no se encuentra
            throw new Error('Document not found');
        }
    }
    
    
    


}

export default PreregistersRepository;
