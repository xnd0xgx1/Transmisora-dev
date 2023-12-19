import * as express from 'express';
import LogRepository from '../../repositories/LogRepository';

class BaseService<S> {

    public readonly repository;
    public readonly router = express.Router();
    public readonly logRepository = new LogRepository();

    constructor(repository: S) {
        this.repository = repository;
    }

    create = async (data: any) => {
        return await await this.repository.create(data);
    }

    getAll = async () => {
        return await this.repository.getAll();
    }

    getById = async (id: string) => {
        return await this.repository.getById(id);
    }

    update = async (data: any) => {
        const objDb = await this.repository.update(data);
        return objDb
    }

    delete = async (id: any) => {
        await this.repository.delete(id);
    }
}

export default BaseService;
