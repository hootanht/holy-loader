import { describe, expect, it } from 'vitest';
import { isSameHost } from '../utils';

globalThis.window = {
  // @ts-expect-error - we don't need to implement all of the window object
  location: {
    href: 'https://example.com/',
  },
};

describe('isSameHost', () => {
  it('should return true for URLs with the same host', () => {
    expect(
      isSameHost('https://example.com/page1', 'https://example.com/page2'),
    ).toBe(true);
    expect(isSameHost('http://example.com', 'https://example.com/about')).toBe(
      true,
    );
    expect(
      isSameHost('https://example.com/', 'http://example.com/contact'),
    ).toBe(true);
    expect(
      isSameHost('https://main.example.com:3000', 'https://main.example.com'),
    ).toBe(true);
  });

  it('should return true for URLs with and without www', () => {
    expect(isSameHost('https://www.example.com', 'https://example.com')).toBe(
      true,
    );
    expect(
      isSameHost('http://www.example.com/about', 'http://example.com/about'),
    ).toBe(true);
    expect(
      isSameHost(
        'https://www.main.example.com/contact',
        'https://main.example.com',
      ),
    );
  });

  it('should return false for URLs with different hosts', () => {
    expect(
      isSameHost(
        'http://example.com',
        'https://www.instagram.com/gamegatornet/',
      ),
    ).toBe(false);
    expect(
      isSameHost(
        'http://main.example.com',
        'https://www.instagram.com/gamegatornet/',
      ),
    ).toBe(false);
    expect(
      isSameHost('http://subdomain.example.com', 'http://example.com'),
    ).toBe(false);
    expect(isSameHost('https://example.com:3000', 'https://example.net')).toBe(
      false,
    );
  });

  it('should handle relative URLs correctly', () => {
    expect(isSameHost('/page1', '/page2')).toBe(true);
    expect(isSameHost('/', '/about')).toBe(true);
    expect(isSameHost('https://example.com/contact', '/contact')).toBe(true);
  });
});
