import HttpException from './HttpException';

class DeviceSessionExpiredException extends HttpException {
    constructor() {
        super(506, 'Device session expired');
    }
}

export default DeviceSessionExpiredException;
