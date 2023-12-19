import { IsArray, IsEmail, IsObject, IsOptional, IsString } from 'class-validator';

class RegisterWithEmailDto {

    @IsObject()
    public verify: any;

    @IsObject()
    public language: any;

    @IsString()
    public nationality: any;

    @IsString()
    public domicileAt: any;

    @IsEmail()
    public email: string;

    @IsString()
    public password: string;

    @IsArray()
    public roles: string[];

    @IsString()
    @IsOptional()
    public deviceToken: string;
}

export default RegisterWithEmailDto;
