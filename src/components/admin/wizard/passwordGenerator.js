const ADJECTIVES = [
    'swift', 'bright', 'calm', 'bold', 'kind', 'quick', 'sharp', 'wise',
    'lucky', 'happy', 'gentle', 'silver', 'golden', 'royal', 'lively', 'humble',
];
const ANIMALS = [
    'otter', 'tiger', 'falcon', 'dolphin', 'wolf', 'panda', 'eagle', 'lynx',
    'koala', 'shark', 'badger', 'rabbit', 'hawk', 'fox', 'whale', 'orca',
];

function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
}

export function generateFriendlyPassword() {
    const num = Math.floor(Math.random() * 90) + 10; // 10..99
    return `${pick(ADJECTIVES)}-${pick(ANIMALS)}-${num}`;
}
