import { test, expect } from '@playwright/test';

test('personal diary persists, edits and deletes; demo data stays separate', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('./');
  await expect(page.getByRole('heading', { name: /今天，也要好好/ })).toBeVisible();
  expect(await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content')).toContain("object-src 'none'");
  await page.screenshot({ path: '.screenshots/desktop-personal.png', fullPage: true, animations: 'disabled' });
  await page.getByRole('button', { name: '记录不错的心情' }).click();
  await page.getByLabel('想对自己说点什么？').fill('今天完成了汇报，也给自己留了一点休息时间。');
  await page.getByRole('button', { name: '工作', exact: true }).click();
  await page.getByRole('button', { name: '保存这份心情' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('button', { name: /今天完成了汇报/ })).toBeVisible();
  await page.getByRole('button', { name: '体验示例', exact: true }).click();
  await expect(page.getByText(/正在体验示例空间/)).toBeVisible();
  await expect(page.getByRole('button', { name: /今天完成了汇报/ })).toHaveCount(0);
  await page.screenshot({ path: '.screenshots/desktop-demo.png', fullPage: true, animations: 'disabled' });
  await page.getByRole('button', { name: '返回我的空间' }).click();
  await expect(page.getByRole('button', { name: /今天完成了汇报/ })).toBeVisible();
  await page.locator('.sidebar').getByRole('link', { name: '情绪日记', exact: true }).click();
  await page.getByRole('button', { name: '查看 / 编辑' }).click();
  await page.getByLabel('想对自己说点什么？').fill('修改后的日记，记得早点休息。');
  await page.getByRole('button', { name: '保存这份心情' }).click();
  await expect(page.getByText('修改后的日记，记得早点休息。', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /^删除.*的记录$/ }).click();
  await page.getByRole('button', { name: '确认删除', exact: true }).click();
  await expect(page.getByText('你的第一篇日记，值得被期待')).toBeVisible();
  await page.reload();
  await expect(page.getByText('你的第一篇日记，值得被期待')).toBeVisible();
  expect(errors).toEqual([]);
});

test('backup import validates, exports and clear requires confirmation', async ({ page }) => {
  await page.goto('./#/settings');
  await expect(page.getByRole('heading', { name: '你的记录，由你保管' })).toBeVisible();
  const file = page.getByLabel('选择备份文件');
  await file.setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{"version":999}') });
  await expect(page.getByRole('alert')).toContainText('备份格式无效');
  const date = new Date().toISOString().slice(0,10);
  const content = JSON.stringify({version:1,entries:[{id:'import-one',date,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),mood:3,emotions:[],tags:['学习'],body:'从备份恢复的日记'}],sessions:[]});
  await file.setInputFiles({ name:'valid.json',mimeType:'application/json',buffer:Buffer.from(content) });
  await expect(page.getByRole('dialog')).toContainText('1 篇日记');
  await page.getByRole('button', { name: '确认替换或清空' }).click();
  await expect(page.getByText('包含 1 篇日记与 0 次关怀反馈，可再次导入')).toBeVisible();
  const downloadPromise=page.waitForEvent('download');
  await page.getByRole('button',{name:'导出 JSON'}).click();
  const download=await downloadPromise;
  expect(download.suggestedFilename()).toContain('daylight-personal');
  await page.getByRole('button',{name:'清空数据',exact:true}).click();
  await page.getByRole('button',{name:'取消',exact:true}).click();
  await expect(page.getByText('包含 1 篇日记与 0 次关怀反馈，可再次导入')).toBeVisible();
  await page.getByRole('button',{name:'清空数据',exact:true}).click();
  await page.getByRole('button',{name:'确认替换或清空'}).click();
  await expect(page.getByText('包含 0 篇日记与 0 次关怀反馈，可再次导入')).toBeVisible();
});

