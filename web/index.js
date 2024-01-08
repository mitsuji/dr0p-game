const CANV_W = 500;
const CANV_H = 600;


window.onload = async () => {

    let ballImages = {};
    for (let i = 0; i < 10; i++) {
        let image = new Image();
        await new Promise((resolve,reject) => {
            image.onload = () => {
                resolve();
            };
            image.src = "csize" + (i+1) + ".png";
        });
        ballImages[i+1] = image;
    }

    let engine = Matter.Engine.create();

    let walls = createWalls();
    Matter.Composite.add(engine.world, [walls.lBody,walls.rBody,walls.bBody]);

    let canvNext = document.getElementById('canvnext');
    canvNext.width  = 100;
    canvNext.height = 100;
    let ctxtNext = canvNext.getContext('2d');
    let ballGen = createBallGen((nextBallSize) => {
        ctxtNext.clearRect(0,0,canvNext.width,canvNext.height);
        setTimeout(() => {
            createBall(50, 50, nextBallSize).draw(ctxtNext,ballImages);
        },500);
    });

    let inlet = createInlet(CANV_W/2,50);
    let balls = {};
    let score = 0;
    let drawCurrBall = (context) => {
        if (ballGen.showCurrBall) {
            let size = ballGen.currBallSize;
            let r = ballRadius(size);
            createBall(inlet.x,inlet.y+r,size).draw(context,ballImages);
        }
    };
    let showScore = () => {
        let spanScore = document.getElementById('spanscore');
        spanScore.innerText = score;
    }
    showScore();
    let dropBall = (size) => {
        let r = ballRadius(size);
        let ball = createBall(inlet.x,inlet.y+r,size);
        balls[ball.body.id] = ball;
        Matter.Composite.add(engine.world,ball.body);
    };
    let reset = () => {
        for(let key in balls) {
            let ball = balls[key];
            Matter.Composite.remove(engine.world, ball.body);
        }
        balls = {};
        inlet.x = CANV_W/2;
        score = 0;
        showScore();
    };

    document.getElementById("canvgame").addEventListener("mousemove", (event) => {
        inlet.x = event.offsetX;
    });

    document.getElementById("canvgame").addEventListener("mousedown", (event) => {
        dropBall(ballGen.currBallSize);
        ballGen.prepareNext();
    });

    document.addEventListener("keydown", (event) => {
        if (event.keyCode === 32) {
            dropBall(ballGen.currBallSize);
            ballGen.prepareNext();
        } else if (event.keyCode === 37) {
            inlet.moveLeft();
        } else if (event.keyCode === 39) {
            inlet.moveRight();
        } else if ("qwertyuiop".includes(event.key)){
            let size;
            switch (event.key) {
            case "q": { size =  1; break; }
            case "w": { size =  2; break; }
            case "e": { size =  3; break; }
            case "r": { size =  4; break; }
            case "t": { size =  5; break; }
            case "y": { size =  6; break; }
            case "u": { size =  7; break; }
            case "i": { size =  8; break; }
            case "o": { size =  9; break; }
            case "p": { size = 10; break; }
            }
            dropBall(size);
        }
    });

    Matter.Events.on(engine, "collisionStart", (event) => {
        let removes = [];
        let creates = [];
        let pairs = event.pairs;
        for (let i = 0; i < pairs.length; i++) {
            let pair = pairs[i];
            let idA = pair.bodyA.id;
            let idB = pair.bodyB.id;
            let ballA = balls[idA];
            let ballB = balls[idB];
            if (ballA && ballB && ballA.size === ballB.size) {
                if((!removes.includes(idA)) && (!removes.includes(idB))) {
                    removes.push(idA);
                    removes.push(idB);
                    if(ballA.size < 10) {
                        let size = ballA.size + 1;
                        let ball = createBall(ballA.body.position.x, ballA.body.position.y, size);
                        Matter.Body.setAngle(ball.body,ballA.body.angle);
                        creates.push(ball);
                    }
                    score += ballA.size * 10;
                }
            }
        }
        for (let i = 0; i < removes.length; i++) {
            let ballId = removes[i];
            let ball = balls[ballId];
            Matter.Composite.remove(engine.world, ball.body);
            delete balls[ballId];
        }
        for (let i = 0; i < creates.length; i++) {
            let ball = creates[i];
            balls[ball.body.id] = ball;
            Matter.Composite.add(engine.world,ball.body);
        }
        showScore();
    });

    let canvGame = document.getElementById('canvgame');
    canvGame.width  = CANV_W;
    canvGame.height = CANV_H;
    let ctxtGame = canvGame.getContext('2d');

    let render = (ts) => {
        ctxtGame.clearRect(0, 0, canvGame.width, canvGame.height);

        walls.draw(ctxtGame);
        inlet.draw(ctxtGame);
        drawCurrBall(ctxtGame);
        
        for (let key in balls) {
            balls[key].draw(ctxtGame,ballImages);
//            balls[key].drawModel(ctxtGame);
        }

        let hasOverFlow = false;
        for (let key in balls) {
            let ball = balls[key];
            if((ball.body.position.y - ball.r) < 50) {
                hasOverFlow = true;
                break;
            }
        }
        if(hasOverFlow) {
            alert("Game Over...\nYour Score is " + score);
            reset();
        }
        Matter.Engine.update(engine, 1000 / 60);
        window.requestAnimationFrame(render);
    };
    window.requestAnimationFrame(render);

}


