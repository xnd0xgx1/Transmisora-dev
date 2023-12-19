import HttpException from './HttpException';

class WrongCredentialsException extends HttpException {
    constructor() {
        super(401, 'Incorrect access data');
    }
}

export default WrongCredentialsException;
