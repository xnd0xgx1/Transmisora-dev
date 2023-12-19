import { IsArray, IsObject, IsOptional, IsString } from 'class-validator';

class RegisterWithPhoneDto {

    @IsObject()
    public verify: any;
    
    @IsObject()
    public language: any;

    @IsString()
    public nationality: any;

    @IsString()
    public domicileAt: any;
    
    @IsString()
    public phoneCode: string;

    @IsString()
    public phone: string;

    @IsString()
    public password: string;

    @IsArray()
    public roles: string[];

    @IsString()
    @IsOptional()
    public deviceToken: string;
}

export default RegisterWithPhoneDto;
