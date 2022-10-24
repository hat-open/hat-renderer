import { expect, test } from '@jest/globals';
import * as u from '@hat-open/util';

import { Renderer, ChangeEvent } from '../src_js/index';


test('change', async () => {
    const r = new Renderer();

    expect(r.get()).toEqual(null);

    const p = r.set('abc');
    expect(r.get()).toEqual(null);
    await p;
    expect(r.get()).toEqual('abc');

    let f = u.createFuture<u.JData>();
    r.addEventListener('change', evt =>
        f.setResult((evt as ChangeEvent).detail)
    );
    r.set(['a', 0], 123);
    expect(await f).toEqual({'a': [123]});

    f = u.createFuture<u.JData>();
    r.change(['a', 0], u.inc as any);
    expect(await f).toEqual({'a': [124]});

    expect(r.get()).toEqual({'a': [124]});
});


test('render', async () => {

    const vt = (r: Renderer): u.VNode => {
        if (!r.get())
            return ['body'];
        return ['body',
            [`div#${r.get('id')}.${r.get('class')}`, {
                props: {
                    style: r.get('style')
                }},
                r.get('text')
            ]
        ];
    };

    const r = new Renderer(null, null, vt);

    await r.set({
        id: 'id1',
        class: 'c1',
        style: 'color: red',
        text: 't1'
    });
    r.render();

    expect(document.body.children.length).toEqual(1);
    expect(document.body.children[0].tagName.toLowerCase()).toEqual('div');
    expect(document.body.children[0].id).toEqual('id1');
    expect(document.body.children[0].className).toEqual('c1');
    expect((document.body.children[0] as HTMLElement).style.color).toEqual('red');
    expect(document.body.children[0].textContent).toEqual('t1');
});
