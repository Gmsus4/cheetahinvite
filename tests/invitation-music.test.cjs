/* eslint-disable @typescript-eslint/no-require-imports -- Exercise the shared parser without a database. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createFixture } = require('./helpers/cloudinary-fixture.cjs');
const { invitationMusicPlayer: parse, normalizeInvitationMusicInput: normalize } = createFixture().load('lib/invitation-music.ts');

test('music links and official iframe sources produce the same safe players', () => {
  const cases = [
    ['https://open.spotify.com/intl-es/playlist/abc123?si=tracking', 'Spotify', 'https://open.spotify.com/embed/playlist/abc123'],
    ['https://youtu.be/dQw4w9WgXcQ?si=tracking', 'YouTube', 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'],
    ['https://music.youtube.com/playlist?list=PL_abc-123', 'YouTube', 'https://www.youtube-nocookie.com/embed/videoseries?list=PL_abc-123'],
    ['https://music.apple.com/mx/playlist/favorites/pl.123', 'Apple Music', 'https://embed.music.apple.com/mx/playlist/favorites/pl.123'],
    ['https://music.apple.com/us/album/music/123?i=456', 'Apple Music', 'https://embed.music.apple.com/us/album/music/123?i=456'],
    ['https://soundcloud.com/artist/sets/favorites', 'SoundCloud', 'https://w.soundcloud.com/player/?url=https%3A%2F%2Fsoundcloud.com%2Fartist%2Fsets%2Ffavorites&auto_play=false'],
  ];
  for (const [link, provider, src] of cases) {
    const player = parse(link);
    assert.equal(player.provider, provider);
    assert.equal(player.src, src);
    assert.deepEqual(parse(`<iframe src='${src.replaceAll('&', '&amp;')}' width="9999" onload="alert(1)"></iframe>`), player);
    assert.equal(normalize(`<iframe src="${src}"></iframe>`), src);
  }
});

test('pasted code cannot supply arbitrary frames, scripts, autoplay or HTML attributes', () => {
  for (const input of [
    '<iframe src="javascript:alert(1)"></iframe>',
    '<iframe src="https://example.com/player"></iframe>',
    '<iframe srcdoc="<script>alert(1)</script>"></iframe>',
    'https://open.spotify.com.evil.test/embed/track/abc',
    'https://open.spotify.com@evil.test/embed/track/abc',
    'https://user:pass@open.spotify.com/embed/track/abc',
    'https://w.soundcloud.com/player/?url=https://evil.test/track/123',
    'https://youtube.com/watch?v=bad',
    'https://open.spotify.com/redirect/abc',
  ]) assert.equal(parse(input), null, input);
  assert.equal(parse('<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1" onload="evil()"></iframe>').src, 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
  assert.equal(normalize('https://example.com/playlist'), 'https://example.com/playlist');
});

test('pasted players survive saving and reopening a draft', async () => {
  const f = createFixture();
  for (const source of [
    'https://open.spotify.com/embed/playlist/abc123',
    'https://www.youtube.com/embed/videoseries?list=PL_123',
    'https://embed.music.apple.com/mx/playlist/favorites/pl.123',
    'https://w.soundcloud.com/player/?url=https%3A%2F%2Fapi.soundcloud.com%2Fplaylists%2F123',
  ]) {
    const link = normalize(`<iframe src="${source}" width="100%" allow="autoplay"></iframe>`);
    const section = { id: 'music', type: 'music', title: 'Playlist', content: '', detail: '', imageUrl: '', enabled: true, link };
    const result = await f.actions.updateEvent('event', f.saveForm('', [section]));
    assert.equal(result.ok, true);
    const saved = f.state.events.get('event').sections.find(section => section.type === 'music');
    assert.equal(saved.link, link);
    assert.equal(parse(saved.link).src, parse(source).src);
  }
});

