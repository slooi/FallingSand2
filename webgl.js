console.log('webgl.js loaded')


// shader source
const vsSource = document.getElementById('vsSource').innerText
const fsSource = document.getElementById('fsSource').innerText


// canvas
const canvas = document.createElement('canvas')
canvas.width = 1000
canvas.height = canvas.width
document.body.append(canvas)

// gl
let gl = canvas.getContext('webgl',{antialias:false})
if(!gl){
    gl = canvas.getContext('experimental-webgl')
}
if(!gl){
    alert("ERROR: all versions of webgl not supported. Please use an updated browser which supports webgl")
}

// gl setup
gl.viewport(0,0,canvas.width,canvas.height)
gl.clearColor(0,0,1,1)
gl.clear(gl.COLOR_BUFFER_BIT)

// program
const program = buildProgram()
gl.useProgram(program)


// location
const attribLoc = []
for(let i=0;i<gl.getProgramParameter(program,gl.ACTIVE_ATTRIBUTES);i++){
    const attribName = gl.getActiveAttrib(program,i).name
    attribLoc[attribName] = gl.getAttribLocation(program,attribName)
}

const uniformLoc = []
for(let i=0;i<gl.getProgramParameter(program,gl.ACTIVE_UNIFORMS);i++){
    const uniformName = gl.getActiveUniform(program,i).name
    uniformLoc[uniformName] = gl.getUniformLocation(program,uniformName)
}


// data
let data = createQuad()

// buffer
const dataBuffer = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER,dataBuffer)
gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW)

// pointer
gl.vertexAttribPointer(
    attribLoc.a_Position,
    2,
    gl.FLOAT,
    0,
    0,
    0
)
gl.enableVertexAttribArray(attribLoc.a_Position)

// uniform


// texture
const fbs = []
const textures = []
for(let i=0;i<2;i++){
    textures[i] = buildTexture()
    fbs[i] = buildFramebuffer(textures[i])
}
addTextureData(textures[1],buildTextureData())
addTextureData(textures[0],buildTextureData('dot'))

// const fbTexture = gl.createTexture()
// gl.bindTexture(gl.TEXTURE_2D,fbTexture)
// gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,canvas.width,canvas.height,0,gl.RGBA,gl.UNSIGNED_BYTE,null)
// gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE)
// gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE)
// gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST)
// gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST)

// const fb = gl.createFramebuffer()
// gl.bindFramebuffer(gl.FRAMEBUFFER,fb)
// gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,fbTexture,0)

// render

gl.uniform1f(uniformLoc.u_FinalRender,0)
gl.uniform1f(uniformLoc.u_PixSize,1/canvas.width)
gl.uniform2f(uniformLoc.u_InvRes,1/canvas.width,1/canvas.height)
gl.uniform1f(uniformLoc.u_Ran,Math.round(Math.random()))


let oldDate = new Date()
const fps = 40
let finalDraw = 0
let pairCounter = 0

// gl.bindFramebuffer(gl.FRAMEBUFFER,null)
// gl.drawArrays(gl.TRIANGLES,0,data.length/2)
// readData()

function eachFrame(){
    // gl.clear(gl.COLOR_BUFFER_BIT)

    for(let i=0;i<10;i++){
        // update swapped texture
        switchPair()
        gl.uniform1f(uniformLoc.u_FinalRender,0)
        gl.uniform1f(uniformLoc.u_Ran,Math.random())
        gl.drawArrays(gl.TRIANGLES,0,data.length/2)
    
        // real render
        gl.bindFramebuffer(gl.FRAMEBUFFER,null)
        gl.uniform1f(uniformLoc.u_FinalRender,1)
        gl.drawArrays(gl.TRIANGLES,0,data.length/2)
    }
}


const mouse = {
    x:0,
    y:0,
    down:0
}
loop()
function loop(){
    if(new Date()-oldDate>1000/fps){
        eachFrame()
        oldDate = new Date()
    }

    if(mouse.down)
        addSand()


    requestAnimationFrame(loop)
}



// OTHER FUNCTIONS 
canvas.addEventListener('mousedown',e=>{
    processMouseDown(e)
    mouse.down = 1
})
canvas.addEventListener('mouseup',e=>{
    processMouseDown(e)
    mouse.down = 0
})
canvas.addEventListener('mousemove',e=>{
    processMouseDown(e)
})

