import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { ListingsService } from './listings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('listings')
export class ListingsController {
    constructor(private readonly listingsService: ListingsService) { }

    @Get()
    findAll(@Query() query: any) {
        return this.listingsService.findAll(query);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.listingsService.findOne(id);
    }

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Body() data: any, @Request() req: any) {
        return this.listingsService.create(data, req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    update(@Param('id') id: string, @Body() data: any, @Request() req: any) {
        return this.listingsService.update(id, data, req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    remove(@Param('id') id: string, @Request() req: any) {
        return this.listingsService.remove(id, req.user.userId);
    }
}
