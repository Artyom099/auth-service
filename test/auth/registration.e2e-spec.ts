import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { EntityManager } from 'typeorm';

import { AppModule } from '../../src/AppModule';
import { UserTypeOrmRepository } from '../../src/auth';
import { RegistrationInputModel } from '../../src/auth/api/models/input/registration.input.model';
import { User } from '../../src/libs/db/entity';

describe('Auth Registration (e2e)', () => {
  let app: INestApplication;
  let entityManager: EntityManager;
  let userRepository: UserTypeOrmRepository;
  let dto: RegistrationInputModel;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    entityManager = app.get(EntityManager);
    userRepository = app.get(UserTypeOrmRepository);

    // Очищаем базу данных перед каждым тестом
    await entityManager.clear(User);
  });

  afterAll(async () => {
    await app.close();
    await entityManager.clear(User);
  });

  describe('POST /auth/registration', () => {
    it('should return 400 for invalid login', async () => {
      dto = {
        login: 'test', // too short
        email: 'test@example.com',
        password: 'StrongPass1!',
      };

      return request(app.getHttpServer()).post('/auth/registration').send(dto).expect(400);
    });

    it('should return 400 for invalid email', async () => {
      dto = {
        login: 'testuser',
        email: 'invalid-email',
        password: 'StrongPass1!',
      };

      return request(app.getHttpServer()).post('/auth/registration').send(dto).expect(400);
    });

    it('should return 400 for weak password', async () => {
      dto = {
        login: 'testuser',
        email: 'test@example.com',
        password: 'weak',
      };

      return request(app.getHttpServer()).post('/auth/registration').send(dto).expect(400);
    });

    it('should create user with valid data', async () => {
      dto = {
        login: 'testuser',
        email: 'test@example.com',
        password: 'StrongPass1!',
      };

      return request(app.getHttpServer())
        .post('/auth/registration')
        .send(dto)
        .expect(204)
        .then(async () => {
          // Проверяем, что пользователь создан в базе данных
          const createdUser = await userRepository.getUserByLoginOrEmail(entityManager, dto.login);
          expect(createdUser).toBeDefined();
          // expect(createdUser.login).toBe(validUser.login);
          expect(createdUser.email).toBe(dto.email);
        });
    });
  });
});
