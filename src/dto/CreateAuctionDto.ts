import { IsNumber } from 'class-validator';

class CreateAuctionDto {

    @IsNumber()
    public amount: number;

    @IsNumber()
    public from: any;

    @IsNumber()
    public to: any;
}

export default CreateAuctionDto;
