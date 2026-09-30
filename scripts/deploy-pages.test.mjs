import { describe, expect, it, mock } from 'bun:test';
import { deployPages } from './deploy-pages.mjs';

function fixture(statuses = ['succeed']) {
  const args = {
    artifactId: 123,
    context: { repo: { owner: 'owner', repo: 'forest' }, sha: 'commit-sha' },
    core: {
      getIDToken: mock(async () => 'test-oidc-token'),
      info: mock(),
      setOutput: mock(),
    },
    github: {
      request: mock(async (route) => {
        if (route.endsWith('/cancel')) return { status: 204 };
        if (route.startsWith('POST'))
          return {
            data: { id: 'deployment-id', page_url: 'https://forest.test/' },
          };
        const next = statuses.shift();
        if (next instanceof Error) throw next;
        return { data: { status: next } };
      }),
    },
  };
  return { args, timing: { wait: async () => {} } };
}

describe('Pages deployment', () => {
  it('deploys the verified artifact with OIDC and waits for actual success', async () => {
    const { args, timing } = fixture([
      'deployment_queued',
      'updating_pages',
      'succeed',
    ]);
    await deployPages(args, timing);
    expect(args.github.request.mock.calls[0][1]).toMatchObject({
      owner: 'owner',
      repo: 'forest',
      artifact_id: 123,
      pages_build_version: 'commit-sha',
      oidc_token: 'test-oidc-token',
    });
    expect(args.github.request).toHaveBeenCalledTimes(4);
    expect(args.core.setOutput).toHaveBeenCalledWith(
      'page_url',
      'https://forest.test/',
    );
  });

  it('rejects a missing artifact before requesting credentials or deploying', async () => {
    const { args, timing } = fixture();
    await expect(
      deployPages({ ...args, artifactId: NaN }, timing),
    ).rejects.toThrow('artifact ID');
    expect(args.core.getIDToken).not.toHaveBeenCalled();
    expect(args.github.request).not.toHaveBeenCalled();
  });

  it.each([
    'deployment_failed',
    'deployment_content_failed',
    'deployment_cancelled',
    'deployment_lost',
  ])(
    'fails the job on %s instead of reporting a published URL',
    async (status) => {
      const { args, timing } = fixture([status]);
      await expect(deployPages(args, timing)).rejects.toThrow(status);
      expect(args.core.setOutput).not.toHaveBeenCalled();
      expect(args.github.request).toHaveBeenCalledTimes(2);
    },
  );

  it('cancels a pending deployment on timeout', async () => {
    const { args, timing } = fixture();
    await expect(
      deployPages(args, { ...timing, timeoutMs: 0 }),
    ).rejects.toThrow('timed out');
    expect(args.github.request.mock.calls.at(-1)[0]).toEndWith('/cancel');
    expect(args.core.setOutput).not.toHaveBeenCalled();
  });

  it('cancels a pending deployment when the status API fails', async () => {
    const { args, timing } = fixture([new Error('API unavailable')]);
    await expect(deployPages(args, timing)).rejects.toThrow('API unavailable');
    expect(args.github.request.mock.calls.at(-1)[0]).toEndWith('/cancel');
    expect(args.core.setOutput).not.toHaveBeenCalled();
  });
});
