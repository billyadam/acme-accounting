import { Test, TestingModule } from '@nestjs/testing';
import { DbModule } from '../db.module';
import { ReportsService as ReportsService } from './reports.service';
import { ReportsController as ReportsController } from './reports.controller';

describe('ReportsController', () => {
  let controller: ReportsController;

  const mockReportsService = {
    state: jest.fn(),
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

  describe('report', () => {
    it('if the service get report successfully', () => {
      mockReportsService.state.mockReturnValue('proccessing');

      const report = controller.report();

      expect(report['accounts.csv']).toBe('proccessing');
      expect(report['yearly.csv']).toBe('proccessing');
      expect(report['fs.csv']).toBe('proccessing');
    });
  });

  describe('generate', () => {
    it('if the service generate report successfully', () => {
      const report = controller.generate();
      expect(mockReportsService.accounts).toHaveBeenCalledWith();
      expect(mockReportsService.yearly).toHaveBeenCalledWith();
      expect(mockReportsService.fs).toHaveBeenCalledWith();

      expect(report.message).toBe('proccessing');
    });
  });
});
