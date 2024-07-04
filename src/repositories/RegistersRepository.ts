

import { BaseRepository } from './base/BaseRepository';
import Registers from '../models/Registers';
import { AnyArray, Schema, model } from 'mongoose';

class RegistersRepository extends BaseRepository<typeof Registers> {
    /**
     * Get by account_id and status.
     * 
     * @param account_id 
     * @param status 
     * @returns 
     */
    async getByAccountIdAndStatus(account_id: string, status: string): Promise<typeof Registers> {
        return await this.collection.findOne({ account_id: account_id }).sort({ createdAt: -1 }).populate('files');
    }

     /**
     * Update entire register object.
     * 
     * @param register
     * @returns
     */
    async updateRegister(register: any): Promise<any> {
        let objectDb = await this.collection.findOne({ account_id: register.account_id}).sort({ createdAt: -1 }).populate('files');
        if (objectDb !== undefined) {
            Object.assign(objectDb, {Truora:register,status: `Truora ${register.status}`});
            return objectDb.save();
        }
        else{
            return register;
        }
    }
    async updateRegister2(register: any): Promise<any> {
        let objectDb = await this.collection.findOne({ account_id: register.account_id}).sort({ createdAt: -1 }).populate('files');
        if (objectDb !== undefined) {
            Object.assign(objectDb, {ZapSign:register,status: `PASO20 - ${register.status}`});
            return objectDb.save();
        }
        else{
            return register;
        }
    }

    async updateRegister2PM(register: any): Promise<any> {
        let objectDb = await this.collection.findOne({ account_id: register.account_id}).sort({ createdAt: -1 }).populate('files');
        if (objectDb !== undefined) {
            Object.assign(objectDb, {ZapSign:register,status: `FIRMA_DECLARACION - ${register.status}`});
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
    async getLastRegisterByAccountId(account_id: string): Promise<typeof Registers> {
        return await this.collection.findOne({ account_id: account_id }).sort({ createdAt: -1 }).populate('files');
    }

    // create a method that receives the account_id and a field named test and updates the register with the account_id adding the test field to it
    async updateStatusByAccountId(account_id: string, data: any,status:any): Promise<any> {
        console.log('Updating register:', account_id, data);
        let objectDb = await this.collection.findOne({ account_id: account_id }).sort({ createdAt: -1 }).populate('files');
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

    getUsersFilesForCMS = async () => {
        console.log("SEARCH");
        // return the users with status isDeleted = false, and populate with devices. sessionDate is obtained from the devices.
        // return await this.collection.find({ status: { $in: ["UPLOAD_FILES_STARTED", "UPLOAD_FILES_FAILED", "UPLOAD_FILES_APPROVED"] } }).sort({ createdAt: -1 }).populate('files');
        return await this.collection.aggregate([
            // Filtrar los documentos por los estados deseados
            { $match: { status: { $in: ["UPLOAD_FILES_STARTED", "UPLOAD_FILES_FAILED", "UPLOAD_FILES_APPROVED"] } } },
            
            // Ordenar los documentos por `account_id` y `createdAt` en orden descendente
            { $sort: { account_id: 1, createdAt: -1 } },
        
            // Agrupar por `account_id` y tomar el primer documento de cada grupo (el más reciente)
            { $group: {
                _id: "$account_id",
                mostRecentDocument: { $first: "$$ROOT" }
            } },
        
            // Reemplazar el documento agrupado con el documento más reciente
            { $replaceRoot: { newRoot: "$mostRecentDocument" } },
        
            // Poblar el campo `files`
            { $lookup: {
                from: "files", // Nombre de la colección que contiene los archivos
                localField: "files",
                foreignField: "_id",
                as: "files"
            } }
        ]).exec();
     }
    
    
    


}

export default RegistersRepository;
