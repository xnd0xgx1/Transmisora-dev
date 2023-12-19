import { IsString } from 'class-validator';

class LoginPhoneDto {
    
    @IsString()
    public phoneCode: string;
    
    @IsString()
    public phone: string;

    @IsString()
    public password: string;

    @IsString()
    public deviceToken: string;
}

export default LoginPhoneDto;
