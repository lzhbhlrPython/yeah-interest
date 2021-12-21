import * as THREE from "https://threejs.org/build/three.module.js";
import { OrbitControls } from "https://threejs.org/examples/jsm/controls/OrbitControls.js";
import { RGBELoader } from 'https://threejs.org/examples/jsm/loaders/RGBELoader.js';
import { Geometry } from 'https://threejs.org/examples/jsm/deprecated/Geometry.js';
import { RoundedBoxGeometry } from 'https://threejs.org/examples/jsm/geometries/RoundedBoxGeometry.js';




class ScreenCaptureApp {

	constructor() {

		this.captureStarted = false;


		this.initThree();
	}

	initThree() {

		this.scene = new THREE.Scene();
		this.renderer = new THREE.WebGLRenderer({antialias:true});
		this.camera = new THREE.PerspectiveCamera(45, innerWidth/innerHeight, 0.1, 100);
		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.setSize(innerWidth, innerHeight);
		Object.assign(this.renderer.domElement.style, {
			position:'fixed',
			top:0,
			left:0
		});
		this.camera.position.set(0,1,2);
		this.camera.lookAt(new THREE.Vector3());
		this.renderer.setClearColor(0x8000ff);

		this.sceneRoot = new THREE.Object3D();
		this.scene.add(this.sceneRoot);
		this.sceneRoot.rotation.y = -30/57;



		// this.scene.add(new THREE.GridHelper(10,10));
		this.makeMonitor();
		this.makeTable();
		this.makeMouse();
		this.makeKeyboard();
		this.controls = new OrbitControls(this.camera, this.renderer.domElement);
		document.body.appendChild(this.renderer.domElement);
		this.renderer.setAnimationLoop(e=>this.update(e));
		this.initHDR();
		this.pointer = new THREE.Vector2();
		this.raycaster = new THREE.Raycaster();
		window.addEventListener('mousemove', e=>this.onMouseMove(e));
		window.addEventListener('mousedown', e=>this.onMouseDown(e));
		window.addEventListener('mouseup', e=>this.onMouseUp(e));
	}
	onMouseMove(e) {
		this.pointer.set(e.clientX/innerWidth*2-1, 1-2*e.clientY/innerHeight);
	}


	onMouseDown(e) {
		// console.log(e.buttons);
		console.log(this.leftButton.rotation.x);
		if(e.button==0) {
			this.leftButton.rotation.x =-Math.PI;
		} else if(e.button==2) {
			this.rightButton.rotation.x =0;

		}
	}

	onMouseUp(e) {
		if(e.button==0) {
			this.leftButton.rotation.x = -Math.PI+0.05;
		} else if(e.button==2) {
			this.rightButton.rotation.x =0.05;

		}
		this.raycaster.setFromCamera( this.pointer, this.camera );
		var intersects = this.raycaster.intersectObjects( [this.screen], false );
		if(intersects[0]!=null && !this.captureStarted) {

			this.initCapture();
		}
	}



