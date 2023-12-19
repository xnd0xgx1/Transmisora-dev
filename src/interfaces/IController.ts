import { Router } from 'express';

interface Controller {
    createdAt: Date;
    path: string;
    router: Router;
}

export default Controller;