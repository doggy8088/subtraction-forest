// Use the Pages API with github-script's current SDK. deploy-pages@v5 bundles
// an old artifact client that emits DEP0040 even on successful deployments.
// https://github.com/actions/deploy-pages/issues/434
// https://docs.github.com/en/rest/pages/pages#create-a-github-pages-deployment
import { setTimeout } from 'node:timers/promises';

export async function deployPages(
  { github, core, context, artifactId },
  { wait = setTimeout, timeoutMs = 600_000 } = {},
) {
  if (!Number.isSafeInteger(artifactId) || artifactId <= 0)
    throw new Error('A valid uploaded Pages artifact ID is required.');

  const common = {
    ...context.repo,
    headers: { 'X-GitHub-Api-Version': '2026-03-10' },
    request: { timeout: 30_000 },
  };
  const { data: deployment } = await github.request(
    'POST /repos/{owner}/{repo}/pages/deployments',
    {
      ...common,
      artifact_id: artifactId,
      pages_build_version: context.sha,
      oidc_token: await core.getIDToken(),
    },
  );
  const target = {
    ...common,
    pages_deployment_id: deployment.id || context.sha,
  };
  const deadline = Date.now() + timeoutMs;
  const terminalFailures = new Set([
    'deployment_failed',
    'deployment_content_failed',
    'deployment_cancelled',
    'deployment_lost',
  ]);
  let finished = false;
  try {
    while (Date.now() < deadline) {
      await wait(5_000);
      const { data } = await github.request(
        'GET /repos/{owner}/{repo}/pages/deployments/{pages_deployment_id}',
        target,
      );
      core.info(`Pages deployment: ${data.status}`);
      if (data.status === 'succeed') {
        finished = true;
        core.setOutput('page_url', deployment.page_url);
        return;
      }
      if (terminalFailures.has(data.status)) {
        finished = true;
        throw new Error(`Pages deployment failed: ${data.status}`);
      }
    }
    throw new Error('Pages deployment timed out after 10 minutes.');
  } finally {
    // Never leave a pending deployment behind after a timeout or API failure.
    if (!finished)
      await github.request(
        'POST /repos/{owner}/{repo}/pages/deployments/{pages_deployment_id}/cancel',
        target,
      );
  }
}
