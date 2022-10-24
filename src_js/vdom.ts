import * as snabbdom from 'snabbdom';

import * as u from '@hat-open/util';

export { VNode } from 'snabbdom';


// patched version of snabbdom's modules/attributes.js
const attributesModule: snabbdom.Module = (() => {

    function updateAttrs(oldVnode: snabbdom.VNode, vnode: snabbdom.VNode): void {
        let key: string;
        const elm: Element = vnode.elm as Element;
        let oldAttrs = (oldVnode.data as snabbdom.VNodeData).attrs;
        let attrs = (vnode.data as snabbdom.VNodeData).attrs;

        if (!oldAttrs && !attrs)
            return;
        if (oldAttrs === attrs)
            return;
        oldAttrs = oldAttrs || {};
        attrs = attrs || {};

        for (key in attrs) {
            const cur = attrs[key];
            const old = oldAttrs[key];
            if (old !== cur) {
                if (cur === true) {
                    elm.setAttribute(key, "");
                } else if (cur === false) {
                    elm.removeAttribute(key);
                } else {
                    elm.setAttribute(key, cur as any);
                }
            }
        }

        for (key in oldAttrs) {
            if (!(key in attrs)) {
                elm.removeAttribute(key);
            }
        }
    }

    return { create: updateAttrs, update: updateAttrs };
})();

// patched version of snabbdom's modules/props.js
const propsModule: snabbdom.Module = (() => {

    function updateProps(oldVnode: snabbdom.VNode, vnode: snabbdom.VNode): void {
        let key: string;
        let cur: any;
        let old: any;
        const elm = vnode.elm;
        let oldProps = (oldVnode.data as snabbdom.VNodeData).props;
        let props = (vnode.data as snabbdom.VNodeData).props;

        if (!oldProps && !props)
            return;
        if (oldProps === props)
            return;
        oldProps = oldProps || {};
        props = props || {};

        for (key in oldProps) {
            if (!props[key]) {
                if (key === 'style') {
                    (elm as any)[key] = '';
                } else {
                    delete (elm as any)[key];
                }
            }
        }

        for (key in props) {
            cur = props[key];
            old = oldProps[key];
            if (old !== cur && (key !== "value" || (elm as any)[key] !== cur)) {
                (elm as any)[key] = cur;
            }
        }
    }

    return { create: updateProps, update: updateProps };
})();

export const patch = snabbdom.init([
    attributesModule,
    snabbdom.classModule,
    snabbdom.datasetModule,
    snabbdom.eventListenersModule,
    propsModule,
    snabbdom.styleModule
]);

export function convertVNode(node: u.VNode): snabbdom.VNode {
    if (!u.isVNode(node))
        throw Error("invalid node");
    const data = (u.isVNodeWithData(node) ? node[1] : {});
    const children = u.pipe(
        u.getFlatVNodeChildren,
        u.map<string | u.VNode, string | snabbdom.VNode>(i =>
            u.isString(i) ? i : convertVNode(i)
        )
    )(node);
    return snabbdom.h(node[0], data, children);
}
