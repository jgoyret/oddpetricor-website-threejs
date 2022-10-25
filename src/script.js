import './style.css'
import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { GUI } from 'dat.gui'
import Stats from 'three/examples/jsm/libs/stats.module'
import { VideoTexture } from 'three'

//VARIABLES GLOBALRES
const gui = new GUI()
const canvas = document.querySelector('canvas.webgl')
const body_ = document.body
const scene = new THREE.Scene()
const width = window.innerWidth
const height = window.innerHeight
const camera = new THREE.PerspectiveCamera(
    75,
    width / height,
    0.001,
    2000
)

const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true
})


const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true

const color_back = 0x91407
const light = new THREE.PointLight(0xff0000, 10)
const light_master = new THREE.DirectionalLight(0xffffff)
scene.add(light_master)

//MATERIALES+TEXTURAS
//let material_esfera = new THREE.MeshStandardMaterial()

// MODELOS 3D 
let mixer
const loader_viscoso = new GLTFLoader()
const loader_viscoso_suelo = new GLTFLoader()
let viscoso
let esferas = []
let cantidad_esferas = 2000
let min_esferas = -40
let max_esferas = 40
let min_radius_esferas = 0.01
let max_radius_esferas = 1

const clock = new THREE.Clock()
let clock2

const stats = Stats()
const camera_GUI = gui.addFolder('Camera')
const other_GUI = gui.addFolder('Other')
const param_gui = {
    color: color_back
}

//ANIMATIONS PARAMETERS
let learp_ = 0
let vector_learp = new THREE.Vector3(0, 0, 0)
let shake = false


//sonido 

let listener_audio, sound_centro

// RAYCASTER
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();



//Calcular posicion mouse para RayCast
const onPointerMove = (event) => {

    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;

}


//Agregar mapa de ambiente
const addEnvMap = () => {

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    const rgbeLoader = new RGBELoader()
    rgbeLoader.load('/EnvMap/nigth.hdr', function (texture) {

        const envMap = pmremGenerator.fromEquirectangular(texture).texture

        //scene.background = envMap
        scene.environment = envMap
        scene.fog = new THREE.Fog(color_back, 1, 25);

        texture.dispose()
        pmremGenerator.dispose()
    })

}


//Sonido Musica posicional

const sonido = () => {

    // create an AudioListener and add it to the camera
    listener_audio = new THREE.AudioListener();
    camera.add(listener_audio);

    // create the PositionalAudio object (passing in the listener)
    sound_centro = new THREE.PositionalAudio(listener_audio);

    // load a sound and set it as the PositionalAudio object's buffer
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load('sonido/squizomismo.ogg', function (buffer) {
        sound_centro.setBuffer(buffer);
        sound_centro.setRefDistance(5);
        //sound_centro.play();
    });

}

//INICIO 
const init = () => {

    scene.background = new THREE.Color(color_back)
    scene.add(camera)
    camera.position.set(0, 3, 7)
    addEnvMap()
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.physicallyCorrectLights = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.6


    light_master.position.set(1, 0.5, 1)
    light_master.intensity = 1


    scene.add(light)
    light.position.set(50, 50, 50)
    light.castShadow = true


    for (let i = 0; i < cantidad_esferas; i++) {

        esferas[i] = new THREE.Mesh(
            new THREE.SphereBufferGeometry(Math.random() * (max_radius_esferas - min_radius_esferas) + min_radius_esferas, 16, 16),
            new THREE.MeshStandardMaterial({
               // map: textura_video,
                metalness: 1,
                roughness: 0.2
            })
        )
        esferas[i].position.set(
            Math.random() * (max_esferas - min_esferas) + min_esferas,
            Math.random() * (max_esferas - min_esferas) + min_esferas,
            Math.random() * (max_esferas - min_esferas) + min_esferas)
        scene.add(esferas[i])

    }




    //  material_esfera.matcap = matcap
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('resize', onWindowResize);

    window.addEventListener('dblclick', () => {

        const fullscreenElement = document.dullscreenElement || document.webkitFullscreenElement


        if (!fullscreenElement) {
            if (body_.requestFullscreen) {
                body_.requestFullscreen()
            }
            else if (body_.webkitRequestFullscreen) {
                body_.webkitRequestFullscreen()
            }

        } else {
            if (body_.exitFullscreen) {
                body_.exitFullscreen()
            }
            else if (body_.webkitExitFullscreen) {
                body_.webkitExitFullscreen()
            }
        }

    })

}


