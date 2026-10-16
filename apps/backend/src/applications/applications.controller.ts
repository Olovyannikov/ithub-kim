import type { ApplicationDto, ApplicationsPage } from '@kim/shared';
import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateReviewDto } from '../reviews/dto/create-review.dto';
import type { UserEntity } from '../users/user.entity';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { FilterApplicationsDto } from './dto/filter-applications.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applications: ApplicationsService) {}

  @Post()
  create(
    @CurrentUser() user: UserEntity,
    @Body() dto: CreateApplicationDto,
  ): Promise<ApplicationDto> {
    return this.applications.create(user, dto);
  }

  /**
   * Свои заявки. Отдельный путь, а не фильтр по пользователю в общем списке:
   * так клиенту нечем попросить чужие заявки (ADR-0004).
   */
  @Get('my')
  findMine(@CurrentUser() user: UserEntity): Promise<ApplicationDto[]> {
    return this.applications.findMine(user);
  }

  @Post(':id/review')
  addReview(
    @CurrentUser() user: UserEntity,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateReviewDto,
  ): Promise<ApplicationDto> {
    return this.applications.addReview(user, id, dto);
  }

  // --- панель администратора ---

  @Roles('admin')
  @Get()
  findAll(@Query() filter: FilterApplicationsDto): Promise<ApplicationsPage> {
    return this.applications.findAll(filter);
  }

  @Roles('admin')
  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStatusDto,
  ): Promise<ApplicationDto> {
    return this.applications.updateStatus(id, dto);
  }
}
