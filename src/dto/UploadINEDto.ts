import { IsObject } from 'class-validator';

class UploadINEDto {

    @IsObject()
    public ineFront: any;

    @IsObject()
    public ineBack: any;
}

export default UploadINEDto;
