import {
  canLeaveReview,
  VALIDATION_MESSAGES,
  type ApplicationDto,
  type ApplicationsPage,
} from '@kim/shared';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  badRequestField,
  conflictField,
  forbiddenField,
  notFoundField,
} from '../common/validation/field-errors';
import { ReviewEntity } from '../reviews/review.entity';
import type { CreateReviewDto } from '../reviews/dto/create-review.dto';
import { RoomEntity } from '../rooms/room.entity';
import { RoomsService } from '../rooms/rooms.service';
import type { UserEntity } from '../users/user.entity';
import { ApplicationEntity } from './application.entity';
import type { CreateApplicationDto } from './dto/create-application.dto';
import type { FilterApplicationsDto } from './dto/filter-applications.dto';
import type { UpdateStatusDto } from './dto/update-status.dto';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(ApplicationEntity)
    private readonly applications: Repository<ApplicationEntity>,
    @InjectRepository(RoomEntity)
    private readonly rooms: Repository<RoomEntity>,
    @InjectRepository(ReviewEntity)
    private readonly reviews: Repository<ReviewEntity>,
  ) {}

  /** Задание 1, п. 4. Заявка всегда создаётся со статусом «Новая». */
  async create(user: UserEntity, dto: CreateApplicationDto): Promise<ApplicationDto> {
    const room = await this.rooms.findOne({ where: { id: dto.roomId } });

    if (!room) {
      throw notFoundField('roomId', VALIDATION_MESSAGES.roomNotFound);
    }

    const startsAt = new Date(dto.startsAt);

    if (startsAt.getTime() < Date.now()) {
      throw badRequestField('startsAt', VALIDATION_MESSAGES.startsAtPast);
    }

    const saved = await this.applications.save(
      this.applications.create({
        // Автор берётся из текущей сессии, а не из запроса: клиенту нечем
        // подать заявку от чужого имени (ADR-0004).
        userId: user.id,
        roomId: room.id,
        startsAt,
        paymentMethod: dto.paymentMethod,
      }),
    );

    return ApplicationsService.toDto({ ...saved, room, review: null });
  }

  /** Задание 1, п. 3: пользователь видит только свои заявки. */
  async findMine(user: UserEntity): Promise<ApplicationDto[]> {
    const items = await this.applications.find({
      where: { userId: user.id },
      relations: { room: true, review: true },
      order: { createdAt: 'DESC' },
    });

    return items.map((item) => ApplicationsService.toDto(item));
  }

  /** Задание 1, п. 5 и Задание 2, п. 5: все заявки с фильтрами, для администратора. */
  async findAll(filter: FilterApplicationsDto): Promise<ApplicationsPage> {
    const query = this.applications
      .createQueryBuilder('application')
      .innerJoinAndSelect('application.room', 'room')
      .innerJoinAndSelect('application.user', 'user')
      .leftJoinAndSelect('application.review', 'review')
      .orderBy('application.createdAt', 'DESC');

    if (filter.status) {
      query.andWhere('application.status = :status', { status: filter.status });
    }

    if (filter.roomId) {
      query.andWhere('application.roomId = :roomId', { roomId: filter.roomId });
    }

    if (filter.author) {
      query.andWhere('(user.login ILIKE :author OR user.fullName ILIKE :author)', {
        author: `%${filter.author}%`,
      });
    }

    if (filter.from) {
      query.andWhere('application.startsAt >= :from', { from: new Date(filter.from) });
    }

    if (filter.to) {
      query.andWhere('application.startsAt <= :to', { to: new Date(filter.to) });
    }

    const total = await query.getCount();
    const items = await query
      .take(filter.limit ?? 50)
      .skip(filter.offset ?? 0)
      .getMany();

    return {
      items: items.map((item) => ApplicationsService.toDto(item, true)),
      total,
    };
  }

  /** Задание 1, п. 5: администратор меняет статус заявки. */
  async updateStatus(id: number, dto: UpdateStatusDto): Promise<ApplicationDto> {
    const application = await this.applications.findOne({
      where: { id },
      relations: { room: true, review: true, user: true },
    });

    if (!application) {
      throw notFoundField('id', VALIDATION_MESSAGES.applicationNotFound);
    }

    application.status = dto.status;
    await this.applications.save(application);

    return ApplicationsService.toDto(application, true);
  }

  /**
   * Задание 1, п. 3 и Задание 2, п. 3: отзыв доступен только после завершения
   * мероприятия и только автору заявки.
   */
  async addReview(
    user: UserEntity,
    applicationId: number,
    dto: CreateReviewDto,
  ): Promise<ApplicationDto> {
    const application = await this.applications.findOne({
      where: { id: applicationId },
      relations: { room: true, review: true },
    });

    if (!application) {
      throw notFoundField('id', VALIDATION_MESSAGES.applicationNotFound);
    }

    if (application.userId !== user.id) {
      throw forbiddenField('id', VALIDATION_MESSAGES.forbidden);
    }

    if (!canLeaveReview(application.status)) {
      throw badRequestField('rating', VALIDATION_MESSAGES.reviewNotAllowed);
    }

    if (application.review) {
      throw conflictField('rating', VALIDATION_MESSAGES.reviewAlreadyExists);
    }

    application.review = await this.reviews.save(
      this.reviews.create({ applicationId: application.id, rating: dto.rating, text: dto.text }),
    );

    return ApplicationsService.toDto(application);
  }

  static toDto(application: ApplicationEntity, withAuthor = false): ApplicationDto {
    const dto: ApplicationDto = {
      id: application.id,
      room: RoomsService.toDto(application.room),
      startsAt: application.startsAt.toISOString(),
      paymentMethod: application.paymentMethod,
      status: application.status,
      createdAt: application.createdAt.toISOString(),
      review: application.review
        ? {
            id: application.review.id,
            rating: application.review.rating,
            text: application.review.text,
            createdAt: application.review.createdAt.toISOString(),
          }
        : null,
      // Право на отзыв считает сервер: клиент не решает, можно ли ему писать
      // отзыв, он лишь показывает кнопку по этому признаку.
      canLeaveReview: canLeaveReview(application.status) && !application.review,
    };

    if (withAuthor && application.user) {
      dto.author = {
        id: application.user.id,
        login: application.user.login,
        fullName: application.user.fullName,
        phone: application.user.phone,
        email: application.user.email,
      };
    }

    return dto;
  }
}
