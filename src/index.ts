import * as PIPX from 'pixi.js'
const { Application, Loader, AnimatedSprite, Sprite, Texture } = PIPX;
import { Bump } from './lib/bump.js'
const bump = new Bump(PIPX)
const app = new Application({ width: 512, height: 512, antialias: true, transparent: false, resolution: 1 })
const loader = new Loader()
loader
  .add(['/assets/texture/player.png', '/assets/texture/wall.png', '/assets/texture/attack.png' ])
  .load(setup)

class Block {
  sprite: PIPX.Sprite;
  canHit = true;
  constructor(texture: PIPX.Texture, x: number, y: number, canHit = true) {
    this.sprite = new Sprite(texture)
    this.sprite.x = x;
    this.sprite.y = y;
    this.canHit = canHit;
  }
}

class Weapon extends Block{
  owner: Block;
  status: 'idle'|'hitting' = 'idle';
  constructor(texture: PIPX.Texture, x: number, y: number, owner: Block, canHit = true) {
    super(texture, x, y, canHit);
    this.owner = owner;
  }
  hit() {
    this.status = 'hitting';
    this.sprite.x = this.owner.sprite.x + 20;
    this.sprite.y = this.owner.sprite.y + 16;
    setTimeout(() => {
      this.hitCancel();
    }, 200)
  }
  hitCancel() {
    this.status = 'idle';
    app.stage.removeChild(this.sprite);
  }
}

class Player extends Block{
  vx = 0;
  vy = 0;
  weapon: Weapon;
  constructor(texture: PIPX.Texture, x: number, y: number) {
    super(texture, x, y);
    this.weapon = new Weapon(loader.resources['/assets/texture/attack.png'].texture, x + 20, y + 16, this);
  }
  move() {
    this.sprite.x += this.vx;
    this.sprite.y += this.vy
  }
  stop() {
    this.vx = 0;
    this.vy = 0;
  }
  attack() {
    app.stage.addChild(this.weapon.sprite);
    this.weapon.hit();
  }
}

class Wall extends Block{
  constructor(texture: PIPX.Texture, x: number, y: number) {
    super(texture, x, y);
  }
}

function setup() {
  const textureStore = loader.resources['/assets/texture/player.png'].texture;
  const wallTexture = loader.resources['/assets/texture/wall.png'].texture;
  const walls = [[68, 100], [68, 132]].map(position => new Wall(wallTexture, position[0], position[1]));
  walls.forEach(wall => {
    app.stage.addChild(wall.sprite);
  })
  const player = new Player(textureStore, 68, 50);
  app.stage.addChild(player.sprite);
  const left = keyboard(37);
  const up = keyboard(38);
  const right = keyboard(39);
  const down = keyboard(40);
  const j = keyboard(74);
  j.press = () => {
    if (player.weapon.status === 'idle') {
      player.attack();
    }
  };
  down.press = () => {
    player.vy = 1.5;
    player.vx = 0;
  };
  right.press = () => {
    player.vx = 1.5;
    player.vy = 0;
  };
  up.press = () => {
    player.vy = -1.5;
    player.vx = 0;
  }
  left.press = () => {
    player.vx = -1.5;
    player.vy = 0;
  }
  down.release = () => {
    if (!up.isDown) {
      player.stop();
    }
  };
  right.release = () => {
    if (!left.isDown) {
      player.stop();
    }
  };
  up.release = () => {
    if (!down.isDown) {
      player.stop();
    }
  };
  left.release = () => {
    if (!right.isDown) {
      player.stop();
    }
  };
  app.ticker.add(delta => gameLoop(delta));
  function gameLoop(delta) {
    player.move();
    walls.forEach((wall, index) => {
      bump.hit(player.sprite, wall.sprite, true);
      if (player.weapon.status === 'hitting' && bump.hitTestRectangle(player.weapon.sprite, wall.sprite)) {
        app.stage.removeChild(wall.sprite);
        walls.splice(index, 1);
      }
    })

  }
}


function keyboard(keyCode) {
  let key: any = {};
  key.code = keyCode;
  key.isDown = false;
  key.isUp = true;
  key.press = undefined;
  key.release = undefined;
  //The `downHandler`
  key.downHandler = event => {
    if (event.keyCode === key.code) {
      if (key.isUp && key.press) key.press();
      key.isDown = true;
      key.isUp = false;
    }
    event.preventDefault();
  };

  //The `upHandler`
  key.upHandler = event => {
    if (event.keyCode === key.code) {
      if (key.isDown && key.release) key.release();
      key.isDown = false;
      key.isUp = true;
    }
    event.preventDefault();
  };

  //Attach event listeners
  window.addEventListener(
    "keydown", key.downHandler.bind(key), false
  );
  window.addEventListener(
    "keyup", key.upHandler.bind(key), false
  );
  return key;
}
document.body.appendChild(app.view)
