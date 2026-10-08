"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MONSTER_ARCHETYPES = exports.PLAYER = exports.MAP = exports.TILE = void 0;
exports.TILE = {
    FLOOR: 0,
    WALL: 1,
    MONSTER: 2,
    DOOR: 3,
    EXIT: 4,
    CHEST: 5,
};
exports.MAP = {
    WIDTH: 40,
    HEIGHT: 28,
    MIN_ROOM: 5,
    MAX_ROOM: 11,
    MAX_ROOMS: 14,
    MONSTER_COUNT: 12,
    DOOR_COUNT: 4,
    CHEST_COUNT: 3,
};
exports.PLAYER = {
    MAX_HP: 100,
    BASE_DAMAGE: 12,
    START_SCORE: 0,
};
exports.MONSTER_ARCHETYPES = [
    { id: 'slime', name: 'SLIME', hp: 30, damage: 6, difficulty: 1, color: '#4caf50' },
    { id: 'bat', name: 'BAT', hp: 26, damage: 8, difficulty: 1, color: '#9c6bff' },
    { id: 'orc', name: 'ORC', hp: 55, damage: 12, difficulty: 2, color: '#c0562b' },
    { id: 'golem', name: 'GOLEM', hp: 80, damage: 16, difficulty: 3, color: '#7f8c9b' },
    { id: 'warden', name: 'WARDEN', hp: 120, damage: 20, difficulty: 3, color: '#e04141' },
];