	makeMouse() {

		this.mousePivot = new THREE.Object3D();
		this.sceneRoot.add(this.mousePivot);
		this.mouse = new THREE.Mesh(new RoundedBoxGeometry(0.1, 0.1, 0.09, 4, 0.045), new THREE.MeshStandardMaterial({color:0x404040, roughness:0.3}));
		this.mousePivot.add(this.mouse);
		this.mousePivot.position.set(0.75, -0.3525, 0);
		this.mouse.scale.y = 0.5;
		this.mouse.scale.z = 2;

		//let's make a button! It's a sphere, half a turn in theta and phi.
		var rightButton = new THREE.Mesh(
			new THREE.SphereGeometry(0.048,8,8, 0, Math.PI/2, 0, Math.PI/2),
			new THREE.MeshStandardMaterial({color:0x606060, roughness:0.2})
			);
		this.mousePivot.add(rightButton);
		rightButton.rotation.y = Math.PI;
		rightButton.scale.set(1,0.5, 1.9);

		rightButton.position.set(0.0042013, 0.003484, -0.00073);

		var leftButton = rightButton.clone();
		leftButton.scale.x*=-1;
		leftButton.position.x*=-1;
		this.mousePivot.add(leftButton);

		this.leftButton = leftButton;
		this.rightButton = rightButton;


		//let's make this cable!




		var cableEnd = new THREE.Mesh(new THREE.PlaneGeometry(Math.PI*2, 1, 12,30),


		this.bezierSausageMaterial()
		);
		var p1L = new THREE.Object3D();
		cableEnd.add(p1L);
		var p2L = new THREE.Object3D();
		cableEnd.add(p2L);
		var p3L = new THREE.Object3D();
		cableEnd.add(p3L);
		var p4L = new THREE.Object3D();
		cableEnd.add(p4L);
		cableEnd.material.uniforms.r.value = 0.005
		this.sceneRoot.add(cableEnd);
		cableEnd.position.x = 0.4;
		cableEnd.position.y = -0.35;
		cableEnd.rotation.x = Math.PI/2;

		this.leftButton.rotation.x = -Math.PI+0.05;
		this.rightButton.rotation.x =0.05;

		cableEnd.material.uniforms.p3.value.set(0.1,-0.65);
		cableEnd.material.uniforms.p4.value.set(-0.1,-0.35);

		window.addEventListener('mousemove', e=>{
			this.mousePivot.rotation.y = -(e.clientX-innerWidth/2)/2000;
			this.mousePivot.position.x = 0.55+0.0002*e.clientX;
			this.mousePivot.position.z = 0.1+0.0002*e.clientY;
			p1L.position.copy(cableEnd.worldToLocal(this.mousePivot.localToWorld(new THREE.Vector3(0,0,-0.05))));
			p2L.position.copy(cableEnd.worldToLocal(this.mousePivot.localToWorld(new THREE.Vector3(0,0,-0.3))));
			cableEnd.material.uniforms.p1.value.copy(p1L.position);
			cableEnd.material.uniforms.p2.value.copy(p2L.position);
			// p1L.position.set(0.1*Math.sin(performance.now()/1000),0,0);
			// p2L.position.set(0.1*Math.sin(performance.now()/1000),0,0);

		});

	}

	makeKeyboard() {

		var keysPivot = new THREE.Object3D();
		var keys = ["`1234567890-=","QWERTYUIOP[]","ASDFGHJKL;'","ZXCVBNM<>/"];
		//let's make each of the keys!
		this.keyMap = {};
		var keySize = 0.025;
		keys.forEach((row,rowNum)=>{
			row.split("").forEach((keyChar,keyNum,rowArray)=>{
				var key = this.makeKey(keyChar);
				this.keyMap[keyChar] = key;
				keysPivot.add(key);
				key.position.x = keySize * (keyNum-rowArray.length/2);
				key.position.z = keySize * (rowNum-keys.length/2);
			});
		});
		var spacebar =this.makeKey(" ", 6);
		keysPivot.add(spacebar);
		spacebar.position.z = keySize*2;

		this.keyMap[String.fromCharCode(32)] = spacebar;
		var keyboardBase = new THREE.Mesh(new RoundedBoxGeometry(0.38, 0.02, 0.15,3, 0.004),
		new THREE.MeshStandardMaterial({color:0x808080}));
		keyboardBase.position.y = -0.01;
		keyboardBase.position.x = -0.01;

		let oG = new Geometry().fromBufferGeometry(keyboardBase.geometry);
		oG.vertices.forEach(v=>{
			v.x *= 1-0.2*(v.z+0.075)/0.15;
		});
		oG.mergeVertices();
		oG.computeVertexNormals();
		keyboardBase.geometry = oG.toBufferGeometry();


		keysPivot.add(keyboardBase);

		keyboardBase = keyboardBase.clone();
		keysPivot.add(keyboardBase);
		keyboardBase.scale.multiplyScalar(0.95);
		keyboardBase.rotation.x = -0.1;
		keyboardBase.position.y = -0.018;


		const keyboardShadow = this.makeShadow();
		keyboardShadow.scale.set(0.88, 0.30,1);
		keyboardShadow.position.set(-0.0025, -0.0050, -0.0175);
		oG = new Geometry().fromBufferGeometry(keyboardShadow.geometry);
		oG.vertices.forEach(v=>{
			v.x *= 1-0.3*(0.5-v.y);
		});
		oG.mergeVertices();
		oG.computeVertexNormals();
		keyboardShadow.geometry = oG.toBufferGeometry();
		keyboardBase.add(keyboardShadow);

		keysPivot.position.z = 0.29;
		keysPivot.position.y = -0.34;
		keysPivot.rotation.x = 0.1;;
		window.addEventListener('keydown', e=>{
			// console.log(e.keyCode);
			var target = this.keyMap[String.fromCharCode(e.keyCode)];
			if(target!=null) {
				target.position.y = -0.003;
			}
		});
		window.addEventListener('keyup', e=>{
			var target = this.keyMap[String.fromCharCode(e.keyCode)];
			if(target!=null) {
				target.position.y = 0;
			}


		});
		this.sceneRoot.add(keysPivot);
	}

