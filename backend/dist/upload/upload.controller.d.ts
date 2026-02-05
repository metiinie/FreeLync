import type { Response } from 'express';
export declare class UploadController {
    uploadFile(file: any): {
        originalname: any;
        filename: any;
        path: string;
        publicUrl: string;
    };
    uploadFiles(files: Array<any>): {
        originalname: any;
        filename: any;
        path: string;
        publicUrl: string;
    }[];
    seeUploadedFile(image: string, res: Response): void;
}
