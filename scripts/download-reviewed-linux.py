"""Fetch one pinned CI archive on the runner; preserve native PNG bytes exactly."""
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import urllib.error
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parent.parent
CONFIG = json.loads((ROOT / '.github/linux-reference-review.json').read_text())
REPO = os.environ['GITHUB_REPOSITORY']
TOKEN = os.environ['GITHUB_TOKEN']
assert REPO == CONFIG['repository'], 'Repository mismatch'
assert re.fullmatch(r'[0-9a-f]{40}', CONFIG['sourceHead']), 'Invalid source head'
assert int(os.environ['REVIEW_PR_NUMBER']) == CONFIG['pullRequest'], 'Wrong review PR'
subprocess.run(['git', 'merge-base', '--is-ancestor', CONFIG['sourceHead'], 'HEAD'], cwd=ROOT, check=True)
allowed = {'.github/linux-reference-review.json', '.github/workflows/stage-linux-references.yml',
           'scripts/download-reviewed-linux.py', 'scripts/record-linux-reference-stage.py',
           'scripts/validate-staged-linux.ts', 'docs/CI_NATIVE_REFERENCES.md',
           'tests/e2e/004-first-research/FIDELITY.md', 'PROMPT_WORK.md', 'IMPLEMENTATION_PLAN.md'}
changed = set(subprocess.check_output(['git', 'diff', '--name-only', CONFIG['sourceHead'], 'HEAD'],
                                    cwd=ROOT, text=True).splitlines())
assert changed <= allowed, 'Candidate source changed outside reviewed CI staging metadata'
# Application, tests and capture contract must still be the accepted candidate source.
subprocess.run(['git', 'diff', '--exit-code', CONFIG['sourceHead'], 'HEAD', '--',
                'src', ':(glob)tests/**/*.ts', ':(glob)tests/**/*-darwin.png', 'firestore.rules', 'playwright.config.ts',
                'playwright.infrastructure.config.ts', 'package.json', 'bun.lock',
                'flake.nix', 'flake.lock', 'E2E_GUIDE.md'], cwd=ROOT, check=True)

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args):
        return None

def api(path):
    request = urllib.request.Request('https://api.github.com/repos/' + REPO + path,
        headers={'Authorization': 'Bearer ' + TOKEN, 'Accept': 'application/vnd.github+json'})
    return urllib.request.build_opener(NoRedirect).open(request)

with api('/actions/artifacts/' + str(CONFIG['artifactId'])) as response:
    artifact = json.load(response)
assert not artifact['expired'], 'Candidate archive expired'
assert artifact['workflow_run']['id'] == CONFIG['runId'], 'Wrong workflow run'
assert artifact['workflow_run']['head_sha'] == CONFIG['sourceHead'], 'Wrong candidate revision'
assert artifact['digest'] == CONFIG['digest'], 'Wrong archive digest'
try:
    api('/actions/artifacts/' + str(CONFIG['artifactId']) + '/zip')
    raise RuntimeError('Expected a signed archive redirect')
except urllib.error.HTTPError as response:
    if response.code != 302:
        raise
    archive_url = response.headers['Location']

folder = ROOT / 'tmp/linux-reference-stage'
folder.mkdir(parents=True, exist_ok=True)
archive = folder / 'candidates.zip'
digest = hashlib.sha256()
# The signed object request deliberately carries no GitHub Authorization header.
with urllib.request.urlopen(archive_url) as response, archive.open('wb') as output:
    while chunk := response.read(1024 * 1024):
        output.write(chunk)
        digest.update(chunk)
assert 'sha256:' + digest.hexdigest() == CONFIG['digest'], 'Downloaded archive digest mismatch'
assert archive.stat().st_size == artifact['size_in_bytes'], 'Incomplete candidate archive'

base = ROOT / 'tests/e2e'
expected = {str(path.relative_to(base)).replace('-darwin.png', '-linux.png'): path
            for path in base.rglob('*-darwin.png')}
assert len(expected) == CONFIG['expectedFrames'], 'Executed reference inventory changed'
tracked = set(subprocess.check_output(['git', 'ls-files', '--', 'tests/e2e'], cwd=ROOT,
                                     text=True).splitlines())
reviewed = {item['path']: item['sha256'] for item in CONFIG['reviewedSamples']}
assert len(reviewed) == len(CONFIG['reviewedSamples']) and len(reviewed) >= 21, 'Missing visual review evidence'
manifest = []
with zipfile.ZipFile(archive) as source:
    names = source.namelist()
    assert len(names) == len(set(names)), 'Duplicate archive entries'
    extras = set(names) - expected.keys()
    # Preserve inherited obsolete references; do not import unexecuted/new extras.
    assert all('tests/e2e/' + name in tracked for name in extras), 'Unexpected candidate paths'
    assert expected.keys() <= set(names), 'Missing executed native references'
    for name, mac in sorted(expected.items()):
        raw = source.read(name)  # ZipFile also validates each native entry's CRC.
        sha = hashlib.sha256(raw).hexdigest()
        assert raw.startswith(b'\x89PNG\r\n\x1a\n'), 'Not a native PNG: ' + name
        if name in reviewed:
            assert sha == reviewed[name], 'Reviewed native image changed: ' + name
        target = base / name
        previous = hashlib.sha256(target.read_bytes()).hexdigest() if target.exists() else None
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(raw)
        manifest.append({'path': str(target.relative_to(ROOT)), 'sha256': sha,
                         'changed': sha != previous, 'mac': str(mac.relative_to(ROOT))})
    assert reviewed.keys() <= expected.keys(), 'Reviewed samples outside executed inventory'
assert any(item['changed'] for item in manifest), 'No native reference changes to stage'
report = {'sourceHead': CONFIG['sourceHead'], 'runId': CONFIG['runId'],
          'artifactId': CONFIG['artifactId'], 'digest': CONFIG['digest'],
          'frames': manifest, 'inheritedUnexecutedRetained': sorted(extras)}
(folder / 'manifest.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({'validatedArchive': CONFIG['digest'], 'executed': len(manifest),
                  'changed': sum(item['changed'] for item in manifest),
                  'inheritedUnexecutedRetained': len(extras)}))
