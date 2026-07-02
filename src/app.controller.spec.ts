import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { removeDatabaseFiles } from './database';

describe('AppController', () => {
  let appController: AppController;

  process.once('exit', () => {
    void removeDatabaseFiles();
  });

  beforeAll(async () => {
    await removeDatabaseFiles();
  });

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should send the index.html file for the root route', () => {
      const res = {
        sendFile: jest.fn().mockReturnThis(),
      } as any;

      appController.getHello(res);

      expect(res.sendFile).toHaveBeenCalledWith('index.html', { root: '.' });
    });
  });

  describe('check endpoint', () => {
    it('should record a check entry and return its id', async () => {
      const result = await appController.handleCheck(
        { method: 'GET', ip: '127.0.0.1' } as any,
        '127.0.0.1',
      );

      expect(result).toEqual(
        expect.objectContaining({
          method: 'GET',
          clientIp: '127.0.0.1',
        }),
      );
      expect(result.id).toBeGreaterThan(0);
    });
  });

  afterAll(async () => {
    await removeDatabaseFiles();
  });
});
