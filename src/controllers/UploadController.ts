import * as express from 'express';
import BaseController from './base/BaseController';
import authMiddleware from '../middleware/auth.middleware';
import authMiddlewareCMS from '../middleware/auth.middleware.cms';
import Role from '../enums/Role';
import Config from '../common/Config';
import FileService from '../services/FileService';
import { v4 as uuidv4 } from 'uuid';
import HttpException from '../exceptions/HttpException';
import UserService from '../services/UserService';
import UserStatus from '../enums/UserStatus';
import RegistersService from '../services/RegistersService';

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
    private registerService = new RegistersService();

    constructor() {
        super(new FileService());
        this.intializeRoutes();
    }

    private async intializeRoutes() {
        this.router.post(this.path, upload.single('file'), this.create);
        this.router.post(`/users/register/:id/upload`, upload.single('file'), this.create);
        this.router.post(`/users/:id/uploadfile`, await authMiddleware([Role.PERSONA_FISICA, Role.PERSONA_MORAL], false),upload.single('file'), this.createnewfile);
        this.router.put(`${this.path}/:id/approve`, await authMiddlewareCMS([Role.ADMIN]), this.approve);
        this.router.put(`${this.path}/:id/decline`, await authMiddlewareCMS([Role.ADMIN]), this.decline);
        this.router.put(`${this.path}/:id/comments`, await authMiddleware([Role.ADMIN], false), this.comments);
    }

    create = async (req: any, response: express.Response, next: express.NextFunction) => {
        try {
            if (!req.file)
                throw new Error("El archivo es requerido");

            const { type } = req.body;
            let file = undefined;
            const id = req.params.id;

            let register = undefined;
            if (fileName !== ''){
                let register_id = await this.registerService.getByAccountIdAndStatus(id,"");
                if(register_id){
                    file = await this.service.createFile(fileName, type,register_id._id);
                    register = await this.userService.AddFiletoRegister(register_id._id,file.id,type);
                }
            }

            if(register != undefined){
                response.send(register);
            }else{
                response.send(file);
            }

        } catch (e) {
            next(new HttpException(500, e.message));
        }
    }

    createnewfile = async (req: any, response: express.Response, next: express.NextFunction) => {
        try {
            if (!req.file)
                throw new Error("El archivo es requerido");

            const type= "INE_BENEFICIARIO";
            let file = undefined;
            const id = req.params.id;

            let register = undefined;
            if (fileName !== '')
                file = await this.service.createFile(fileName, type,id);
                register = file;
                // register = await this.userService.AddFiletoRegister(id,file.id,type);

            if(register != undefined){
                response.send(register);
            }else{
                response.send(file);
            }

        } catch (e) {
            next(new HttpException(500, e.message));
        }
    }

    approve = async (req: any, response: express.Response, next: express.NextFunction) => {
        try {
            const fileId = req.params.id;
            const status = await this.service.approve(fileId);

            // Verifica si todos los documentos han sido verificados.
            let user = await this.registerService.getStatusByAccountId(status.registerid);
            // let user = await this.userService.getById(status.registerid);
            const filesApproved = user.files.filter((x: any) => x.status === 'APPROVED');
            if (filesApproved.length === user.files.length) {
                const register = await this.registerService.updateStatusByAccountId(status.registerid, {},"UPLOAD_FILES_APPROVED");
            }
            response.send({status: 200,mensaje:"approved"});
        } catch (e) {
            next(new HttpException(500, e.message));
        }
    }

    decline = async (req: any, response: express.Response, next: express.NextFunction) => {
        try {
            const fileId = req.params.id;
            let comments = req.body.motivoRechazo;
            if(comments == null){
                comments = "";
            }
            const status = await this.service.decline(fileId,comments);
            // let user = await this.userService.getById(status.registerid);
          
          
            const lastaccountid = await this.registerService.getUsersbyprevregister(status.registerid);
            console.log("Get last account id: ",lastaccountid._id);
            if(lastaccountid){
                if(lastaccountid.status == "UPLOAD_FILES_STARTED"){
                    const register = await this.registerService.updateStatusByAccountId(lastaccountid.account_id, {},"UPLOAD_FILES_FAILED");
                }else{
                    let user = await this.userService.getbyregisteridandblock(lastaccountid._id);
                }

            }

            response.send({status: 200,mensaje:"declined"});
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
