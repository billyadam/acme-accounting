import { Test, TestingModule } from '@nestjs/testing';
import { DbModule } from '../db.module';
import { ReportsService as ReportsService } from './reports.service';
import { ReportsController as ReportsController } from './reports.controller';

describe('ReportsController', () => {
  let controller: ReportsController;

  const mockReportsService = {
    accounts: jest.fn(),
    yearly: jest.fn(),
    fs: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      imports: [DbModule],
      providers: [
        {
          provide: ReportsService,
          useValue: mockReportsService,
        },
      ],
    }).compile();

    controller = module.get<ReportsController>(ReportsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
