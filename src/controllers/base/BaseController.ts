import * as express from 'express';
import HttpException from "../../exceptions/HttpException";
import LogService from '../../repositories/LogRepository';

class BaseController<S> {

    public readonly service;
    public readonly router = express.Router();
    public readonly logService = new LogService();

    constructor(service: S) {
        this.service = service;
    }

    create = async (request: express.Request, response: express.Response, next: express.NextFunction) => {
        try {
            const objDb = await this.service.create(request.body);
            response.send(objDb);
        } catch (e) {
            await this.logService.create(e);
            next(new HttpException(400, e.message));
        }
    }

    getAll = async (request: any, response: express.Response, next: express.NextFunction, relations: string[] = null) => {
        try {
            const objs = await this.service.getAll(relations);
            if (objs) {
                response.send(objs);
            } else {
                next(new HttpException(404, 'No se encontraron registros'));
            }
        } catch (e) {
            await this.logService.create(e);
            next(new HttpException(400, e.message));
        }
    }

    getById = async (request: any, response: express.Response, next: express.NextFunction) => {
        try {

            const obj = await this.service.getById(request.params.id);
            if (obj) {
                response.send(obj);
            } else {
                next(new HttpException(404, 'Registro no encontrado'));
            }
        } catch (e) {
            await this.logService.create(e);
            next(new HttpException(400, e.message));
        }
    }

    update = async (request: express.Request, response: express.Response, next: express.NextFunction) => {
        try {
            const objDb = await this.service.update(request.body);
            response.send(objDb);
        } catch (e) {
            await this.logService.create(e);
            next(new HttpException(400, e.message));
        }
    }

    delete = async (request: express.Request, response: express.Response, next: express.NextFunction) => {
        try {
            const objDb = await this.service.delete(request.params.id);
            response.send(objDb);
        } catch (e) {
            await this.logService.create(e);
            next(new HttpException(400, e.message));
        }
    }
}

export default BaseController;


