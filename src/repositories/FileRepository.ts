import File from '../models/File';
import { BaseRepository } from './base/BaseRepository';

class FileRepository extends BaseRepository<typeof File> {
    getByName = async (name: any) => {
        return await File.findOne({ name: name })
    };
}

export default FileRepository;
