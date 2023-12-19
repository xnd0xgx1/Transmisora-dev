import { IsObject, IsString } from 'class-validator';

class AdministratorDto {

    @IsString()
    public firstName: any;

    @IsString()
    public lastName: any;

    @IsString()
    public mothersLastName: string;

    @IsObject()
    public ineFront: any;

    @IsObject()
    public ineBack: any;
}

export default AdministratorDto;
