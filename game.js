// get html element
function getElement(id) {
    return document.getElementById(id);
}

//ENTITY TRACKING
var zombies = [];
var bullets = [];

//KEY PRESSES / INPUT TRACKING
var up = false;
var down = false;
var right = false;
var left = false;
var shift = false;

var mouseX = 0;
var mouseY = 0;
var clicking = false;

var bgX = 0;
var bgY = 0;

//DATA MODEL
const player = {
    worldX: window.screen.width / 2,
    worldY: window.screen.height / 2,
    rotation: 0,
    element: getElement("player"),
    ammo: 585,
    mag: 15,
    health: 100,
    sprint: 100,
    lastSprintRegen: 0,
    score: 0,
    speed: 15,
    sprintMultiplier: 1.4
}

function Zombie(x, y) {
    this.zombieID = "zombie" + Math.trunc(Math.random() * 10000);
    this.worldX = x;
    this.worldY = y;
    this.rotation = 0;
    this.health = 100;
    this.element = null;
    this.damage = function (amount) {
        this.health -= amount;
    }
}

function Bullet(x, y, rotation) {
    this.bulletID = "bullet" + Math.trunc(Math.random() * 10000);
    this.worldX = x;
    this.worldY = y;
    this.rotation = rotation;
    this.damage = 50;
    this.element = null;
}


//move an html element
function moveElement(element, dx, dy) {

    const topOffset = element.offsetTop;
    const leftOffset = element.offsetLeft;

    element.style.top = (topOffset + dy) + "px";
    element.style.left = (leftOffset + dx) + "px";
}

//GET X COMPONENT OF A VECTOR
function getVectorX(magnitude, angle) {
    return magnitude * Math.cos((angle * Math.PI) / 180);
}

//GET Y COMPONENT OF A VECTOR
function getVectorY(magnitude, angle) {
    return magnitude * Math.sin((angle * Math.PI) / 180);
}

//SIMULATE PLAYER MOVEMENT
function scrollBG(speed, direction) {

    const bg = getElement("map");

    var angle;
    if (direction == "f") angle = player.rotation;
    else if (direction == "b") { angle = player.rotation - 180; speed *= .6 }
    else if (direction == "l") { angle = player.rotation - 90; speed *= .6 }
    else if (direction == "r") { angle = player.rotation + 90; speed *= .6 }

    var dx = getVectorX(speed, angle);
    var dy = getVectorY(speed, angle);

    bgX -= dx;
    bgY -= dy;
    player.worldX += dx;
    player.worldY += dy;

    bg.style.backgroundPosition = bgX + "px " + bgY + "px";
}


//GET ANGLE BETWEEN TWO POINTS
function getAngle(x1, y1, x2, y2) {
    var dy = y2 - y1;
    var dx = x2 - x1;
    var theta = Math.atan2(dy, dx);
    theta *= 180 / Math.PI;
    return theta;
}

//ROTATE PLAYER TOWARD MOUSE
function rotatePlayer(playerElement) {

    var playerX = window.innerWidth / 2;
    var playerY = window.innerHeight / 2;

    player.rotation = getAngle(playerX, playerY, mouseX, mouseY);

    playerElement.style.transform = `rotate(${player.rotation}deg)`;

}

//UPDATE ZOMBIE ROTATION TOWARD PLAYER
function rotateZombie(zombie) {
    var x = zombie.worldX;
    var y = zombie.worldY;
    zombie.rotation = getAngle(x, y, player.worldX - 80, player.worldY - 100);
    zombie.element.style.transform = `rotate(${zombie.rotation}deg)`;
}

//MOVE ZOMBIE
function stepZombie(magnitude, zombie) {
    var theta = zombie.rotation;
    var dx = getVectorX(magnitude, theta);
    var dy = getVectorY(magnitude, theta);
    zombie.worldX += dx;
    zombie.worldY += dy;
}

//MOVE BULLET
function stepBullet(magnitude, bullet) {
    var theta = bullet.rotation;
    var dx = getVectorX(magnitude, theta);
    var dy = getVectorY(magnitude, theta);
    bullet.worldX += dx;
    bullet.worldY += dy;
}

