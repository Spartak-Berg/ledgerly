import { PasswordService } from './password.service';

describe('PasswordService', () => {
  const service = new PasswordService();

  it('hashes passwords with a unique salt and verifies them', async () => {
    const first = await service.hash('a sufficiently long password');
    const second = await service.hash('a sufficiently long password');

    expect(first).not.toBe(second);
    await expect(
      service.verify('a sufficiently long password', first),
    ).resolves.toBe(true);
    await expect(service.verify('the wrong password', first)).resolves.toBe(
      false,
    );
  });

  it('rejects malformed stored hashes', async () => {
    await expect(service.verify('password', 'not-a-valid-hash')).resolves.toBe(
      false,
    );
  });
});
