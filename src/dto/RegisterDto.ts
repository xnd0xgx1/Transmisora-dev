import { IsString, IsOptional, IsObject } from 'class-validator';

class RegisterDto {
    @IsOptional()
    @IsString()
    process_id?: string;

    @IsOptional()
    @IsString()
    account_id?: string;

    @IsOptional()
    @IsString()
    client_id?: string;

    @IsOptional()
    @IsString()
    initialurl?: string;

    @IsOptional()
    @IsString()
    flow_id?: string;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsObject()
    Truora?: any;

    @IsOptional()
    @IsObject()
    ZapSign?: any;

    @IsOptional()
    @IsObject()
    data_obtenida?: any;
}

export default RegisterDto;
