
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.38.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    const words = [
      'KANAL',
      'ARABESK',
      'KARINCA',
      'GÖZ',
      'KALE',
      'POKER',
      'EJDERHA',
      'SAVAŞ',
      'BAL',
      'BOMBA',
      'KUMARHANE',
      'GÖKDELEN',
      'SATÜRN',
      'UZAYLI',
      'KIRBAÇ',
      'ANTARTİKA',
      'KARDAN ADAM',
      'KONSER',
      'ÇİKOLATA',
      'JET',
      'MİLYONER',
      'DİNOZOR',
      'DÜDÜK',
      'KORSAN',
      'PENGUEN',
      'ÖRÜMCEK',
      'KONSOLOSLUK',
      'TABANCA',
      'HASTALIK',
      'AJAN',
      'PRENSES',
      'DAHİ',
      'HIRSIZ',
      'OPERA',
      'ŞÖVALYE',
      'STADYUM',
      'LİMUZİN',
      'HAYALET',
      'KAMYONET',
      'DONDURMA',
      'LAZER',
      'ÖLÜM',
      'HASTANE',
      'AMBULANS',
      'AHTAPOT',
      'HELİKOPTER',
      'KANGURU',
      'MİKROSKOP',
      'TARZAN',
      'KAHRAMAN',
      'TELESKOP',
      'PARAŞÜT',
      'KAYNANA',
      'NEMRUT',
      'UYDU',
      'MELEK',
      'ROBOT',
      'AZRAİL',
      'CADI',
      'MEZARCI',
      'DALGIÇ',
      'ZEHİR',
      'KÖPRÜ',
      'ATEŞ',
      'MASA',
      'BALİNA',
      'AY',
      'BALIK',
      'DOKTOR',
      'CAMİ',
      'KEMER',
      'HEMŞİRE',
      'RÜZGAR',
      'ÇİZME',
      'PARK',
      'ALBÜM',
      'SİMİT',
      'TAŞ',
      'ŞOK',
      'BEYAZ',
      'HESAP',
      'KUPON',
      'MORS',
      'PALET',
      'REJİM',
      'PARTİ',
      'MAKAS',
      'KÖSTEBEK',
      'TAMPON',
      'PİLİÇ',
      'MANTAR',
      'ÖRGÜ',
      'NUMARA',
      'KUYRUK',
      'ALAY',
      'MACUN',
      'TARLA',
      'SATIR',
      'CEP',
      'PİKE',
      'SIRT',
      'TOPUZ',
      'TULUM',
      'POSTA',
      'TERAZİ',
      'SİTE',
      'VİZE',
      'TORPİL',
      'KAPTAN',
      'ATLAS',
      'KÜME',
      'CİLT',
      'BOY',
      'KURŞUN',
      'BANKO',
      'MAT',
      'BOĞAZ',
      'DİYET',
      'DOĞRU',
      'DÖVİZ',
      'KÖPEK',
      'AT',
      'AYAKKABI',
      'SANDALYE',
      'TAHT',
      'BUZ',
      'ALTIN',
      'ÇATAL',
      'ZAMAN',
      'FLÜT',
      'FENER',
      'YASTIK',
      'TESBİH',
      'ASKER',
      'PİRAMİT',
      'HALAT',
      'YILDIZ',
      'OCAK',
      'EKMEK',
      'YÜREK',
      'BLOK',
      'KUPA',
      'İĞNE',
      'DON',
      'ÖRTÜ',
      'KABUK',
      'BAYRAM',
      'PERDE',
      'BALTA',
      'YAKA',
      'DÜĞME',
      'AĞIZ',
      'ETİKET',
      'EL',
      'YATAK',
      'DUVAR',
      'KULE',
      'KART',
      'BAĞ',
      'YAY',
      'ORTA',
      'İNTERNET',
      'KAYMAK',
      'PAS',
      'DAMAT',
      'DELİK',
      'NİŞAN',
      'KUVVET',
      'ANAHTAR',
      'MOTOR',
      'DALGA',
      'AKIM',
      'BAŞ',
      'İSKELE',
      'ÇEKİRDEK',
      'KAZA',
      'DÜŞ',
      'KAZIK',
      'PUL',
      'DAİRE',
      'AĞ',
      'İSTANBUL',
      'AVUSTRALYA',
      'KIBRIS',
      'TOKYO',
      'MISIR',
      'REKLAM',
      'KAVURMA',
      'MOSKOVA',
      'DÖVME',
      'MEVLANA',
      'HOLLYWOOD',
      'BİZANS',
      'ROMA',
      'NİNJA',
      'LAZ',
      'MANGO',
      'ALMANYA',
      'DEVLET',
      'AMERİKA',
      'MEZOPOTAMYA',
      'İNGİLTERE',
      'SURVİVOR',
      'KRİZ',
      'MECNUN',
      'EŞKİYA',
      'NAL',
      'GULYABANİ',
      'İRAN',
      'BERLİN',
      'AVRUPA',
      'HİNDİSTAN',
      'ÇEYİZ',
      'EVEREST',
      'KALPAZAN',
      'PEKİN',
      'KARTAL',
      'PAZI',
      'BAKLAVA',
      'HİTİT',
      'YAŞ',
      'ATLET',
      'DİZİ',
      'BASKI',
      'DERECE',
      'DOLU',
      'TABLET',
      'YEŞİL',
      'ALEM',
      'MARŞ',
      'KUŞAK',
      'BOZUK',
      'MAKARA',
      'AĞAÇ',
      'BOT',
      'ZAR',
      'ORDU',
      'GÖÇ',
      'SERVİS',
      'MARS',
      'GÖBEK',
      'FESTİVAL',
      'OMURGA',
      'ÇATI',
      'DÜMEN',
      'İZ',
      'TAKIM',
      'ÇAY',
      'KANUN',
      'FAN',
      'FIRÇA',
      'KAHVE',
      'TAVLA',
      'GÜL',
      'ANA',
      'KOCA',
      'MASKARA',
      'PAZAR',
      'TEZ',
      'MAYA',
      'UŞAK',
      'MEMUR',
      'KEPÇE',
      'BEYİN',
      'KLASİK',
      'KOVAN',
      'PALA',
      'SOĞUK',
      'ASLAN',
      'TOP',
      'BANKA',
      'HAVA',
      'TAVŞAN',
      'PASTA',
      'ELBİSE',
      'ÇİMEN',
      'CÜCE',
      'ORMAN',
      'ARABA',
      'ELDİVEN',
      'BERE',
      'BENZİN',
      'AŞÇI',
      'AYI',
      'KEDİ',
      'HAYAT',
      'PİRİNÇ',
      'DEV',
      'YÜZ',
      'PLAJ',
      'OTEL',
      'SU',
      'KAĞIT',
      'SOLUCAN',
      'AVUKAT',
      'BİLİM ADAMI',
      'DANS',
      'HAVUÇ',
      'SEPET',
      'GECE',
      'PAMUK',
      'AYAK',
      'FARE',
      'BIÇAK',
      'TİYATRO',
      'POLİS',
      'GEMİ',
      'PİLOT',
      'PARMAK',
      'ÖĞRETMEN',
      'ŞİŞE',
      'GÜN',
      'KRAL',
      'BARDAK',
      'ELMAS',
      'DİŞ',
      'KOPYA',
      'DARBE',
      'FİLM',
      'GIRGIR',
      'ARPACIK',
      'HORTUM',
      'IZGARA',
      'TORPİDO',
      'KEPEK',
      'GICIK',
      'KESE',
      'KISIR',
      'KOLON',
      'KULAÇ',
      'GAZİNO',
      'FELEK',
      'KAVAL',
      'KİTAP',
      'TIP',
      'KAYNAK',
      'GARAJ',
      'PAÇA',
      'LASTİK',
      'SAZ',
      'SET',
      'FAR',
      'KUTU',
      'KANEPE',
      'MAKAM',
      'ŞANS',
      'MERKEZ',
      'ÜNLÜ',
      'DEVİR',
      'DÜĞÜN',
      'TABLO',
      'GÖLGE',
      'GAZ',
      'HAZİNE',
      'KÖY',
      'MODA',
      'HAVUZ',
      'MAGAZİN',
      'KÜPE',
      'FATURA',
      'SAYFA',
      'ÇAMAŞIR',
      'TUR',
      'AMAZON',
      'SAHTE',
      'OYUNCAK',
      'SIRA',
      'FORM',
      'KARE',
      'KAŞ',
      'SANDIK',
      'ACI',
      'TREN',
      'SOSYETE',
      'ÖRGÜT',
      'SÖZ',
      'UÇAK',
      'ADET',
      'BALKON',
      'ÇOBAN',
      'AYNA',
      'KURU',
      'DELİ',
      'YAZ',
      'NOT',
      'BÖLÜM',
      'ŞERİT',
      'YUNANİSTAN',
      'HÜCRE',
      'MEZUNİYET',
      'FAUL',
      'LONDRA',
      'MUCİZE',
      'TEMEL',
      'AFRİKA',
      'BİLYE',
      'YAĞMUR',
      'KUYU',
      'KANAT',
    ].filter((i) => i.length < 9);

    function shuffle(array) {
      const temp = Array.from(array);
      var currentIndex = temp.length,
        temporaryValue,
        randomIndex;

      while (0 !== currentIndex) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        temporaryValue = temp[currentIndex];
        temp[currentIndex] = temp[randomIndex];
        temp[randomIndex] = temporaryValue;
      }

      return temp;
    }

    const wordIndexes = words.map((w, i) => i);

    function generateRandomGame() {
      const isRed = Math.random() > 0.5;
      const wordIndexesList = shuffle(
        shuffle(wordIndexes)
          .slice(0, 25)
          .map((index, position) => `${index},${position}`)
      );

      return {
        words: wordIndexesList,
        isRed,
        openedIndex: [],
      };
    }

    const WORD_TYPES = {
      RED: 'red',
      BLUE: 'blue',
      SNIPER: 'sniper',
      NEUTRAL: 'neutral',
    };

    function getWordTypeByPosition(position, isRed) {
      if (position === 0) {
        return WORD_TYPES.SNIPER;
      }

      if (position < 10) {
        return isRed ? WORD_TYPES.RED : WORD_TYPES.BLUE;
      }
      if (position < 18) {
        return !isRed ? WORD_TYPES.RED : WORD_TYPES.BLUE;
      }
      return WORD_TYPES.NEUTRAL;
    }

    function buildGameConfig({ isRed, words: wordList, openedIndex }) {
      return {
        isRed,
        words: wordList
          .map((i) => i.split(',').map((i) => parseInt(i, 10)))
          .map(([index, position]) => ({
            text: words[index],
            opened: openedIndex.indexOf(index) > -1,
            type: getWordTypeByPosition(position, isRed),
            index,
            position,
          })),
      };
    }

    const GAME_URL = 'https://api.npoint.io/9aa25654a04bb9f8393e';
    const gameId = window.location.pathname.replace('/', '') || 'main';

    const _data = writable({});

    const rawData = derived(_data, ($data) => $data[gameId]);
    const data = derived(rawData, ($rawData) =>
      $rawData ? buildGameConfig($rawData) : $rawData
    );

    function setData(newData) {
      _data.update((prev) => {
        fetch(GAME_URL, {
          method: 'POST',
          body: JSON.stringify({
            ...prev,
            [gameId]: newData,
          }),
        });

        return { ...prev, [gameId]: newData };
      });
    }
    function openWord(index) {
      const prev = get_store_value(rawData);
      setData({
        ...prev,
        openedIndex: [...prev.openedIndex, index].filter(
          (value, index, self) => self.indexOf(value) === index
        ),
      });
    }

    function getHandler() {
      fetch(GAME_URL)
        .then((j) => j.json())
        .then((json) => {
          _data.set(json);

          if (!json[gameId]) {
            setData(generateRandomGame());
          }
        });
    }

    getHandler();
    setInterval(getHandler, 2000);

    /* src\Game.svelte generated by Svelte v3.38.2 */

    const file$3 = "src\\Game.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (8:2) {#each data.words as word}
    function create_each_block(ctx) {
    	let div;
    	let t0_value = /*word*/ ctx[4].text + "";
    	let t0;
    	let t1;
    	let div_class_value;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[3](/*word*/ ctx[4]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(div, "class", div_class_value = "word " + /*word*/ ctx[4].type + " svelte-1xqtfrk");
    			toggle_class(div, "opened", /*word*/ ctx[4].opened);
    			toggle_class(div, "detail", /*isKeyScreen*/ ctx[1]);
    			add_location(div, file$3, 8, 4, 203);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*data*/ 1 && t0_value !== (t0_value = /*word*/ ctx[4].text + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*data*/ 1 && div_class_value !== (div_class_value = "word " + /*word*/ ctx[4].type + " svelte-1xqtfrk")) {
    				attr_dev(div, "class", div_class_value);
    			}

    			if (dirty & /*data, data*/ 1) {
    				toggle_class(div, "opened", /*word*/ ctx[4].opened);
    			}

    			if (dirty & /*data, isKeyScreen*/ 3) {
    				toggle_class(div, "detail", /*isKeyScreen*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(8:2) {#each data.words as word}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div;
    	let each_value = /*data*/ ctx[0].words;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "game svelte-1xqtfrk");
    			toggle_class(div, "border", /*isKeyScreen*/ ctx[1]);
    			toggle_class(div, "red", /*data*/ ctx[0].isRed);
    			add_location(div, file$3, 6, 0, 101);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*data, isKeyScreen, onWordClick*/ 7) {
    				each_value = /*data*/ ctx[0].words;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*isKeyScreen*/ 2) {
    				toggle_class(div, "border", /*isKeyScreen*/ ctx[1]);
    			}

    			if (dirty & /*data*/ 1) {
    				toggle_class(div, "red", /*data*/ ctx[0].isRed);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Game", slots, []);
    	let { data } = $$props;
    	let { isKeyScreen } = $$props;
    	let { onWordClick = () => 0 } = $$props;
    	const writable_props = ["data", "isKeyScreen", "onWordClick"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Game> was created with unknown prop '${key}'`);
    	});

    	const click_handler = word => onWordClick(word);

    	$$self.$$set = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("isKeyScreen" in $$props) $$invalidate(1, isKeyScreen = $$props.isKeyScreen);
    		if ("onWordClick" in $$props) $$invalidate(2, onWordClick = $$props.onWordClick);
    	};

    	$$self.$capture_state = () => ({ data, isKeyScreen, onWordClick });

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("isKeyScreen" in $$props) $$invalidate(1, isKeyScreen = $$props.isKeyScreen);
    		if ("onWordClick" in $$props) $$invalidate(2, onWordClick = $$props.onWordClick);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [data, isKeyScreen, onWordClick, click_handler];
    }

    class Game extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { data: 0, isKeyScreen: 1, onWordClick: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Game",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*data*/ ctx[0] === undefined && !("data" in props)) {
    			console.warn("<Game> was created without expected prop 'data'");
    		}

    		if (/*isKeyScreen*/ ctx[1] === undefined && !("isKeyScreen" in props)) {
    			console.warn("<Game> was created without expected prop 'isKeyScreen'");
    		}
    	}

    	get data() {
    		throw new Error("<Game>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<Game>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isKeyScreen() {
    		throw new Error("<Game>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isKeyScreen(value) {
    		throw new Error("<Game>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onWordClick() {
    		throw new Error("<Game>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onWordClick(value) {
    		throw new Error("<Game>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\GameScreen.svelte generated by Svelte v3.38.2 */
    const file$2 = "src\\GameScreen.svelte";

    // (8:0) {:else}
    function create_else_block$1(ctx) {
    	let h1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Oyunun Yuklenmesi bekleniyor";
    			add_location(h1, file$2, 8, 2, 155);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(8:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (6:0) {#if $data}
    function create_if_block$2(ctx) {
    	let game;
    	let current;

    	game = new Game({
    			props: {
    				data: /*$data*/ ctx[0],
    				isKeyScreen: false
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(game.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(game, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const game_changes = {};
    			if (dirty & /*$data*/ 1) game_changes.data = /*$data*/ ctx[0];
    			game.$set(game_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(game.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(game.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(game, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(6:0) {#if $data}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$2, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$data*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $data;
    	validate_store(data, "data");
    	component_subscribe($$self, data, $$value => $$invalidate(0, $data = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("GameScreen", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<GameScreen> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ data, Game, $data });
    	return [$data];
    }

    class GameScreen extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "GameScreen",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    const settingsIconBase64 = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAMAAACdt4HsAAAAkFBMVEUAAAD82rf82rf82rf82rf82rf82rf82rf82rf82rf82rf82rf82rf82rf82rf82rf82rf82rf82rf82rf82rf82rf82rf82rf82rf82rf82rf82rf82rf82rf82rf82rf82rf82rf82rf82rf82rf82rf82rf82rf82rf82rf82rf82rf82rf82rf82rf82ree4xsFAAAAL3RSTlMATfX7czNuZijs5LKaizvLENwL8acDxhjBt6KBFEWFVxwG1ayUeGAtIFLRrZAj3pstHdUAAAMmSURBVFjD3VfXkuIwELScc8DZGJbMLbCn//+7Q2GcJK8Xqu5l+wUzoruk1gSs/Gr8QR3Kd/iNhjtowev8NR7h8rJAMRY4/pxps49oLOBxX5Z3nmJ1/fzcuU9WhCiS5+OhfQZPKnas7/kBJnigijrYsGBFfaw3GV00F/k9NixqjaPmj/lezsJ5JFNY5p9WsBBngsI830E38uHqI8PtdUqi9acKCrN8W8k3loX20+UVsqwwV8JZhTXwF8AVxNtMBX6pe0n6jB3uVisoOFP+F9wbwKgHxaR6137FpCGhQKnuLe9853SA5sOd7P/CDiQewBZCFwtI+PEuc9X56L35TDnJvQfB0YFzhHTRJ8+6IgJ1AmHKCOcvngRblQXsTsCYsqFkEDk/238T92s7j51iBR42In9HXHPJLzLZRZ9pMCD6KfG0nThYRC4czdCAL5qs2XCGJCoG2diA0yT/a9kWIe4/H67w623XvzWoP5J/5IsaS86o0gWQGp4DQf0TB3TydJb2+c5laLjGUCBqNjQNqd9fMgEDbFRylB0EAcS/JOQyFClIRhX8WZcKQFXe50eFuyjA9ikCTvf/BZz5ORb96AgHWbH39lSzAkll0Wu8ky+2tBt22bfXC3cswBDFMIa2MoEjdJxdMkmkElI5I2lGM3Yn8m2a4yta+AxaLIwkG7z2JBbC1kLJgLocPZqba1JsmlgNUMRaCf0i8jKkjNASXhrDT/F6yod+UapEaTVT70R1xTyqBz7YbD5Xe+hNJ0XEpmtENu+hDXc5PDKXk7Lby1UikFEBmF4MTuF5UToYDCDwEPknTBDyLSdYQMWH2Qe4IRttdQ7DPJiONh0Gfn6j5xP+12LwEHzz1Z6ubgezVKehVmw3ML0AMQpIs3er7WZ4aZ8qljYtC+bfLIDP9yrABIX9xfdNIVHis+9/5MD/gLBEwaTzP/VHVx1mlHjTBb6g0KPufNpVwzjwlxUKfqn7RMpfVgCndIG/pKAbjQYNBl4dtNP1IfJFWA52LqS66X98nYL+86dzU8UuUpZQfvfC0b79ypMtEhb9fBnb4WufqbyB1ugQK78Z/wBe6dm7Vcki+wAAAABJRU5ErkJggg==`;

    /* src\KeyScreen.svelte generated by Svelte v3.38.2 */
    const file$1 = "src\\KeyScreen.svelte";

    // (36:0) {:else}
    function create_else_block(ctx) {
    	let h1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Oyunun Yuklenmesi bekleniyor";
    			add_location(h1, file$1, 36, 2, 881);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(36:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (21:0) {#if $data}
    function create_if_block$1(ctx) {
    	let game;
    	let t0;
    	let img;
    	let img_src_value;
    	let t1;
    	let div1;
    	let div0;
    	let button0;
    	let t3;
    	let button1;
    	let current;
    	let mounted;
    	let dispose;

    	game = new Game({
    			props: {
    				data: /*$data*/ ctx[1],
    				isKeyScreen: true,
    				onWordClick: /*handleWordClick*/ ctx[4]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(game.$$.fragment);
    			t0 = space();
    			img = element("img");
    			t1 = space();
    			div1 = element("div");
    			div0 = element("div");
    			button0 = element("button");
    			button0.textContent = "Yeni Oyun Baslat";
    			t3 = space();
    			button1 = element("button");
    			button1.textContent = "Kapat";
    			if (img.src !== (img_src_value = settingsIconBase64)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "settings icon");
    			attr_dev(img, "class", "settings svelte-bff7bu");
    			add_location(img, file$1, 22, 2, 550);
    			attr_dev(button0, "class", "svelte-bff7bu");
    			add_location(button0, file$1, 31, 6, 735);
    			attr_dev(button1, "class", "svelte-bff7bu");
    			add_location(button1, file$1, 32, 6, 802);
    			attr_dev(div0, "class", "svelte-bff7bu");
    			add_location(div0, file$1, 30, 4, 723);
    			attr_dev(div1, "class", "settings svelte-bff7bu");
    			toggle_class(div1, "hidden", !/*showSettings*/ ctx[0]);
    			add_location(div1, file$1, 29, 2, 667);
    		},
    		m: function mount(target, anchor) {
    			mount_component(game, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, img, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, button0);
    			append_dev(div0, t3);
    			append_dev(div0, button1);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(img, "click", /*toggleSettings*/ ctx[2], false, false, false),
    					listen_dev(button0, "click", /*generateNewGame*/ ctx[3], false, false, false),
    					listen_dev(button1, "click", /*toggleSettings*/ ctx[2], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			const game_changes = {};
    			if (dirty & /*$data*/ 2) game_changes.data = /*$data*/ ctx[1];
    			game.$set(game_changes);

    			if (dirty & /*showSettings*/ 1) {
    				toggle_class(div1, "hidden", !/*showSettings*/ ctx[0]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(game.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(game.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(game, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(img);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(21:0) {#if $data}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$1, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$data*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $data;
    	validate_store(data, "data");
    	component_subscribe($$self, data, $$value => $$invalidate(1, $data = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("KeyScreen", slots, []);
    	let showSettings = false;

    	function toggleSettings() {
    		$$invalidate(0, showSettings = !showSettings);
    	}

    	function generateNewGame() {
    		setData(generateRandomGame());
    		toggleSettings();
    	}

    	function handleWordClick({ index }) {
    		openWord(index);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<KeyScreen> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		setData,
    		data,
    		openWord,
    		Game,
    		settingsIconBase64,
    		generateRandomGame,
    		showSettings,
    		toggleSettings,
    		generateNewGame,
    		handleWordClick,
    		$data
    	});

    	$$self.$inject_state = $$props => {
    		if ("showSettings" in $$props) $$invalidate(0, showSettings = $$props.showSettings);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [showSettings, $data, toggleSettings, generateNewGame, handleWordClick];
    }

    class KeyScreen extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "KeyScreen",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.38.2 */
    const file = "src\\App.svelte";

    // (23:25) 
    function create_if_block_2(ctx) {
    	let keyscreen;
    	let current;
    	keyscreen = new KeyScreen({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(keyscreen.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(keyscreen, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(keyscreen.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(keyscreen.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(keyscreen, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(23:25) ",
    		ctx
    	});

    	return block;
    }

    // (21:26) 
    function create_if_block_1(ctx) {
    	let gamescreen;
    	let current;
    	gamescreen = new GameScreen({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(gamescreen.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(gamescreen, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(gamescreen.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(gamescreen.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(gamescreen, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(21:26) ",
    		ctx
    	});

    	return block;
    }

    // (16:0) {#if page === 'app'}
    function create_if_block(ctx) {
    	let div2;
    	let div0;
    	let t1;
    	let div1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			div0.textContent = "Oyun Ekrani";
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "Anahtar Ekrani";
    			attr_dev(div0, "class", "svelte-3ov8kr");
    			add_location(div0, file, 17, 4, 284);
    			attr_dev(div1, "class", "svelte-3ov8kr");
    			add_location(div1, file, 18, 4, 333);
    			attr_dev(div2, "class", "container svelte-3ov8kr");
    			add_location(div2, file, 16, 2, 256);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(div0, "click", /*gameScreen*/ ctx[1], false, false, false),
    					listen_dev(div1, "click", /*keyScreen*/ ctx[2], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(16:0) {#if page === 'app'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_if_block_1, create_if_block_2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*page*/ ctx[0] === "app") return 0;
    		if (/*page*/ ctx[0] === "game") return 1;
    		if (/*page*/ ctx[0] === "key") return 2;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(target, anchor);
    			}

    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					} else {
    						if_block.p(ctx, dirty);
    					}

    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d(detaching);
    			}

    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let page = "app";

    	function gameScreen() {
    		$$invalidate(0, page = "game");
    	}

    	function keyScreen() {
    		$$invalidate(0, page = "key");
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		GameScreen,
    		KeyScreen,
    		page,
    		gameScreen,
    		keyScreen
    	});

    	$$self.$inject_state = $$props => {
    		if ("page" in $$props) $$invalidate(0, page = $$props.page);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [page, gameScreen, keyScreen];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    var app = new App({
      target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
