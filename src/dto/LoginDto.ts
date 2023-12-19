import { IsString, IsEmail } from 'class-validator';

class LoginDto {
    @IsEmail()
    public email: string;

    @IsString()
    public password: string;

    @IsString()
    public deviceToken: string;
}

export default LoginDto;
