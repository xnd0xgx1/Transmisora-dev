import HttpException from './HttpException';

class NotDeviceIdException extends HttpException {
    constructor() {
        super(504, 'The device id is required');
    }
}

export default NotDeviceIdException;
