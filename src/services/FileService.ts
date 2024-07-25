import BaseService from "./base/BaseService";
import FileRepository from "../repositories/FileRepository";
import File from "../models/File";
import FileType from "../enums/FileType";

class FileService extends BaseService<FileRepository> {

    constructor() {
        super(new FileRepository(File));
    }

    createFile = async (name: string, type: FileType,registerid:string) => {
        const file = await this.repository.create({
            name,
            type,
            registerid,
            url:`https://trasmisora-app-files.s3.us-east-2.amazonaws.com/${name}`
        });

        return file;
    }

    approve = async (userId: any) => {
        let file = await this.repository.getById(userId);
        file.status = 'APPROVED';
        file = await this.repository.update(file);
        return file;
    }

    decline = async (userId: any,comments:string) => {
        let file = await this.repository.getById(userId);
        file.status = 'REJECTED';
        file.comments = comments;
        file = await this.repository.update(file);
        return file;
    }

    comments = async (userId: any, comments: string) => {
        let file = await this.repository.getById(userId);
        file.comments = comments;
        file = await this.repository.update(file);
        return file;
    }
}

export default FileService;
