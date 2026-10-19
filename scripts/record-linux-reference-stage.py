"""Bind the runner's native-reference-only commit to its reviewed prompt and source."""
import hashlib
import json
from pathlib import Path
import re
report = json.loads(Path('tmp/linux-reference-stage/manifest.json').read_text())
count = len(report['frames'])
changed = sum(frame['changed'] for frame in report['frames'])
prompts = Path('PROMPTS.md').read_bytes()
number = re.findall(rb'^## Prompt ([0-9]+):', prompts, re.M)[-1].decode()
continuation = (f'Prompt {number} | {hashlib.sha256(prompts).hexdigest()} | '
                f'Import reviewed phase004 Linux references from pinned run {report["runId"]}; retain separate independent exact and hosted gates.\n')
with Path('PROMPT_WORK.md').open('a') as output:
    output.write('\n' + continuation)
with Path('IMPLEMENTATION_PLAN.md').open('a') as output:
    output.write(f'\nPhase004 Linux reference staging: {count} executed native PNGs validated from pinned run {report["runId"]} at {report["sourceHead"]}, with {changed} new/changed references. Native bytes, full decoded images and paired viewport dimensions are verified; reviewed sample hashes match. Inherited unexecuted references remain preserved. This is a reference import, not an independent exact pass. The PR head is not advanced by the staging job. Independent Linux comparison and matching hosted revision remain pending; no merge.\n')
