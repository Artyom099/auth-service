import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { EntityManager } from 'typeorm';

import { AppModule } from '../../src/AppModule';
import { UserRepository } from '../../src/auth';
import { RegistrationRequestDto } from '../../src/auth/api/models/input/RegistrationRequestDto';
import { User } from '../../src/libs/db/entity';

describe('Auth Registration (e2e)', () => {
  let app: INestApplication;
  let entityManager: EntityManager;
  let userRepository: UserRepository;
  let dto: RegistrationRequestDto;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    entityManager = app.get(EntityManager);
    userRepository = app.get(UserRepository);

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

      return request(app.getHttpServer())
        .post('/auth/registration')
        .send(dto)
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('errors');
          expect(res.body.errors).toContainEqual(
            expect.objectContaining({
              field: 'login',
            }),
          );
        });
    });

    it('should return 400 for invalid email', async () => {
      dto = {
        login: 'testuser',
        email: 'invalid-email',
        password: 'StrongPass1!',
      };

      return request(app.getHttpServer())
        .post('/auth/registration')
        .send(dto)
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('errors');
          expect(res.body.errors).toContainEqual(
            expect.objectContaining({
              field: 'email',
            }),
          );
        });
    });

    it('should return 400 for weak password', async () => {
      dto = {
        login: 'testuser',
        email: 'test@example.com',
        password: 'weak',
      };

      return request(app.getHttpServer())
        .post('/auth/registration')
        .send(dto)
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('errors');
          expect(res.body.errors).toContainEqual(
            expect.objectContaining({
              field: 'password',
            }),
          );
        });
    });

    it('should create user with valid data', async () => {
      dto = {
        login: 'testuser',
        email: 'test@example.com',
        password: 'StrongPass1!',
      };

      await request(app.getHttpServer()).post('/auth/registration').send(dto).expect(204);

      // Проверяем, что пользователь создан в базе данных
      const createdUser = await userRepository.getUserByLoginOrEmail(entityManager, dto.login);
      expect(createdUser).toBeDefined();
      expect(createdUser.email).toBe(dto.email);
      expect(createdUser.isConfirmed).toBe(false);
    });
  });
});
