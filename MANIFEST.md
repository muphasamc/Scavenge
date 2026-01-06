
# VIBECODING MANIFEST :: PROCEDURAL SPIDER

## NOTE TO SELF
If you are reading this, you are probably trying to figure out how the movement works or why the terrain looks like that. Here is the vibe check.

### 1. THE PHILOSOPHY OF MOVEMENT
**Animation is dead.** Keyframes are rigid.
This project uses **Reactive Kinematics**.
- The spider doesn't "walk". It *falls*, catches itself, and drags its body forward.
- The legs are independent agents. They only step when they are "uncomfortable" (stretched too far).
- **Latency is Life.** The body lags behind the legs. The head lags behind the target. This creates weight.

### 2. THE TERRAIN TRICK (Domain Warping)
Standard Perlin noise looks like a grid. It looks digital.
To make it organic (Dunes), we use **Domain Warping**.
We don't just ask for height at (x,y). We twist (x,y) using sine waves first.
`Height = Noise( Twist(x,y) )`
This mimics how wind pushes sand.

### 3. ADVANCED TOPOLOGY (v1.1)
- **Canyons**: We use `pow(sin(x), 3)` to sharpen the waves. This pushes values towards -1 and 1, creating wide flat mesas and vertical cliff walls, rather than smooth hills.
- **Crystals**: We use **Quantization** (`floor(x / blockSize)`). This snaps the terrain into discrete steps. We then hash that coordinate to get a random height, creating the "City/Chip" look.

### 4. THE SHADER TRICKS
- **Sand**: Low-freq noise for wet patches, High-freq noise for grain.
- **Crystal**: We deliberately use `flatShading`. To get the normals in the shader (since vertices share normals in smooth shading), we use `dFdx(vWorldPosition)` and `dFdy` to calculate the mathematical face normal on the fly. This gives the hard-edged "Jewel" look.

### 5. THE DUST TRICK
We cannot simulate 1 million particles.
We simulate 3000 particles in a box around the camera.
As you walk, the box moves with you.
Particles that leave the box wrap around to the other side (`mod` function).
It's an illusion of infinity.

### 6. THE IK TRICK
Don't use Matrix math for 2-bone IK. It's overkill.
It's just a triangle (Law of Cosines).
Shoulder -> Elbow -> Hand.
Keep it simple.

---
*Built with React Three Fiber + Vibe*
