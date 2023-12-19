import * as express from 'express';
import BaseController from './base/BaseController';
import authMiddleware from '../middleware/auth.middleware';
import Role from '../enums/Role';
import Config from '../common/Config';
import FileService from '../services/FileService';
import { v4 as uuidv4 } from 'uuid';
import HttpException from '../exceptions/HttpException';
import UserService from '../services/UserService';
import UserStatus from '../enums/UserStatus';

const path = require('path');
const { S3Client } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');

let s3 = new S3Client({
    region: Config.AWS_REGION,
    credentials: {
        accessKeyId: Config.AWS_ACCESS_KEY_ID,
        secretAccessKey: Config.AWS_ACCESS_KEY,
    },
    sslEnabled: false,
    s3ForcePathStyle: true,
    signatureVersion: 'v4',
});

let fileName = '';

const upload = multer({
    fileFilter: (req, file, callback) => {

        const acceptableExtensions = ['.png', '.jpg', '.jpeg', '.pdf', '.heic'];
        if (!(acceptableExtensions.includes(path.extname(file.originalname.toLowerCase())))) {
            return callback(new Error('Formato de archivo no permitido.'));
        }

        const fileSize = parseInt(req.headers['content-length']);
        if (fileSize > (30 * 1024 * 1024)) {
            return callback(new Error('El tamaño del archivo excede el permitido.'));
        }

        callback(null, true);
    },
    storage: multerS3({
        s3: s3,
        bucket: Config.AWS_BUCKET,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: function (req, file, cb) {
            // if (fileName === '')
            fileName = uuidv4();
            cb(null, fileName);
        }
    })
});

class UploadController extends BaseController<FileService> {

    public path = '/uploads';
    public router = express.Router();

    private userService = new UserService();

    constructor() {
        super(new FileService());
        this.intializeRoutes();
    }

    private async intializeRoutes() {
        this.router.post(this.path, await authMiddleware([Role.PERSONA_FISICA, Role.PERSONA_MORAL, Role.ADMIN], false), upload.single('file'), this.create);
        this.router.put(`${this.path}/:id/approve`, await authMiddleware([Role.ADMIN], false), this.approve);
        this.router.put(`${this.path}/:id/decline`, await authMiddleware([Role.ADMIN], false), this.decline);
        this.router.put(`${this.path}/:id/comments`, await authMiddleware([Role.ADMIN], false), this.comments);
    }

    create = async (req: any, response: express.Response, next: express.NextFunction) => {
        try {
            if (!req.file)
                throw new Error("El archivo es requerido");

            const { type } = req.body;

            let file = undefined;
            if (fileName !== '')
                file = await this.service.createFile(fileName, type);

            response.send(file);

        } catch (e) {
            next(new HttpException(500, e.message));
        }
    }

    approve = async (req: any, response: express.Response, next: express.NextFunction) => {
        try {
            const fileId = req.params.id;
            const { userId } = req.body;
            const status = await this.service.approve(fileId);

            // Verifica si todos los documentos han sido verificados.
            let user = await this.userService.getById(userId);
            const filesApproved = user.files.filter((x: any) => x.status === 'APPROVED');
            if (filesApproved.length === 5) {
                user.status = UserStatus.APPROVED;
                await this.userService.update(user);
            }
            response.send(status);
        } catch (e) {
            next(new HttpException(500, e.message));
        }
    }

    decline = async (req: any, response: express.Response, next: express.NextFunction) => {
        try {
            const userId = req.params.id;
            const status = await this.service.decline(userId);
            response.send(status);
        } catch (e) {
            next(new HttpException(500, e.message));
        }
    }

    comments = async (req: any, response: express.Response, next: express.NextFunction) => {
        try {
            const userId = req.params.id;
            const { comments } = req.body;
            const status = await this.service.comments(userId, comments);
            response.send(status);
        } catch (e) {
            next(new HttpException(500, e.message));
        }
    }
}

export default UploadController;
