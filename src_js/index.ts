import * as u from '@hat-open/util';

import * as vdom from './vdom';


export type VtFn = (r?: Renderer) => u.VNode;
export type ChangeFn = (x: u.JData) => u.JData;


/**
 * Virtual DOM renderer
 */
export class Renderer extends EventTarget {
    _state: u.JData = null;
    _changes: [u.JPath, ChangeFn][] = [];
    _promise: Promise<void> | null = null;
    _timeout: number | null = null;
    _lastRender: number | null = null;
    _vtCb: VtFn | null = null;
    _maxFps = 30;
    _vNode: Element | vdom.VNode = document.body;

    /**
     * Calls `init` method
     */
    constructor(
        el: Element | null = null,
        initState: u.JData = null,
        vtCb: VtFn | null = null,
        maxFps = 30
    ) {
        super();
        this.init(el, initState, vtCb, maxFps);
    }

    /**
     * Initialize renderer
     *
     * If `el` is `null`, document body is used.
     */
    init(
        el: Element | null,
        initState: u.JData = null,
        vtCb: VtFn | null = null,
        maxFps = 30
    ): Promise<void> {
        this._state = null;
        this._changes = [];
        this._promise = null;
        this._timeout = null;
        this._lastRender = null;
        this._vtCb = vtCb;
        this._maxFps = maxFps;
        this._vNode = el || document.body;
        if (u.isNil(initState))
            return new Promise(resolve => { resolve(); });
        return this.set(initState);
    }

    /**
      * Render
      */
    render() {
        if (!this._vtCb)
            return;
        this._lastRender = performance.now();
        const vNode = vdom.convertVNode(this._vtCb(this));
        vdom.patch(this._vNode, vNode);
        this._vNode = vNode;
        this.dispatchEvent(new CustomEvent('render', {detail: this._state}));
    }

    /**
     * Get current state value referenced by `paths`
     */
    get(...paths: u.JPath[]): u.JData {
        return u.get(paths, this._state);
    }

    /**
     * Set current state value referenced by `path`
     *
     * If `path` is not provided, `[]` is assumed.
     */
    set(value: u.JData): Promise<void>;
    set(path: u.JPath, value: u.JData): Promise<void>;
    set(x: (u.JData | u.JPath), y?: u.JData) {
        const path = (arguments.length < 2 ? [] : x) as u.JPath;
        const value = (arguments.length < 2 ? x : y) as u.JData;
        return this.change(path, _ => value);
    }

    /**
     * Change current state value referenced by `path`
     *
     * If `path` is not provided, `[]` is assumed.
     */
    change(cb: ChangeFn): Promise<void>;
    change(path: u.JPath, cb: ChangeFn): Promise<void>;
    change(x: (ChangeFn | u.JPath), y?: ChangeFn) {
        const path = (arguments.length < 2 ? [] : x) as u.JPath;
        const cb = (arguments.length < 2 ? x : y) as ChangeFn;
        this._changes.push([path, cb]);
        if (this._promise)
            return this._promise;
        this._promise = new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    this._change();
                } catch(e) {
                    this._promise = null;
                    reject(e);
                    throw e;
                }
                this._promise = null;
                resolve();
            }, 0);
        });
        return this._promise;
    }

    _change() {
        while (this._changes.length > 0) {
            let change = false;
            while (this._changes.length > 0) {
                const [path, cb] = this._changes.shift() as [u.JPath, ChangeFn];
                const view = u.get(path);
                const oldState = this._state;
                this._state = u.change(path, cb, this._state);
                if (this._state && u.equals(view(oldState),
                                            view(this._state)))
                    continue;
                change = true;
                if (!this._vtCb || this._timeout)
                    continue;
                const delay = (!this._lastRender || !this._maxFps ?
                    0 :
                    (1000 / this._maxFps) -
                    (performance.now() - this._lastRender));
                this._timeout = setTimeout(() => {
                    this._timeout = null;
                    this.render();
                }, (delay > 0 ? delay : 0));
            }
            if (change)
                this.dispatchEvent(
                    new CustomEvent('change', {detail: this._state}));
        }
    }
}

interface DefaultRendererParent {
    __hat_default_renderer: Renderer | undefined;
}

/**
 * Default renderer
 */
const defaultRenderer: Renderer = (() => {
    if (!window)
        return new Renderer();
    const parent = (window as unknown) as DefaultRendererParent;
    if (!parent.__hat_default_renderer)
        parent.__hat_default_renderer = new Renderer();
    return parent.__hat_default_renderer;
})();
export default defaultRenderer;
