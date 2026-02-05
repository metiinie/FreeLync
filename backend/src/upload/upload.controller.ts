import { Controller, Post, UseInterceptors, UploadedFile, Get, Param, Res, UploadedFiles } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import type { Response } from 'express';

@Controller('upload')
export class UploadController {

    @Post('file')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads',
            filename: (req, file, cb) => {
                const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
                return cb(null, `${randomName}${extname(file.originalname)}`);
            }
        })
    }))
    uploadFile(@UploadedFile() file: any) {
        if (!file) throw new Error('File is required');
        return {
            originalname: file.originalname,
            filename: file.filename,
            path: `uploads/${file.filename}`, // Relative path for serving
            publicUrl: `/uploads/${file.filename}`
        };
    }

    @Post('files')
    @UseInterceptors(FilesInterceptor('files', 10, { // Max 10 files
        storage: diskStorage({
            destination: './uploads',
            filename: (req, file, cb) => {
                const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
                return cb(null, `${randomName}${extname(file.originalname)}`);
            }
        })
    }))
    uploadFiles(@UploadedFiles() files: Array<any>) {
        if (!files || files.length === 0) throw new Error('Files are required');
        return files.map(file => ({
            originalname: file.originalname,
            filename: file.filename,
            path: `uploads/${file.filename}`,
            publicUrl: `/uploads/${file.filename}`
        }));
    }

    @Get(':filename')
    seeUploadedFile(@Param('filename') image: string, @Res() res: Response) {
        return res.sendFile(image, { root: './uploads' });
    }
}