function ballRadius(size) {
    let r;
    switch(size) {
    case  1: { r =  20; break; }
    case  2: { r =  40; break; }
    case  3: { r =  45; break; }
    case  4: { r =  55; break; }
    case  5: { r =  70; break; }
    case  6: { r =  80; break; }
    case  7: { r =  95; break; }
    case  8: { r = 115; break; }
    case  9: { r = 135; break; }
    case 10: { r = 160; break; }
    }
    return r;
}

function createBall (x,y,size) {
    let o = {};
    o.size = size;
    o.r = ballRadius(size);
    o.body = Matter.Bodies.circle(x,y,o.r);

    o.draw = function (context,ballImages) {
        let image = ballImages[this.size];
        let wh = this.r *2;
        let x = this.body.position.x - this.r;
        let y = this.body.position.y - this.r;
        let tx = x+this.r;
        let ty = y+this.r
        context.translate(tx,ty);
        context.rotate(this.body.angle);
        context.translate(-tx,-ty);
        context.drawImage(image,x,y,wh,wh);
        context.setTransform(1, 0, 0, 1, 0, 0);
    };
    o.drawModel = function (context) {
        let vertices = this.body.vertices;
        let vertice0 = vertices[0];
        let color;
        switch (this.size) {
        case  1: { color = "#ff0000"; break; }
        case  2: { color = "#00ff00"; break; }
        case  3: { color = "#0000ff"; break; }
        case  4: { color = "#cc0000"; break; }
        case  5: { color = "#00cc00"; break; }
        case  6: { color = "#0000cc"; break; }
        case  7: { color = "#880000"; break; }
        case  8: { color = "#008800"; break; }
        case  9: { color = "#000088"; break; }
        case 10: { color = "#440000"; break; }
        }
        context.beginPath();
        context.moveTo(vertice0.x, vertice0.y);
        for (let i = 1; i < vertices.length; i++) {
            let vertice = vertices[i];
            context.lineTo(vertice.x, vertice.y);
        }
        context.lineTo(vertice0.x, vertice0.y);
        context.fillStyle = color;
        context.fill();

        context.beginPath();
        context.moveTo(this.body.position.x, this.body.position.y);
        context.lineTo(vertice0.x, vertice0.y);
        context.lineWidth = 3;
        context.strokeStyle = "#ffffff";
        context.stroke();
    };

    return o;
}


function createBallGen (fOnPrepare) {
    const randomBallSize = () => (Math.floor(Math.random() *3) +1);
    let o = {};
    o.currBallSize = randomBallSize();
    o.nextBallSize = randomBallSize();
    fOnPrepare(o.nextBallSize);
    o.showCurrBall = true;

    o.prepareNext = function() {
        this.currBallSize = this.nextBallSize;
        this.nextBallSize = randomBallSize();
        fOnPrepare(this.nextBallSize);
        this.showCurrBall = false;
        setTimeout(()=>{this.showCurrBall = true;},500);
    };

    return o;
}


function createInlet (x,y) {
    const width  = 120;
    const height = 10;

    let o = {};
    o.x = x;
    o.y = y;

    o.draw = function (context) {
        context.fillStyle = '#C0C0C0';
        context.fillRect(this.x-(width/2), this.y-(height/2), width, height);
    };

    o.moveLeft = function () {
        this.x = this.x - 50;
    };
    o.moveRight = function () {
        this.x = this.x + 50;
    };

    return o;
}


function createWalls () {
    let o = {};
    let width = 10;
    let ww = width * 2;
    o.lBody = Matter.Bodies.rectangle(     0,   CANV_H/2, ww, CANV_H+ww, { isStatic: true });
    o.rBody = Matter.Bodies.rectangle(CANV_W,   CANV_H/2, ww, CANV_H+ww, { isStatic: true });
    o.bBody = Matter.Bodies.rectangle(CANV_W/2, CANV_H,   CANV_W+ww, ww, { isStatic: true });

    o.draw = function (context) {
        let drawBody = (body) => {
            let vertices = body.vertices;

            context.beginPath();
            context.moveTo(vertices[0].x, vertices[0].y);
            for (let j = 1; j < vertices.length; j++) {
                context.lineTo(vertices[j].x, vertices[j].y);
            }
            context.lineTo(vertices[0].x, vertices[0].y);
            context.fillStyle = '#C0C0C0';
            context.fill();
        };
        drawBody(this.lBody);
        drawBody(this.rBody);
        drawBody(this.bBody);
    };

    return o;
}
