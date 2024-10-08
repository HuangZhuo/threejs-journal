import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { Lensflare, LensflareElement } from 'three/addons/objects/Lensflare.js'
import GUI from 'lil-gui'
import earthVertexShader from './shaders/earth/vertex.glsl'
import earthFragmentShader from './shaders/earth/fragment.glsl'
import atmosphereVertexShader from './shaders/atmosphere/vertex.glsl'
import atmosphereFragmentShader from './shaders/atmosphere/fragment.glsl'

/**
 * Base
 */
// Debug
const gui = new GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()
// const axesHelper = new THREE.AxesHelper(5);
// scene.add(axesHelper);

// Loaders
const textureLoader = new THREE.TextureLoader()


/**
 * Stars
 * https://threejs.org/examples/#webgl_camera
 */
const geometry = new THREE.BufferGeometry();
const starSpherical = new THREE.Spherical(0, 0, 0);
const starPos = new THREE.Vector3();
const vertices = [];

for (let i = 0; i < 10000; i++) {
    // 在 100～200 之间随机分布点
    starSpherical.radius = THREE.MathUtils.randInt(200, 400)
    // starSpherical.phi = THREE.MathUtils.randFloat(0, Math.PI);
    starSpherical.phi = Math.acos(THREE.MathUtils.randFloat(-1, 1));
    starSpherical.theta = THREE.MathUtils.randFloat(-Math.PI, Math.PI);
    starPos.setFromSpherical(starSpherical)
    vertices.push(starPos.x);
    vertices.push(starPos.y);
    vertices.push(starPos.z);
}

geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

const particles = new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0x888888 }));
scene.add(particles);

/**
 * Earth
 */

// Colors
const earthParameters = {}
earthParameters.atmosphereDayColor = '#00aaff'
earthParameters.atmosphereTwilightColor = '#ff6600'

gui.addColor(earthParameters, 'atmosphereDayColor')
    .onChange(() => {
        earth.material.uniforms.uAtmosphereDayColor.value.set(earthParameters.atmosphereDayColor)
        atmosphere.material.uniforms.uAtmosphereDayColor.value.set(earthParameters.atmosphereDayColor)
    })

gui.addColor(earthParameters, 'atmosphereTwilightColor')
    .onChange(() => {
        earth.material.uniforms.uAtmosphereTwilightColor.value.set(earthParameters.atmosphereTwilightColor)
        atmosphere.material.uniforms.uAtmosphereTwilightColor.value.set(earthParameters.atmosphereTwilightColor)
    })

// Textures
const earthDayTexture = textureLoader.load('./earth/day.jpg')
earthDayTexture.colorSpace = THREE.SRGBColorSpace
earthDayTexture.anisotropy = 8 // 避免球体两极地区采样模糊

const earthNightTexture = textureLoader.load('./earth/night.jpg')
earthNightTexture.colorSpace = THREE.SRGBColorSpace
earthNightTexture.anisotropy = 8

const earthSpecularCloudsTexture = textureLoader.load('./earth/specularClouds.jpg')
earthSpecularCloudsTexture.anisotropy = 8

// Mesh
const earthGeometry = new THREE.SphereGeometry(2, 64, 64)
const earthMaterial = new THREE.ShaderMaterial({
    vertexShader: earthVertexShader,
    fragmentShader: earthFragmentShader,
    uniforms:
    {
        // uniforms - texture
        uDayTexture: new THREE.Uniform(earthDayTexture),
        uNightTexture: new THREE.Uniform(earthNightTexture),
        uSpecularCloudsTexture: new THREE.Uniform(earthSpecularCloudsTexture),
        uSunDirection: new THREE.Uniform(new THREE.Vector3(0, 0, 1)),
        uAtmosphereDayColor: new THREE.Uniform(new THREE.Color(earthParameters.atmosphereDayColor)),
        uAtmosphereTwilightColor: new THREE.Uniform(new THREE.Color(earthParameters.atmosphereTwilightColor))
    }
})
const earth = new THREE.Mesh(earthGeometry, earthMaterial)
scene.add(earth)

const atmosphereMaterial = new THREE.ShaderMaterial({
    vertexShader: atmosphereVertexShader,
    fragmentShader: atmosphereFragmentShader,
    uniforms: {
        uSunDirection: new THREE.Uniform(new THREE.Vector3(0, 0, 1)),
        uAtmosphereDayColor: new THREE.Uniform(new THREE.Color(earthParameters.atmosphereDayColor)),
        uAtmosphereTwilightColor: new THREE.Uniform(new THREE.Color(earthParameters.atmosphereTwilightColor))
    },
    side: THREE.BackSide,
    transparent: true,
})
const atmosphere = new THREE.Mesh(earthGeometry, atmosphereMaterial)
atmosphere.scale.set(1.04, 1.04, 1.04)
scene.add(atmosphere)

// Sun
const sunSpherical = new THREE.Spherical(1, Math.PI / 2, 0) // 球面坐标
const sunDirecion = new THREE.Vector3()

const debugSun = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.1, 2), // 二十面体，的基础上添加更多三角形，用于高效的球体
    new THREE.MeshBasicMaterial({ wireframe: false })
)
scene.add(debugSun)

// Light
/**
 * https://threejs.org/examples/#webgl_lensflares
 * https://github.com/mrdoob/three.js/blob/dev/examples/webgl_lensflares.html
 */
const light = new THREE.PointLight(0xffffff, 1.5);
scene.add(light);
const textureFlare0 = textureLoader.load('./lenses/lensflare0.png');
const textureFlare1 = textureLoader.load('./lenses/lensflare1.png');
const lensflare = new Lensflare();
lensflare.addElement(new LensflareElement(textureFlare0, 200, 0, light.color));
lensflare.addElement(new LensflareElement(textureFlare1, 60, 0.6));
lensflare.addElement(new LensflareElement(textureFlare1, 70, 0.7));
lensflare.addElement(new LensflareElement(textureFlare1, 120, 0.9));
lensflare.addElement(new LensflareElement(textureFlare1, 70, 1));
light.add(lensflare);

const updateSun = () => {
    sunDirecion.setFromSpherical(sunSpherical)
    debugSun.position
        .copy(sunDirecion)
        .multiplyScalar(5)

    light.position
        .copy(sunDirecion)
        .multiplyScalar(5)

    earth.material.uniforms.uSunDirection.value.copy(sunDirecion)
    atmosphere.material.uniforms.uSunDirection.value.copy(sunDirecion)
}

updateSun()

// GUI - tweaks
gui.add(sunSpherical, 'phi')
    .min(0)
    .max(Math.PI)
    .onChange(updateSun)

gui.add(sunSpherical, 'theta')
    .min(-Math.PI)
    .max(Math.PI)
    .onChange(updateSun)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
    pixelRatio: Math.min(window.devicePixelRatio, 2)
}

window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    sizes.pixelRatio = Math.min(window.devicePixelRatio, 2)

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(sizes.pixelRatio)
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(25, sizes.width / sizes.height, 0.1, 1000)
camera.position.x = 12
camera.position.y = 5
camera.position.z = 4
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true, // for lensflare
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(sizes.pixelRatio)
renderer.setClearColor('#000011')

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () => {
    const elapsedTime = clock.getElapsedTime()

    earth.rotation.y = elapsedTime * 0.1

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()