test('breathing pause and feedback persist; audio really starts and cleans up', async ({ page }) => {
  await page.addInitScript(() => {
    const Original=window.AudioContext;
    (window as any).__audioContexts=[];
    window.AudioContext=class extends Original { constructor(options?:AudioContextOptions) {super(options);(window as any).__audioContexts.push(this);} };
  });
  await page.goto('./#/care');
  await page.getByRole('button', { name: /开始呼吸练习/ }).click();
  await page.getByRole('button', { name: '开始练习', exact: true }).click();
  await expect(page.getByRole('button', { name: '结束练习', exact:true })).toBeEnabled({timeout:5000});
  await page.getByRole('button',{name:'暂停',exact:true}).click();
  await expect(page.getByText('已暂停', {exact:true})).toBeVisible();
  await page.getByRole('button',{name:'结束练习',exact:true}).click();
  await page.getByRole('button',{name:/更轻松/}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button',{name:'音乐',exact:true}).click();
  await page.getByRole('button',{name:/午后的光/}).click();
  await page.getByRole('button',{name:'播放声音',exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>(window as any).__audioContexts.at(-1)?.state)).toBe('running');
  await page.getByLabel('音量',{exact:true}).fill('0.2');
  await page.getByRole('button',{name:'暂停',exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>(window as any).__audioContexts.at(-1)?.state)).toBe('suspended');
  await page.getByRole('button',{name:'关闭练习'}).click();
  await expect.poll(()=>page.evaluate(()=>(window as any).__audioContexts.at(-1)?.state)).toBe('closed');
  await page.goto('./#/settings');
  await expect(page.getByText('包含 0 篇日记与 1 次关怀反馈，可再次导入')).toBeVisible();
});

test('mobile routes fit screen; draft and reduced motion preference persist', async ({ page }) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto('./');
  await expect(page.getByRole('heading',{name:/今天，也要好好/})).toBeVisible();
  await page.screenshot({path:'.screenshots/mobile-home.png',fullPage:true,animations:'disabled'});
  for(const route of ['journal','insights','care','settings']) {
    await page.goto(`./#/${route}`);
    await expect(page.locator('.loading-state')).toHaveCount(0);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  }
  await page.getByRole('checkbox').check();
  await page.reload();
  await expect(page.locator('html')).toHaveClass(/reduce-motion/);
  await page.goto('./#/journal');
  await page.getByRole('button',{name:'写一篇日记'}).click();
  await page.getByLabel('想对自己说点什么？').fill('尚未保存的草稿');
  await page.getByRole('button',{name:'稍后再写'}).click();
  await page.reload();
  await page.getByRole('button',{name:'写一篇日记'}).click();
  await expect(page.getByLabel('想对自己说点什么？')).toHaveValue('尚未保存的草稿');
  await page.getByRole('button',{name:'稍后再写'}).click();
  await page.locator('.bottom-nav').getByRole('link',{name:'今日心晴'}).click();
  await page.getByRole('button',{name:'记录不错的心情'}).click();
  await expect(page.getByLabel('想对自己说点什么？')).toHaveValue('尚未保存的草稿');
  await expect(page.getByRole('dialog').getByRole('button',{name:'不错',exact:true})).toHaveAttribute('aria-pressed','true');
});

test('cleared demo does not reseed and calendar filters real days',async({page})=>{
  await page.goto('./');
  await page.getByRole('button',{name:'体验示例',exact:true}).click();
  await page.locator('.sidebar').getByRole('link',{name:'情绪日记',exact:true}).click();
  await page.getByRole('button',{name:'日历',exact:true}).click();
  await expect(page.locator('.calendar-day svg').first()).toBeVisible();
  await page.locator('.calendar-day').filter({has:page.locator('svg')}).first().click();
  await expect(page.getByRole('button',{name:/查看全部日期/})).toBeVisible();
  await expect(page.locator('.journal-entry')).toHaveCount(1);
  await page.locator('.sidebar').getByRole('link',{name:'偏好与数据'}).click();
  await page.getByRole('button',{name:'清空数据',exact:true}).click();
  await page.getByRole('button',{name:'确认替换或清空'}).click();
  await expect(page.getByText('包含 0 篇日记与 0 次关怀反馈，可再次导入')).toBeVisible();
  await page.getByRole('button',{name:'返回我的空间'}).click();
  await page.getByRole('button',{name:'体验示例',exact:true}).click();
  await expect(page.getByText('包含 0 篇日记与 0 次关怀反馈，可再次导入')).toBeVisible();
});