	makeKey(letter, charWidth = 1) {
		var c = document.createElement('canvas');
		c.width = c.height = 32;
		var g = c.getContext('2d')
		g.fillStyle = "white";
		g.fillRect(0,0,1024, 1024);
		g.fillStyle = "black";
		g.font = "30px Arial";
		var w = g.measureText(letter).width;
		g.fillText(letter, 16-w/2, 28);
		this.keyGeos = this.keyGeos || {};
		var keyGeo = this.keyGeos[charWidth] = this.keyGeos[charWidth] || new RoundedBoxGeometry(0.02 * charWidth, 0.01,0.02, 3, 0.003 );
		this.keyMat = this.keyMat || new THREE.MeshStandardMaterial({color:0x808080, roughness:0.2});
		var keyMesh = new THREE.Mesh(keyGeo,this.keyMat );

		var keyCapMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.016, 0.016), new THREE.MeshStandardMaterial({
			transparent:true,
			blending:THREE.MultiplyBlending,
			map: new THREE.CanvasTexture(c)

		}));
		keyMesh.add(keyCapMesh);
		keyCapMesh.rotation.x = -Math.PI/2;
		keyCapMesh.position.y = 0.005+0.0001;
		return keyMesh;
	}

	makeTable() {

		var tableTop = new THREE.Mesh(new RoundedBoxGeometry(2, 0.05, 0.8, 4, 0.010),
		new THREE.MeshStandardMaterial({color:0x080200,
			normalScale:new THREE.Vector2(0.5, 0.5),
			normalMap:this.getWoodTexture(),
			roughness:0.4}));
		tableTop.material.normalMap.wrapS = tableTop.material.normalMap.wrapT = THREE.RepeatWrapping;
		tableTop.material.normalMap.repeat.setScalar(3);
		var underTop = new THREE.Mesh(new RoundedBoxGeometry(2-0.025, 0.05, 0.8-0.025, 4, 0.010),
		new THREE.MeshStandardMaterial({roughness:0, metalness:1}));
		tableTop.add(underTop);
		underTop.position.y = -0.045;
		this.sceneRoot.add(tableTop);
		tableTop.position.y = -0.39;
		var leg = new THREE.Mesh(
			new THREE.CylinderGeometry(0.03, 0.03, 0.77, 32),
			new THREE.MeshStandardMaterial({roughness:0.1, metalness:1}));
			tableTop.add(leg);
		leg.position.y = -0.77/2;
		var inset = 0.1;
		leg.position.x = 2/2-inset;
		leg.position.z = 0.8/2-inset;
		leg = leg.clone();
		leg.position.x *=-1;
		tableTop.add(leg);
		leg = leg.clone();
		leg.position.z*=-1;

		tableTop.add(leg);
		leg = leg.clone();
		leg.position.x*=-1;
		tableTop.add(leg);

	}

	getLogo(text) {
		var c = document.createElement('canvas');
		c.width = 1024;
		c.height = 128;
		var g= c.getContext('2d');
		g.fillRect(0,0, 1024, 128);
		g.fillStyle = "white";
		g.font = "90px Arial Black";
		g.fillText(text, 10, 100);
		return new THREE.CanvasTexture(c);
	}

	makeMonitor() {
		var theta = Math.PI/8;
		var aspect = window.screen.width/window.screen.height;

		var screenPivot = new THREE.Object3D();
		screenPivot.rotation.y = Math.PI/2;
		screenPivot.position.z = 0.065;
		screenPivot.scale.multiplyScalar(0.65);
		this.sceneRoot.add(screenPivot);
		screenPivot.position.y = 0.055;



		var machineBase = new THREE.Mesh(new RoundedBoxGeometry(.5, .19, 0.7, 4, 0.01),
		new THREE.MeshStandardMaterial({color:0x808080,
			roughness:0.5,
		normalMap:this.noiseNormal()
		}));

		//we need at least to put the Inceptron 32x on the front!



		var frontLabel = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.035),
		new THREE.MeshStandardMaterial({
			transparent:true,
			metalness:1,
			roughness:0,
			alphaMap:this.getLogo("Inceptron 32x"),
			 wireframe:false}));
		machineBase.add(frontLabel);
		frontLabel.position.x = -0.2655;
		frontLabel.position.y = -0.065;
		frontLabel.position.z = 0.19;
		frontLabel.rotation.y = -Math.PI/2;
		frontLabel.rotation.x = Math.PI;


		var screenLabel = frontLabel.clone();
		screenLabel.material = screenLabel.material.clone();
		screenLabel.material.alphaMap = this.getLogo("SEEK");
		screenLabel.material.color = new THREE.Color(0x404040);
		machineBase.add(screenLabel);
		screenLabel.position.y-=0.095;
		screenLabel.position.x+=0.09;
		screenLabel.position.z-=0.29;

		var foot = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.1, 32), new THREE.MeshStandardMaterial({color:0}));
		foot.position.set(0.25-0.03,(0.19/2), 0.35-0.03);
		machineBase.add(foot);
		foot = foot.clone();
		foot.position.x*=-1;
		machineBase.add(foot);
		foot = foot.clone();
		foot.position.z*=-1;
		machineBase.add(foot);
		foot = foot.clone();
		foot.position.x*=-1;
		machineBase.add(foot);
		machineBase.rotation.x = Math.PI;


		var machineFront = new THREE.Mesh(new RoundedBoxGeometry(0.03, .19+0.01, 0.7+0.01, 4, 0.005),
		new THREE.MeshStandardMaterial({color:0x808080, roughness:0.2, metalness:0}));
		machineFront.position.x = -0.25;
		machineBase.add(machineFront);


		//let's make some fake ground shadows:
		const screenShadow = this.makeShadow();
		screenShadow.scale.set(0.88, 0.8,1);
		screenShadow.position.set(0.3, -0.3435, -0.0375);
		screenPivot.add(screenShadow);
		var machineShadow = screenShadow.clone();
		machineShadow.scale.multiplyScalar(2.4);
		machineShadow.position.y -=0.302;
		machineShadow.position.z -=0.05;
		machineShadow.position.x -=0.05;
		machineShadow.scale.x*=0.8;

		screenPivot.add(machineShadow);
		var machineBack = new THREE.Mesh(new RoundedBoxGeometry(0.03, .19-0.03, 0.7-0.03, 4, 0.005),
		new THREE.MeshStandardMaterial({color:0x808080, roughness:0.2, metalness:1}));
		machineBack.position.x = 0.25;
		machineBase.add(machineBack);


		var drive = new THREE.Mesh(new RoundedBoxGeometry(0.03, 0.07, 0.25, 4, 0.005),
		new THREE.MeshStandardMaterial({color:0x808080, roughness:0.2, metalness:0}));
		drive.position.x = -0.26;
		drive.position.z = -0.2;
		drive.position.y = 0.037;
		machineBase.add(drive);
		drive = drive.clone();
		drive.position.y *=-1;
		machineBase.add(drive);


		screenPivot.add(machineBase);
		machineBase.position.y = -0.49;
		machineBase.position.x = 0.24;
		machineBase.scale.multiplyScalar(1/0.65);
		var frameThickness = 0.4;

		//let's make the shape from curveTos!
		var xo = aspect+frameThickness;
		var yo = 1+frameThickness;

		var r = 0.4;
		var f = 0.5;



		var framePath = this.roundRectPath(xo, yo, r,f);


		var hole = new THREE.Shape([ new THREE.Vector2(-1*aspect,-1), new THREE.Vector2(1*aspect,-1),
					 new THREE.Vector2(1*aspect,1), new THREE.Vector2(-1*aspect,1)]);
		framePath.holes = [hole];

		const extrudeSettings = {
			steps:4,
			depth:0.6,
			bevelEnabled:true,
			bevelThickness:0.1,
			bevelSize:0.1,
			bevelOffset:-0.08
		};
		var extrudeGeo = new THREE.ExtrudeGeometry(framePath, extrudeSettings);

		let oG = new Geometry().fromBufferGeometry(extrudeGeo);
     	oG.mergeVertices();
		oG.computeVertexNormals();
		extrudeGeo = oG.toBufferGeometry();

		var back = new THREE.Mesh(new RoundedBoxGeometry(aspect+ frameThickness/2, 1+ frameThickness/2, 1.5,





		4, 0.1), new THREE.MeshStandardMaterial({roughness:0.4, color:0x080808}));
		oG = new Geometry().fromBufferGeometry(back.geometry);

		oG.vertices.forEach(v=> {

			v.multiplyScalar(Math.max(Math.min(1,1-v.z/2),0));

		});

     	oG.mergeVertices();
		oG.computeVertexNormals();
		back.geometry = oG.toBufferGeometry();
		back.rotation.y = Math.PI/2;
		back.position.x = 0.4;
		back.scale.setScalar(0.4);
		screenPivot.add(back);

		var plastic = new THREE.MeshStandardMaterial({color:0x101010, roughness:0.4});
		var monitorBase = new THREE.Mesh(new THREE.CylinderGeometry(.7,.7, 1.2, 32), plastic);
		var pivotBase = new THREE.Mesh(new RoundedBoxGeometry(2,0.2, 2, 4, 0.03), plastic);
		monitorBase.add(pivotBase);
		pivotBase.position.y = -0.7;
		screenPivot.add(monitorBase);
		monitorBase.scale.setScalar(0.2);
		monitorBase.position.x = .3;
		monitorBase.position.y = -.2;

		var screenFrame = new THREE.Mesh(extrudeGeo, plastic);
		screenFrame.scale.multiplyScalar(0.205);
		screenFrame.rotation.y = Math.PI/2;
		// screenFrame.position.x = 0.5;
		screenPivot.add(screenFrame);

		var screen = this.screen = new THREE.Mesh(new THREE.SphereGeometry(1, 32,32,
		-theta/2*aspect, theta*aspect,
		Math.PI/2-theta/2, theta

		), new THREE.ShaderMaterial({

			transparent:true,
			depthWrite:false,
			blending:THREE.AdditiveBlending,
			vertexShader:`
				varying vec2 vUV;
				void main() {

					gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
					vUV = uv;
				}

			`,
			fragmentShader:`
				varying vec2 vUV;
				uniform float time;

				uniform sampler2D monitorTexture;

				void main() {

					gl_FragColor.r = texture2D(monitorTexture, vUV+vec2(0.001,0.0)).r;
					gl_FragColor.g = texture2D(monitorTexture, vUV+vec2(0.00,0.0)).g;
					gl_FragColor.b = texture2D(monitorTexture, vUV+vec2(-0.001,0.0)).b;
					gl_FragColor.a = 1.0;
					// gl_FragColor.rgb *= 0.9+0.1*sin(vUV.x*950.0);
					gl_FragColor+=0.3;
					gl_FragColor.rgb *= 0.8+0.2*sin(vUV.y*450.0+time*30.);
				}

			`,

			uniforms: {
				time:{value:0},
				monitorTexture:{value:this.bootTexture()}
				// monitorTexture:{value:this.randomTex()}
			}

		}));
		screen.position.x = 1;
		screen.onBeforeRender = ()=>{
			screen.material.uniforms.time.value = (performance.now()/1000);
		};
		screenPivot.add(screen);

		theta*=1.1;

		var screenBack = new THREE.Mesh(new THREE.SphereGeometry(0.99,32,32,
		-theta/2*aspect, theta*aspect,
		Math.PI/2-theta/2, theta
		),new THREE.MeshStandardMaterial({
			color:0,
		roughness:0}));


		screenBack.position.x = 1;
		screenPivot.add(screenBack);
	}

	bezierSausageMaterial() {
		const color = new THREE.Color(0x0684ff);
		return new THREE.ShaderMaterial({
			vertexShader:`
			uniform vec2 p1;
			uniform vec2 p2;
			uniform vec2 p3;
			uniform vec2 p4;
			uniform float r;
			varying vec3 vNormal;

			vec2 pointAtT(in float t) {
				float f = 1.0-t;

				float t3  = 1. * t*t*t;
				float t2f = 3. * t*t*f;
				float tf2 = 3. * t*f*f;
				float f3  = 1. * f*f*f;

				return  f3 * p1 +
						tf2 * p2 +
						t2f * p3 +
						t3 * p4;
			}

			vec2 tangentAtT(in float t) {
				float f = 1.-t;

				float t2 = 1.*t*t;
				float tf = 2.*t*f;
				float f2 = 1.*f*f;

				vec2 p12 = p2-p1;
				vec2 p23 = p3-p2;
				vec2 p34 = p4-p3;

				return  f2 * p12 +
						tf * p23 +
						t2 * p34;
			}

			void main() {

				vec3 vPosition = position;
				pointAtT(vPosition.y);

				vec3 ptT = vec3(pointAtT(vPosition.y+0.5), 0.);

				vec2 tan2D = tangentAtT(vPosition.y+0.5);
				vec3 tan3D = (vec3(tan2D,0.));
				vec3 normal3D = r*normalize(vec3(-tan2D.y, tan2D.x, 0.));
				vec3 z = vec3(0.,0., -r);
				vec3 outCrop = sin(vPosition.x)*normal3D + cos(vPosition.x) * z;
				vPosition = ptT+ outCrop;


				vec3 e = normalize( vec3( modelViewMatrix * vec4( vPosition, 1.0 ) ) );
				vec3 n = normalize( normalMatrix * normalize(outCrop) );

				vec3 r = reflect( e, n );
				vNormal = r.xyz;


				gl_Position = projectionMatrix * modelViewMatrix * vec4(vPosition,1.);

			}
			`,

			fragmentShader:`
				uniform vec3 color;
				varying vec3 vNormal;
				void main() {
					vec3 color = dot(vNormal, vec3(0., 1.0, 0.0)) * vec3(1.0)
							   + abs(dot(vNormal, vec3(1., -1.0, 0.0)))* vec3(1.0, 0.5, 0.0);
					gl_FragColor = vec4(color,1.);
				}
			`,

			uniforms: {
					r:{value:0.05},
					color:{value:new THREE.Vector3(color.r,color.g,color.b)},
					p1:{value:new THREE.Vector2(0,0)},
					p2:{value:new THREE.Vector2(0,0.33)},
					p3:{value:new THREE.Vector2(0,0.66)},
					p4:{value:new THREE.Vector2(0,1)}
			},

			side:THREE.DoubleSide,

			// blending: THREE.CustomBlending,
			// blendEquation: THREE.MaxEquation,

			wireframe:false,

		});
}

	noiseNormal() {
		var c = document.createElement('canvas');
		c.width = c.height = 512;
		var g = c.getContext('2d');
		const src = g.getImageData(0,0, c.width, c.height);
		for(var i=0;i<src.data.length;i+=4) {
			src.data[i+0] = src.data[i+1] = src.data[i+2] = 255*Math.random();
			src.data[i+3] = 255;
		}
		g.putImageData(src, 0,0);
		// document.body.appendChild(c);
		c.style.width = "800px";
		return new THREE.CanvasTexture(this.bumpToNormal(g,c,1,0.2));
	}


	makeShadow() {
		var c = document.createElement('canvas');
		c.width = c.height = 1024;
		var g = c.getContext('2d')
		g.fillStyle = "white";
		g.fillRect(0,0,1024, 1024);
		g.shadowColor = "black";

		g.fillStyle = "black";
		for(var i =1;i<512;i*=2) {

			g.shadowBlur = i;
			g.fillRect(256,256,512,612);
		}
		g.shadowColor = "none";
		g.fillStyle = "rgba(255,255,255,0.125)";
		g.fillRect(0,0,1024, 1024);

		var plane = new THREE.Mesh(new THREE.PlaneGeometry(1,1,4,4),
		new THREE.MeshStandardMaterial({
			transparent:true,
			depthWrite:false,
			blending:THREE.MultiplyBlending,
			map:new THREE.CanvasTexture(c)
		}
		));


		plane.rotation.x = -Math.PI/2;
		window.p = plane;
		return plane;
	}

	bootTexture() {

		var c = document.createElement('canvas');
		c.width = c.height = 1024;
		var g = c.getContext('2d')
		g.fillRect(0,0,1024, 1024);
		g.shadowColor = "white";
		g.shadowBlur = 60;
		g.fillStyle = "white";
		g.font = "80px Arial";
		g.fillText("Click screen", 220, 512-40);
		g.fillText("To go deeper", 220, 512+40);
		return new THREE.CanvasTexture(c);
	}



	randomTex() {
		var c = document.createElement('canvas');
		c.width = c.height = 1024;
		var g= c.getContext('2d');
		for(var i =0;i<100;i++) {
			g.fillStyle = `rgb(${Math.floor(Math.random()*255)}, ${Math.floor(Math.random()*255)}, ${Math.floor(Math.random()*255)})`;
			g.fillRect(Math.random()*1024, Math.random()*1024, 64,64);
		}
		var tex = new THREE.CanvasTexture(c);
		return tex;
	}

	update(e) {

		this.controls.update(e);
		this.renderer.render(this.scene, this.camera);
	}

    initHDR() {
      this.renderer.physicallyCorrectLights = true;
        this.renderer.toneMapping = THREE.LinearToneMapping;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMappingExposure  = 0.7;

      new RGBELoader()
					.setDataType( THREE.UnsignedByteType )
					.setPath( 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/' )
					.load( '2k/hotel_room_2k.hdr', texture=> {
            const pmremGenerator = new THREE.PMREMGenerator( this.renderer );
    				pmremGenerator.compileEquirectangularShader();
						const envMap = pmremGenerator.fromEquirectangular( texture ).texture;

						this.scene.background = envMap;

						this.scene.environment = envMap;
            this.worldEnvMap  = envMap;
						texture.dispose();
						pmremGenerator.dispose();
					});
    }



	getWoodMap(hue=0) {
   const c = document.createElement('canvas');
   c.width = c.height = 1024;
   const g = c.getContext('2d');
   c.style.outline = "2px solid blue";
   const grad = g.createLinearGradient(0,0,0, 1024);
   for(var i=0;i<50;i++) {

     grad.addColorStop(Math.random(), `hsl(${hue}, 0%, ${Math.floor(Math.random()*100)}%)`);
   }
   g.fillStyle = grad;
   g.fillRect(0,0,1024,1024);
   return c;
  }



  getWoodTexture() {
    var c1 = this.getWoodMap(0);

    var c2 = this.getWoodMap(0);
    var c3 = document.createElement('canvas');
    c3.width = c3.height = 1024;


    const g3 = c3.getContext('2d');
    const grad = g3.createLinearGradient(0,0,1024, 0);
    grad.addColorStop(0, "transparent");
    grad.addColorStop(0.5, "white");
    grad.addColorStop(1, "transparent");
    g3.fillStyle = grad;
    g3.fillRect(0,0,1024,1024);
    g3.globalCompositeOperation = "xor";
    g3.drawImage(c2,0,0);
    const g1 = c1.getContext('2d');
    g1.drawImage(c3,0,0);

    return new THREE.CanvasTexture(this.bumpToNormal(g1,c1, 1, 1));
  }

	bumpToNormal(g,canvas,offset=1, intensity = 1) {
    const src = g.getImageData(0,0, canvas.width, canvas.height);
    const dest = g.getImageData(0,0, canvas.width, canvas.height);


    for(var i=0;i< src.data.length;i+=4) {

        //TODO this doens't resolve over the width boundary!
        var red = (src.data[i+0]-src.data[i+4*offset])*intensity;
        var green = (src.data[i+0]-src.data[i+4*offset*canvas.width])*intensity;
        var blue = 255-Math.abs(red)-Math.abs(green);

        dest.data[i+0] = 128+red;
        dest.data[i+1] = 128+green;
        dest.data[i+2] = blue;
        dest.data[i+3] = 255;
    }

    g.putImageData(dest, 0,0);
	return canvas;
}

	async initCapture() {

		this.video = document.createElement('video');
		document.body.appendChild(this.video);
		this.video.setAttribute('width', 512);
		this.video.setAttribute('autoplay', '');
		Object.assign(this.video.style, {visibility:'hidden', position:'fixed'})

    

		this.displayMediaOptions = {
			video: {
				cursor: "always"
			},
			audio: false
		};

		this.captureStream = null;

		try {
			this.captureStream = await navigator.mediaDevices.getDisplayMedia(this.displayMediaOptions);
			this.video.srcObject = this.captureStream;
			this.captureStarted = true;
			this.screen.material.uniforms.monitorTexture.value = new THREE.VideoTexture(this.video);
		} catch(err) {
			console.error("Error: " + err);
		}
		return this.captureStream;
	}


	roundRectPath(xo, yo, r,f) {
		var framePath = new THREE.Shape();
		framePath.moveTo(       xo-r,     yo);
		framePath.bezierCurveTo(xo-r*f,   yo,
								xo, 	  yo-r*f,
								xo, 	  yo-r);

		framePath.lineTo(		 xo, 	 -yo+r);
		framePath.bezierCurveTo( xo,  	 -yo+r*f,
								 xo-r*f, -yo,
								 xo-r,   -yo);

		framePath.lineTo(       -xo+r,   -yo);
		framePath.bezierCurveTo(-xo+r*f, -yo,
								-xo,     -yo+r*f,
								-xo,     -yo+r);

		framePath.lineTo(       -xo,      yo-r);
		framePath.bezierCurveTo(-xo,      yo-r*f,
								-xo+r*f,  yo,
								-xo+r,    yo);
		return framePath;
	}

}





window.app = new ScreenCaptureApp();