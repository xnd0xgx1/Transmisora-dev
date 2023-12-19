import HttpException from './HttpException';

class UserWithThatEmailAlreadyExistsException extends HttpException {
  constructor(email: string) {
    super(400, `There is already a user with the email ${email}`);
  }
}

export default UserWithThatEmailAlreadyExistsException;