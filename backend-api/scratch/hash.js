/* global require */
const crypto = require('crypto');
const pwd = '123@admin';
const salt = 'barbearia-vale-salt-2026';
const hash = crypto.createHash('sha256').update(pwd + salt).digest('hex');
console.log('HASH:', hash);
