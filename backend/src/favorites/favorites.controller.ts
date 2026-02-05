import { Controller, Get, Post, Delete, Param, UseGuards, Request } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('favorites')
export class FavoritesController {
    constructor(private readonly favoritesService: FavoritesService) { }

    @Get()
    findAll(@Request() req: any) {
        return this.favoritesService.findAll(req.user.userId);
    }

    @Post(':listingId')
    create(@Param('listingId') listingId: string, @Request() req: any) {
        return this.favoritesService.create(req.user.userId, listingId);
    }

    @Delete(':listingId')
    remove(@Param('listingId') listingId: string, @Request() req: any) {
        return this.favoritesService.delete(req.user.userId, listingId);
    }
}
