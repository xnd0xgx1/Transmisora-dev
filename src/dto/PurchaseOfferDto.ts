import { IsNumber } from 'class-validator';

class PurchaseOfferDto {
    @IsNumber()
    public amount: number;

    @IsNumber()
    public exchangeRate: any;
}

export default PurchaseOfferDto;
