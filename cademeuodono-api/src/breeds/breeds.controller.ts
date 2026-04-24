import { Controller, Get, Query } from '@nestjs/common'
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { Public } from '../common/decorators/public.decorator'
import { BreedsService } from './breeds.service'

@ApiTags('Raças')
@Controller('breeds')
export class BreedsController {
  constructor(private readonly breedsService: BreedsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Listar raças por espécie (DOG ou CAT)' })
  @ApiQuery({ name: 'species', required: false, enum: ['DOG', 'CAT'] })
  findAll(@Query('species') species?: string) {
    return this.breedsService.findAll(species)
  }
}