function processMouseDown(e){
    const x=e.offsetX
    const y=e.offsetY
    mouse.x = (relativeValues(x)-canvas.width/2)/canvas.width*2
    mouse.y = (-relativeValues(y)+canvas.height/2)/canvas.height*2
    // console.log('2 offsetX',mouse.x)
    // console.log('2 offsetY',mouse.y)
}
function relativeValues(val){
    if(val>=0 && val<canvas.width){
        return val
    }else if(val<0){
        return 0
    }else{
        return canvas.width-1
    }
}
function canvasValues(val){
    return val
}
function addSand(){
    // clear quad data
    data.length = 0

    // add user sand data
    data.push(
        mouse.x,mouse.y,
        mouse.x+50/canvas.width,mouse.y+50/canvas.height,
        mouse.x+50/canvas.width,mouse.y
    )
    // data.push(0,0,0.5,0,0.6,0.9)
    // data.push(0,0,1,0,1,1)
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW)

    // change drawType
    gl.uniform1f(uniformLoc.u_FinalRender,0.5)
    
    // bind & draw
    bindPair()
    gl.drawArrays(gl.TRIANGLES,0,data.length/2)
    // switchPair()
    // gl.drawArrays(gl.TRIANGLES,0,data.length/2)


    // clear user sand data
    data.length = 0

    // add quad data
    data.push(...createQuad())
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW)
}

// FUNCTIONS
function createQuad(){
    return [
        -1,-1,
        -1,1,
        1,1,
    
        1,1,
        1,-1,
        -1,-1
    ]
}

function bindPair(){
    // console.log('BIND',pairCounter)
    gl.bindTexture(gl.TEXTURE_2D,textures[(pairCounter+1)%2])
    gl.bindFramebuffer(gl.FRAMEBUFFER,fbs[(pairCounter+2)%2])
}

function switchPair(){
    // console.log('pair is now:',pairCounter)
    gl.bindTexture(gl.TEXTURE_2D,textures[pairCounter])
    gl.bindFramebuffer(gl.FRAMEBUFFER,fbs[(pairCounter+1)%2])

    pairCounter=(pairCounter+1)%2
}

function readData(){
    const dataView = new Uint8Array(canvas.width*canvas.height*4)
    gl.readPixels(0,0,canvas.width,canvas.height,gl.RGBA,gl.UNSIGNED_BYTE,dataView)
    console.log(dataView)
}

function addTextureData(texture,textureData){
    gl.bindTexture(gl.TEXTURE_2D,texture)
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,canvas.width,canvas.height,0,gl.RGBA,gl.UNSIGNED_BYTE,textureData)
}

function buildTextureData(type){
    const textureData = new Uint8Array(canvas.width*canvas.height*4)
    for(let y=0;y<canvas.height;y++){
        for(let x=0;x<canvas.width;x++){
            // sky
            textureData[y*canvas.width*4+x*4+0] = 0
            textureData[y*canvas.width*4+x*4+1] = 0
            textureData[y*canvas.width*4+x*4+2] = 0
            textureData[y*canvas.width*4+x*4+3] = 0
            // if(y===0){
            //     // green floor
            //     textureData[y*canvas.width*4+x*4+0] = 0
            //     textureData[y*canvas.width*4+x*4+1] = 255
            //     textureData[y*canvas.width*4+x*4+2] = 0
            //     textureData[y*canvas.width*4+x*4+3] = 0
            // }else if(y===canvas.height-1){
            //     // ceiling
            //     textureData[y*canvas.width*4+x*4+0] = 0
            //     textureData[y*canvas.width*4+x*4+1] = 0
            //     textureData[y*canvas.width*4+x*4+2] = 255
            //     textureData[y*canvas.width*4+x*4+3] = 0
            // }else{
            //     // sky
            //     textureData[y*canvas.width*4+x*4+0] = 0
            //     textureData[y*canvas.width*4+x*4+1] = 0
            //     textureData[y*canvas.width*4+x*4+2] = 0
            //     textureData[y*canvas.width*4+x*4+3] = 0
            // }
        }
    }

    


    if(type === 'dot'){
        textureData[(canvas.height-1)*canvas.width*4+0] = 255
    }
    
    return textureData
}


function buildFramebuffer(texture){
    const fb = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER,fb)
    gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,texture,0)

    return fb
}

function buildTexture(){
    const texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D,texture)
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,canvas.width,canvas.height,0,gl.RGBA,gl.UNSIGNED_BYTE,null)
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST)

    return texture
}

function buildShader(type,source){
    const shader = gl.createShader(type)
    gl.shaderSource(shader,source)
    gl.compileShader(shader)

    if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){
        throw new Error('ERROR: compililng shader of type '+type+' . Info: '+gl.getShaderInfoLog(shader))
    }
    return shader
}

function buildProgram(){
    const program = gl.createProgram()
    gl.attachShader(program,buildShader(gl.VERTEX_SHADER,vsSource))
    gl.attachShader(program,buildShader(gl.FRAGMENT_SHADER,fsSource))
    gl.linkProgram(program)
    gl.validateProgram(program)

    if(!gl.getProgramParameter(program,gl.LINK_STATUS)){
        throw new Error('ERROR: linking program. Info: '+gl.getProgramInfoLog(program))
    }
    if(!gl.getProgramParameter(program,gl.VALIDATE_STATUS)){
        throw new Error('ERROR: validating program. Info: '+gl.getProgramInfoLog(program))
    }
    return program
}