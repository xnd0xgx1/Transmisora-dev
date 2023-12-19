import { IsNumber, IsString } from 'class-validator';

class ResetPasswordDto {
    @IsString()
    public newPassword: string;
}

export default ResetPasswordDto;
