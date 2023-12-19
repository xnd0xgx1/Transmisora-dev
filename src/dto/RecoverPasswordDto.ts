import { IsOptional, IsString } from 'class-validator';

class RecoverPasswordDto {

    @IsString()
    @IsOptional()
    public email: string;

    @IsString()
    @IsOptional()
    public phoneCode: string;

    @IsString()
    @IsOptional()
    public phone: string;
}

export default RecoverPasswordDto;