//mODELO 3D CENTRAL OBJETO
const viscosos = () => {
    loader_viscoso.load(
        // resource URL
        './viscoso.glb',
        // called when the resource is loaded
        function (glb) {

            viscoso = glb.scene;
            scene.add(viscoso);

            viscoso.scale.set(1, 1, 1);
            viscoso.position.set(0, 0, 0);

            viscoso.traverse(function (node) {

                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                }

            });



            /* Descomentar para activar animacion

            mixer = new THREE.AnimationMixer(viscoso);
            const action = mixer.clipAction(glb.animations[0]);
            action.play();*/

        },
        // called while loading is progressing
        function (xhr) {

            console.log((xhr.loaded / xhr.total * 100) + '% loaded');

        },
        // called when loading has errors
        function (error) {

            console.log('An error happened');

        }
    );

    loader_viscoso_suelo.load(
        // resource URL
        './suelo_viscoso.glb',
        // called when the resource is loaded
        function (glb) {

            const viscoso_suelo = glb.scene;
            scene.add(viscoso_suelo);

            viscoso_suelo.scale.set(1, 1, 1);
            viscoso_suelo.position.set(0, 0, 0);
            viscoso_suelo.add(sound_centro)

            viscoso_suelo.traverse(function (node) {

                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                }

            });



        },
        // called while loading is progressing
        function (xhr) {

            console.log((xhr.loaded / xhr.total * 100) + '% loaded');

        },
        // called when loading has errors
        function (error) {

            console.log('An error happened');

        }
    );


}


//cONTROL DE HTML PARA INTERACCION CON WEBGL
const gui_html = () => {

    let button_1 = document.querySelector('#first_button')
    let button_2 = document.querySelector('#second_button')
    let input_txt = document.querySelector('#fgiveme')
    const submit_button = document.getElementById('submit_button');

    let f_boton_1 = () => {
        //button_1.disabled = true
        learp_ = 0.005
        vector_learp = new THREE.Vector3(2, 5.2, -0.9)

    }
    button_1.addEventListener('click', f_boton_1)

    let f_boton_2 = () => {
        //button_1.disabled = true
        learp_ = 0.005
        vector_learp = new THREE.Vector3(0, 0, 0)

    }
    button_2.addEventListener('click', f_boton_2)


    let submitboton = () => {
        console.log("hola submit boton")
        clock2 = new THREE.Clock()
        if (input_txt.value == 'movete') {
            shake = true
        }

        input_txt.value = ''
    }

    submit_button.addEventListener('click', submitboton)



}


//GUI DEBUG
const gui_stats = () => {
    camera_GUI.add(camera.position, 'x', -20, 20)
    camera_GUI.add(camera.position, 'y', -20, 20)
    camera_GUI.add(camera.position, 'z', -20, 20)
    camera_GUI.open()

    other_GUI
        .addColor(param_gui, 'color')
        .onChange(() => {
            scene.background = new THREE.Color(param_gui.color)
        })

    document.body.appendChild(stats.dom)
}


//CONFIGURACION PARA ACOMODAR RESOLUCION AL CAMBIAR TAMAÑO DE LA VENTANA
function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}

//INTERACCION CON OBJETOS MEDIANTE RAYCAST
const interact_esferas = () => {
    raycaster.setFromCamera(pointer, camera);

    const intersects = raycaster.intersectObjects(scene.children);
    for (let i = 0; i < intersects.length; i++) {
        intersects[i].object.material.color.set(0xff0000);
        window.addEventListener('click', () => {

            if (intersects[i].object.position.distanceTo(camera.position) < 11) {

                console.log(intersects[i].object.position.distanceTo(camera.position))
                vector_learp = intersects[i].object.position
                learp_ = 0.01

            }


        })
    }
}

//QUE PASA AL NO INTERACTUAR CON RAYCASTS HOVER
const no_interact_esferas = () => {
    for (let i = 0; i < cantidad_esferas; i++) {

        esferas[i].material.color.set(0xffffff)
    }
}

//FUNCION ANIMATE-UPDATE
const animate = () => {


    requestAnimationFrame(animate)

    //RAYCAST UPDATE
    no_interact_esferas()
    interact_esferas()
    camera.lookAt(new THREE.Vector3(0, 4, 0))

    camera.position.lerp(vector_learp, learp_)

    if (shake) {

        for (let i = 0; i < cantidad_esferas; i++) {

            esferas[i].position.x += Math.sin(Math.random() * (0.01 - (-0.01)) + (-0.01)) * clock2.getElapsedTime()
            esferas[i].position.y += Math.sin(Math.random() * (0.01 - (-0.01)) + (-0.01)) * clock2.getElapsedTime()
            esferas[i].position.z += Math.sin(Math.random() * (0.01 - (-0.01)) + (-0.01)) * clock2.getElapsedTime()

        }

    }

    renderer.render(scene, camera)
    controls.update()
    stats.update()

}


//FUNCIONES
sonido()
init()
gui_stats()
gui_html()
viscosos()
animate()



