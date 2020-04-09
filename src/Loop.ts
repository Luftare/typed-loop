enum TimeoutFunction {
  REQUEST_ANIMATION_FRAME = 'requestAnimationFrame',
  SET_TIMEOUT = 'setTimeout',
}

export enum DeltaTimeFormat {
  RELATIVE = 'relative',
  MILLISECONDS = 'milliseconds',
  SECONDS = 'seconds',
}

export interface LoopParameters {
  onTick: (deltaTime: number) => any;
  deltaTimeFormat?: DeltaTimeFormat;
  deltaTimeLimit?: number;
  startWithoutDelay?: boolean;
  targetTimeout?: number;
}

export class Loop {
  onTick: (deltaTime: number) => any;
  private lastTickTime: number;
  private active: boolean;
  private deltaTimeFormat: DeltaTimeFormat;
  private deltaTimeLimit: number | undefined;
  private startWithoutDelay: boolean;
  private timeoutFunction: TimeoutFunction;
  private targetTimeout: number | undefined;
  private timeoutId: number;

  static estimatedDeltaTimeMs = 16;

  constructor({
    onTick,
    deltaTimeLimit,
    targetTimeout,
    deltaTimeFormat = DeltaTimeFormat.MILLISECONDS,
    startWithoutDelay = false,
  }: LoopParameters) {
    this.onTick = onTick;
    this.deltaTimeLimit = deltaTimeLimit;
    this.targetTimeout = targetTimeout;
    this.timeoutFunction =
      targetTimeout !== undefined ? TimeoutFunction.SET_TIMEOUT : TimeoutFunction.REQUEST_ANIMATION_FRAME;
    this.startWithoutDelay = startWithoutDelay;
    this.deltaTimeFormat = deltaTimeFormat;
    this.lastTickTime = 0;
    this.timeoutId = 0;
    this.active = false;

    this.tick = this.tick.bind(this); // to enable method reference passing directly to timeout functions
  }

  start() {
    if (this.active) return this;

    this.active = true;
    if (this.startWithoutDelay) {
      this.onTick(Loop.estimatedDeltaTimeMs);
      this.scheduleNextTick(Date.now() - Loop.estimatedDeltaTimeMs);
    } else {
      this.scheduleNextTick();
    }

    return this;
  }

  stop() {
    this.active = false;
    if(this.timeoutFunction === TimeoutFunction.REQUEST_ANIMATION_FRAME) {
      cancelAnimationFrame(this.timeoutId);
    } else {
      clearTimeout(this.timeoutId);
    }
  }

  private tick() {
    if (!this.active) return;

    const now = Date.now();
    const actualDeltaTimeMs = now - this.lastTickTime;
    const limitedDeltaTimeInMs =
      this.deltaTimeLimit !== undefined ? Math.min(actualDeltaTimeMs, this.deltaTimeLimit) : actualDeltaTimeMs;
    const formattedDeltaTime = this.getFormattedDeltaTime(limitedDeltaTimeInMs);

    this.onTick(formattedDeltaTime);
    this.scheduleNextTick(now);
  }

  private getFormattedDeltaTime(deltaTimeInMs: number) {
    switch (this.deltaTimeFormat) {
      case DeltaTimeFormat.RELATIVE:
        return deltaTimeInMs / (this.targetTimeout ?? Loop.estimatedDeltaTimeMs);
      case DeltaTimeFormat.SECONDS:
        return deltaTimeInMs * 0.001;
      default:
        return deltaTimeInMs;
    }
  }

  private scheduleNextTick(currentTime = Date.now()) {
    this.lastTickTime = currentTime;

    if (this.timeoutFunction === TimeoutFunction.SET_TIMEOUT) {
      this.timeoutId = setTimeout(this.tick, this.targetTimeout);
    } else {
      this.timeoutId = requestAnimationFrame(this.tick);
    }
  }
}
