import HttpException from './HttpException';

class DeviceNotFoundException extends HttpException {
    constructor() {
        super(505, 'Device not found');
    }
}

export default DeviceNotFoundException;