//DISTANCE BETWEEN ELEMENTS
function getDistance(element1, element2) {
    if (!element1 || !element2) return 99999999;
    const x1 = element1.offsetLeft;
    const y1 = element1.offsetTop;
    const x2 = element2.offsetLeft;
    const y2 = element2.offsetTop;

    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

//CARTESIAN DISTANCE
function getDistanceXY(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

//handle key press
function handleKeyPress(event) {

    if (event.code == 'KeyW' || event.code == 'ArrowUp') {
        up = true;
    } else if (event.code == 'KeyS' || event.code == 'ArrowDown') {
        down = true;
    } else if (event.code == 'KeyA' || event.code == 'ArrowLeft') {
        left = true;
    } else if (event.code == 'KeyD' || event.code == 'ArrowRight') {
        right = true;
    }
    if (event.code == 'ShiftLeft') {
        shift = true;
    }

}

//handle key release
function handleKeyRelease(event) {

    if (event.code == 'KeyW' || event.code == 'ArrowUp') {
        up = false;
    } else if (event.code == 'KeyS' || event.code == 'ArrowDown') {
        down = false;
    } else if (event.code == 'KeyA' || event.code == 'ArrowLeft') {
        left = false;
    } else if (event.code == 'KeyD' || event.code == 'ArrowRight') {
        right = false;
    }
    if (event.code == 'ShiftLeft') {
        shift = false;
    }

}

//check if two html elements collide
function checkCollision(element1, element2) {
    const bounds1 = element1.getBoundingClientRect();
    const bounds2 = element2.getBoundingClientRect();
    return !(bounds1.right < bounds2.left ||
        bounds1.left > bounds2.right ||
        bounds1.bottom < bounds2.top ||
        bounds1.top > bounds2.bottom)
}

//game controller stuff
var tick = 0;
var sec = 0;
var lastSpawn = 0;
var lastShoot = 0;
var kills = 0

//REMOVE BULLET FROM PAGE
function removeBullet(bullet) {
    getElement(bullet.bulletID).remove();
}

//REMOVE ZOMBIE FROM PAGE
function removeZombie(zombie) {
    getElement(zombie.zombieID).remove();
}

//SPAWN NEW ZOMBIE AT X, Y
function spawnZombie(x, y) {
    const spawning = new Zombie(x, y);
    const spawningElement = document.createElement(`div`);
    spawningElement.id = spawning.zombieID;
    spawningElement.className = "zombie";
    zombies.push(spawning);
    getElement("playable").appendChild(spawningElement);
    spawning.element = getElement(`${spawning.zombieID}`);
}

//SPAWN AND LAUNCH BULLET
function shootBullet(x, y) {
    const spawning = new Bullet(x, y, player.rotation);
    const spawningElement = document.createElement(`div`);
    spawningElement.id = spawning.bulletID;
    spawningElement.className = "bullet";
    bullets.push(spawning);
    getElement("playable").appendChild(spawningElement);
    spawning.element = getElement(`${spawning.bulletID}`);
}

//UPDATE BARS UI
function updateUI() {
    const healthBar = getElement("healthhud");
    const sprintBar = getElement("sprinthud");

    healthBar.style.width = player.health * 3 + 'px';
    sprintBar.style.width = player.sprint * 3 + 'px';
}

const spawnLocs = [[2360, 1865], [2630, 2400], [3160, 2610], [3000, 2060], [980, 1440]];

var dead = false;
    window.alert("WASD: Movement \n Click to shoot. \nShift to sprint.");

async function gameLoop() {

//CHECK PLAYER

    if (player.health <= 0) {
        if (!dead) {
            const spawningElement = document.createElement(`h1`);
            spawningElement.innerHTML = "GAME OVER!";
            getElement("playable").appendChild(spawningElement);
            dead = true;
        }

        return;
    }

    tick++;

    if (tick % 20 == 0 && tick > 0) {
        tick = 0;
        sec++;
    }
    const now = Date.now();

    if (clicking && now - lastShoot >= 500) {
        if (player.mag == 0) {
            player.mag += 15;
            player.ammo -= 15;
            lastShoot = now;

        } else {
            shootBullet(player.worldX, player.worldY);
            player.mag--;
            lastShoot = now;
        }

    }

    var retainingBullets = [];

    //CHECK BULLETS

    for (const bullet of bullets) {
        bullet.element.style.top = ((bullet.worldY - player.worldY) + screen.availHeight / 2) + "px";
        bullet.element.style.left = ((bullet.worldX - player.worldX) + screen.availWidth / 2) + "px";
        const elementB = getElement(bullet.bulletID);
        if (!elementB) continue;
        if (getDistance(elementB, player.element) > 500) {
            removeBullet(bullet);
        } else {
            retainingBullets.push(bullet);
        }
        stepBullet(45, bullet);

    }


    //CHECK ZOMBIES

    var retainingZombies = [];
    for (const zombie of zombies) {
        zombie.element.style.top = ((zombie.worldY - player.worldY) + screen.availHeight / 2) + "px";
        zombie.element.style.left = ((zombie.worldX - player.worldX) + screen.availWidth / 2) + "px";

        rotateZombie(zombie);
        const elementZ = getElement(zombie.zombieID);
        if (getDistance(elementZ, player.element) > 10) {
            stepZombie(5, zombie);
        }

        for (const bullet of retainingBullets) {
            const elementB = getElement(bullet.bulletID);
            if (getDistanceXY(zombie.worldX + 50, zombie.worldY + 50, bullet.worldX, bullet.worldY) < 80) {
                zombie.damage(bullet.damage);
                removeBullet(bullet);
                retainingBullets = retainingBullets.filter(b => b.bulletID !== bullet.bulletID);

            } else {
                // console.log(getDistanceXY(zombie.worldX, zombie.worldY, bullet.worldX, bullet.worldY))
            }
        }

        if (getDistance(elementZ, player.element) < 25) {
            player.health -= .5;
        }
        if (zombie.health <= 0) {
            if (player.health < 100) {
                player.health++;
                player.health = Math.min(player.health, 100)
            }
            kills++;
            player.ammo += 10;
            removeZombie(zombie);
        } else {
            retainingZombies.push(zombie);
        }

    }

    zombies = retainingZombies;
    bullets = retainingBullets;
    console.log(kills);

    if (sec >= 10 && now - lastSpawn >= 5000) {
        const location = spawnLocs[Math.trunc(Math.random() * 5)];
        spawnZombie(location[0], location[1]);
        lastSpawn = now;
    }

    var speed = player.speed;

    if (shift && player.sprint > 0 && (up || down || left || right)) {
        speed *= player.sprintMultiplier;
        player.sprint--;
    } else {
        if (Date.now() - player.lastSprintRegen >= 250 && player.sprint < 100 && !(shift && (up || down || left || right))) {
            player.sprint++;
            player.lastSprintRegen = Date.now();
        }
    }

    updateUI();

    rotatePlayer(player.element);
    if (up) {
        scrollBG(speed, "f");
    }
    if (down) {
        scrollBG(speed, "b");
    }
    if (left) {
        scrollBG(speed, "l");
    }
    if (right) {
        scrollBG(speed, "r");
    }

    getElement("hudtxt").innerHTML = `${player.mag} / ${player.ammo}`;
    // console.log(player.worldX + ", " + player.worldY)

}

function handleMouseHover(event) {

    mouseX = event.clientX;
    mouseY = event.clientY;

}

function handleMouseDown(event) {

    clicking = true;

}

function handleMouseUp(event) {

    clicking = false;

}

window.addEventListener("keydown", handleKeyPress);
window.addEventListener("keyup", handleKeyRelease);
window.addEventListener("mousedown", handleMouseDown);
window.addEventListener("mouseup", handleMouseUp);

const playableArea = document.getElementById('playable');

playableArea.addEventListener('mousemove', handleMouseHover);

scrollBG(0, "f");
setInterval(gameLoop, 50);