import { Loop, LoopParameters, DeltaTimeFormat } from './Loop';

jest.useFakeTimers();

describe('Loop', () => {
  let loop: Loop;
  let mockOnTick: (deltaTime: number) => any;

  const setFrameDuration = (duration: number) => {
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      setTimeout(cb, duration);
      return 1;
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    mockOnTick = jest.fn();
  });

  afterEach(() => {
    loop?.stop();
  });

  const setupTest = (params: LoopParameters) => {
    loop = new Loop(params);
  };

  describe('start()', () => {
    it('should return self', () => {
      setupTest({ onTick: mockOnTick });

      const startReturnValue = loop.start();
      const secondStartReturnValue = loop.start();

      expect(startReturnValue).toBe(loop);
      expect(secondStartReturnValue).toBe(loop);
    });
  });

  describe('when started', () => {
    let mockTime: number;

    beforeEach(() => {
      setupTest({ onTick: mockOnTick });
      setFrameDuration(16);
      mockTime = 1234;
      jest.spyOn(Date, 'now').mockReturnValueOnce(mockTime);
      loop.start();
    });

    it('should call tick handler on every frame', () => {
      expect(mockOnTick).toHaveBeenCalledTimes(0);

      jest.advanceTimersByTime(16);
      expect(mockOnTick).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(16);
      expect(mockOnTick).toHaveBeenCalledTimes(2);
    });

    it('should start only once', () => {
      loop.start();
      expect(mockOnTick).toHaveBeenCalledTimes(0);

      jest.advanceTimersByTime(16);
      expect(mockOnTick).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(16);
      expect(mockOnTick).toHaveBeenCalledTimes(2);
    });

    it('should know how stop the timer', () => {
      expect(mockOnTick).toHaveBeenCalledTimes(0);

      jest.advanceTimersByTime(16);
      expect(mockOnTick).toHaveBeenCalledTimes(1);

      loop.stop();

      jest.advanceTimersByTime(99);
      expect(mockOnTick).toHaveBeenCalledTimes(1);
    });

    it('should pass the duration of previous frame in the tick handler', () => {
      mockTime += 17;
      jest.spyOn(Date, 'now').mockReturnValueOnce(mockTime);
      jest.advanceTimersByTime(17);

      expect(mockOnTick).toHaveBeenCalledWith(17);
    });
  });

  describe('when started and configured to', () => {
    describe('report relative delta time format', () => {
      it('should report relative delta time', () => {
        setupTest({ onTick: mockOnTick, deltaTimeFormat: DeltaTimeFormat.RELATIVE });

        setFrameDuration(17);
        let mockTime = 1234;
        jest.spyOn(Date, 'now').mockReturnValueOnce(mockTime);

        loop.start();

        mockTime += 17;
        jest.spyOn(Date, 'now').mockReturnValueOnce(mockTime);
        jest.advanceTimersByTime(17);

        expect(mockOnTick).toHaveBeenCalledWith(1.0625);
      });
    });

    describe('report delta time format in seconds', () => {
      it('should report delta time in seconds', () => {
        setupTest({ onTick: mockOnTick, deltaTimeFormat: DeltaTimeFormat.SECONDS });

        setFrameDuration(19);
        let mockTime = 1234;
        jest.spyOn(Date, 'now').mockReturnValueOnce(mockTime);

        loop.start();

        mockTime += 19;
        jest.spyOn(Date, 'now').mockReturnValueOnce(mockTime);
        jest.advanceTimersByTime(19);

        expect(mockOnTick).toHaveBeenCalledWith(0.019);
      });
    });

    describe('limit delta time', () => {
      it('should limit reported delta time', () => {
        setupTest({ onTick: mockOnTick, deltaTimeLimit: 32 });

        setFrameDuration(100);
        let mockTime = 1234;
        jest.spyOn(Date, 'now').mockReturnValueOnce(mockTime);

        loop.start();

        mockTime += 100;
        jest.spyOn(Date, 'now').mockReturnValueOnce(mockTime);
        jest.advanceTimersByTime(100);

        expect(mockOnTick).toHaveBeenCalledWith(32);
      });
    });

    describe('start without delay', () => {
      it('should call tick handler immediately with sensible delta time', () => {
        setupTest({ onTick: mockOnTick, startWithoutDelay: true });
        setFrameDuration(16);

        loop.start();

        expect(mockOnTick).toHaveBeenCalledTimes(1);

        jest.advanceTimersByTime(16);
        expect(mockOnTick).toHaveBeenCalledTimes(2);

        jest.advanceTimersByTime(16);
        expect(mockOnTick).toHaveBeenCalledTimes(3);
      });
    });

    describe('use target timeout', () => {
      it('should tick with given timeout', () => {
        setupTest({ onTick: mockOnTick, targetTimeout: 300 });
        setFrameDuration(100);

        loop.start();

        expect(mockOnTick).toHaveBeenCalledTimes(0);

        jest.advanceTimersByTime(300);
        expect(mockOnTick).toHaveBeenCalledTimes(1);

        jest.advanceTimersByTime(300);
        expect(mockOnTick).toHaveBeenCalledTimes(2);
      });
    });

    describe('use target timeout and to report relative delta time', () => {
      it('should tick with given delta time and report relative delta time', () => {
        setupTest({ onTick: mockOnTick, targetTimeout: 100, deltaTimeFormat: DeltaTimeFormat.RELATIVE });

        setFrameDuration(16);
        let mockTime = 1234;
        jest.spyOn(Date, 'now').mockReturnValueOnce(mockTime);

        loop.start();

        mockTime += 100;
        jest.spyOn(Date, 'now').mockReturnValueOnce(mockTime);
        jest.advanceTimersByTime(110);

        expect(mockOnTick).toHaveBeenCalledWith(1);

        mockTime += 110;
        jest.spyOn(Date, 'now').mockReturnValueOnce(mockTime);
        jest.advanceTimersByTime(110);

        expect(mockOnTick).toHaveBeenCalledWith(1.1);
      });
    });
  });
});
