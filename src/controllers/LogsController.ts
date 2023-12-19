import * as express from 'express';
import HttpException from "../exceptions/HttpException";
import authMiddleware from '../middleware/auth.middleware';
import Role from '../enums/Role';
import LogsRepository from '../repositories/LogRepository';
import NotAuthorizedException from '../exceptions/NotAuthorizedException';

export default class LogsController {

    private LogsRepository: LogsRepository;

    public path = '/logs';
    public router = express.Router();

    constructor() {
        this.LogsRepository = new LogsRepository();
        this.intializeRoutes();
    }

    private async intializeRoutes() {
        this.router.get(this.path, await authMiddleware(['ADMIN']), this.getAll);
    }

    getAll = async (request: any, response: express.Response, next: express.NextFunction) => {

        if (request.user.role !== Role.ADMIN) {
            next(new NotAuthorizedException());
            return;
        }

        this.LogsRepository.getAll()
            .then((logs) => {
                if (logs) {
                    response.send(logs);
                } else {
                    next(new HttpException(404, 'Logs not found'));
                }
            });
    }
}
