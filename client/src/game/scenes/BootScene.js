import Phaser from "phaser";
import { generateTextures } from "../textures";

export class BootScene extends Phaser.Scene {
  constructor() { super("Boot"); }

  create() {
    generateTextures(this);
    const room = this.registry.get("room");
    const user = this.registry.get("user");
    const socket = this.registry.get("socket");
    this.scene.start("Dungeon", { room, user, socket });
  }
}