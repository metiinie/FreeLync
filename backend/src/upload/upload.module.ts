import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { MulterModule } from '@nestjs/platform-express';

@Module({
    imports: [
        MulterModule.register({
            dest: './uploads',
        }),
    ],
    controllers: [UploadController],
})
export class UploadModule { }
