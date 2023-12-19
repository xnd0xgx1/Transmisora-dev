import Log from '../models/Log';

export default class LogRepository {

    constructor() {

    }

    getAll = async () => {
        return Log.find();
    }

    create = async (message: string) => {
        console.log(message);
        const logN = new Log({
            message: message
        });
        return await logN.save();
    }
}
