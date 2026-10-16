import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { PasswordService } from './password.service';

describe('PasswordService', () => {
  const passwords = new PasswordService();

  it('принимает верный пароль', async () => {
    const hash = await passwords.hash('StrongPass1');

    assert.equal(await passwords.verify('StrongPass1', hash), true);
  });

  it('отвергает неверный пароль', async () => {
    const hash = await passwords.hash('StrongPass1');

    assert.equal(await passwords.verify('StrongPass2', hash), false);
  });

  it('не хранит пароль в открытом виде и кладёт параметры в строку хеша', async () => {
    const hash = await passwords.hash('StrongPass1');

    assert.ok(!hash.includes('StrongPass1'));
    assert.match(hash, /^scrypt\$16384\$8\$1\$[\w+/=]+\$[\w+/=]+$/);
  });

  it('даёт разные хеши для одного пароля — соль случайна', async () => {
    const first = await passwords.hash('StrongPass1');
    const second = await passwords.hash('StrongPass1');

    assert.notEqual(first, second);
  });

  it('не падает на испорченном хеше, а возвращает false', async () => {
    for (const broken of ['', 'не-хеш', 'scrypt$1$2$3', 'bcrypt$16384$8$1$AA==$AA==']) {
      assert.equal(await passwords.verify('StrongPass1', broken), false);
    }
  });
});
