import type { Reporter, TestCase, TestResult, FullResult } from '@playwright/test/reporter';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { StoryRecord } from './test-step-helper';
export default class StoryReporter implements Reporter {
  private stories: { record: StoryRecord & { generating: boolean }; file: string }[] = [];
  private failed = false;
  onTestEnd(test: TestCase, result: TestResult) {
    const path = result.attachments.find(a => a.name === 'story-record')?.path;
    if (result.status === 'passed') {
      if (!path || !existsSync(path)) { this.failed = true; console.error('Passing illustrated test has no story record'); return; }
      this.stories.push({ record: JSON.parse(readFileSync(path, 'utf8')), file: test.location.file });
    }
  }
  async onEnd(result: FullResult) {
    if (result.status !== 'passed') return;
    if (this.failed || !this.stories.length) return { status: 'failed' as const };
    try {
    const groups = Map.groupBy(this.stories, item => item.record.slug);
    for (const [slug, group] of groups) {
      const names = group[0].record.viewports;
      if (!names.length || group.some(g => g.record.viewports.join() !== names.join())) throw new Error('Declare consistent required story viewports');
      if (group.length !== names.length || names.some(name => !group.some(g => g.record.project === name))) throw new Error('Missing required viewport evidence');
      const source = group.find(g => g.record.project === 'desktop')!;
      const folder = join(dirname(source.file), 'stories', slug);
      const baseline = join(dirname(source.file), 'screenshots');
      for (const item of group) {
        if (item.record.steps.map(s => s.id).join() !== source.record.steps.map(s => s.id).join()) throw new Error('Viewport story steps differ');
        for (const step of item.record.steps) if (!existsSync(join(baseline, step.image))) throw new Error('Missing story image');
      }
      mkdirSync(folder, { recursive: true });
      const narrative = source.record.steps.map((step, index) => {
        const image = (name: string) => `../../screenshots/${group.find(g => g.record.project === name)!.record.steps[index].image}`;
        const compact = names.filter(name => name !== 'tabletop-4k');
        const panels = compact.length ? `| ${compact.join(' | ')} |\n| ${compact.map(() => '---').join(' | ')} |\n| ${compact.map(name => `[![${name}](${image(name)})](${image(name)})`).join(' | ')} |` : '';
        const large = names.includes('tabletop-4k') ? `<details><summary>Shared display at 4K</summary>\n\n[![4K](${image('tabletop-4k')})](${image('tabletop-4k')})\n\n</details>` : '';
        return `## ${index + 1}. ${step.description}\n\nViewpoint: **${step.player}**.\n\n${panels}\n\n${large}\n\n${step.verifications.map(v => `- [x] ${v}`).join('\n')}`;
      }).join('\n\n');
      writeFileSync(join(folder, 'README.md'), `# ${source.record.title}\n\n${source.record.setup}\n\n${source.record.generating ? '**Candidate captures: generated, not a comparison pass.**\n\n' : ''}${narrative}\n`);
    }
    const folders = Map.groupBy(this.stories, item => dirname(item.file));
    for (const [folder, stories] of folders) {
      const unique = [...new Map(stories.map(item => [item.record.slug, item.record])).values()];
      writeFileSync(join(folder, 'README.md'), `# Production foundation walkthroughs\n\n${unique.map(record => `- [${record.title}](stories/${record.slug}/README.md)`).join('\n')}\n`);
    }
    } catch (error) { console.error(error); return { status: 'failed' as const }; }
  }
}
