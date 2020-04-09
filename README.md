# typed-loop

A loop class to enable flexible intervals for visual experiments and games. It provides delta time in various formats and uses `requestAnimationFrame` for the timeouts. It's possible to use `setTimeout` with given `targetDeltaTime`.

## How to use
This module exports a `Loop` class,  `DeltaTimeFormat` enum and `LoopParameters` interface.

`````ts
import { Loop } from 'typed-loop';

const loop = new Loop({
  onTick(deltaTime) {
    console.log(deltaTime)
  }
});
`````

## API

#### [LoopParameters](#loop-parameters)

| Name              | Required? | Type                                    | Default value  | Description                                               |
|-------------------|-----------|-----------------------------------------|----------------|-----------------------------------------------------------|
| onTick            | Yes       | (deltaTime: number) => any              | undefined      | callback function to be called on every tick of the loop  |
| deltaTimeFormat   | No        | 'relative' | 'milliseconds' | 'seconds' | 'milliseconds' | how the delta time should be formatted                    |
| deltaTimeLimit    | No        | number | undefined                      | undefined      | maximum delta time in milliseconds                        |
| startWithoutDelay | No        | boolean                                 | false          | should the callback be called immediately                 |
| targetTimeout     | No        | number | undefined                      | undefined      | target timeout, tick on every frame not guaranteed if set |

#### [Loop(config: LoopParameters)](#loop)
`````ts
import { Loop, LoopParameters, DeltaTimeFormat } from 'typed-loop';

const conf: LoopParameters = {
  onTick: () => {},
  startWithoutDelay: true,
  deltaTimeFormat: DeltaTimeForma.relative
};

const loop = new Loop(config).start();

setTimeout(() => {
  loop.stop();
}, 5000);
`````

### Methods

#### [start(): self](#start)
Starts the loop.

#### [stop(): void](#stop)
Stops the loop.

## Additional info

### requestAnimationFrame vs setTimeout

`requestAnimationFrame` schedules a function to be called right before the next screen repaint. Most commonly the repaint occurs every 16ms resulting 60 frames / second (FPS). `setTimeout` schedules function to be called after given milliseconds, however, it seems that the delay is always at least around 4ms even with timeout of `0`.

Due to this all loops that animate visible entities will benefit using `requestAnimationFrame` as excess repaints (high FPS) between screen repaints will not be visible to the users and skipped screen repaints (low FPS) result in jumps and lag.

### Why delta time?

Screen refresh rate is not same for all devices and furthermore the refresh rate varies a bit, typically around +-5ms based on load of the machine among other factors.

When animating movement on sceen (e.g. games and animations) the previously mentioned inaccuracy of FPS causes visible jumping and lagging. This can be mitigated by applying the actual duration of previous frame time when calculating new position for the animated elements.

### Example - laggy
Without compensating the variance of FPS.

````typescript
let x = 0;

function loop() {
  x += 5;
  repaint(x); // Arbitrary function to repaint to updated position
  requestAnimationFrame(loop);
}
````
### Example - less laggy
Applying FPS variance compensation with delta time.

````typescript
let x = 0;

new Loop({
  deltaTimeFormat: DeltaTimeFormat.RELATIVE,
  onTick(deltaTime => {
    x += 5 * deltaTime;
    repaint(x); // Arbitrary function to repaint to updated position
  })
}).start();
````