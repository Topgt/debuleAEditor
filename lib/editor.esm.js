import React from 'react';
import { EditorState, CharacterMetadata, Modifier, SelectionState, AtomicBlockUtils, RichUtils, convertToRaw, Editor, DefaultDraftBlockRenderMap } from 'draft-js';
import Immutable, { OrderedSet, Map } from 'immutable';
import _ from 'lodash';
import classnames from 'classnames';

class MyEvent {
    constructor() {
        this.events = {};
        this.finishs = [];
    }
    on(evt, ...handlers) {
        this.events[evt] = this.events[evt] || [];
        this.events[evt].push(...handlers);
    }
    onOne(eventName, ...handlers) {
        const name = `one-${eventName}`;
        this.events[name] = [...handlers];
    }
    fireFinish(handler) {
        this.finishs.push(handler);
    }
    working(eventName, params, handler) {
        const result = typeof handler === 'function' && handler(...params);
        this.finishs.forEach(handler => typeof handler === 'function' && handler(eventName, params, result));
    }
    fire(eventName, ...args) {
        const eventNames = Object.keys(this.events);
        if (!eventNames.includes(eventName) && !eventNames.includes(`one-${eventName}`)) {
            return;
        }
        if (eventNames.includes(`one-${eventName}`)) {
            this.events[`one-${eventName}`].forEach(handler => this.working(eventName, args, handler));
        }
        this.events[eventName].forEach(handler => this.working(eventName, args, handler));
    }
}

class Stack {
    constructor(length, init) {
        this.stack = [];
        this.cursor = 0;
        this.top = 0;
        this.bottom = 0;
        this.length = 0;
        this.length = length;
        init && this.stack.push(init);
    }
    undo() {
        if (this.isBottom()) {
            return undefined;
        }
        {
            const idx = (this.cursor - 1 + this.length) % this.length;
            this.cursor = idx;
            return this.stack[this.cursor];
        }
    }
    redo() {
        if (this.isTop()) {
            return undefined;
        }
        else {
            const idx = (this.cursor + 1) % this.length;
            this.cursor = idx;
            return this.stack[this.cursor];
        }
    }
    push(item) {
        const idx = (this.cursor + 1) % this.length;
        this.top = this.cursor = idx;
        this.stack[this.cursor] = item;
        if (idx === this.bottom) {
            this.bottom = (idx + 1) % this.length;
        }
    }
    isTop() {
        return this.top === this.cursor;
    }
    isBottom() {
        return this.bottom === this.cursor;
    }
}

const removeBlockStyle = (contentBlock, rule) => {
    const characterList = contentBlock.getCharacterList();
    const nweCharacterList = characterList.map((character) => {
        const inlineStyle = character.getStyle();
        let newCharacter = character;
        inlineStyle.forEach((style) => {
            if (!!character && !!style && rule.test(style)) {
                newCharacter = CharacterMetadata.removeStyle(newCharacter, style);
            }
        });
        return newCharacter;
    });
    const newContentBlock = contentBlock.set('characterList', nweCharacterList);
    return newContentBlock;
};
const removeInlineStyle = (editorState, rule) => {
    let inlineStyles = [];
    const contentState = editorState.getCurrentContent();
    const selectState = editorState.getSelection();
    const startKey = selectState.getStartKey();
    const endKey = selectState.getEndKey();
    let key = '';
    while (key !== endKey && key !== undefined) {
        key = contentState.getKeyAfter(key || startKey) || startKey;
        const block = contentState.getBlockForKey(key || startKey);
        const list = block.getCharacterList();
        list.forEach((d) => {
            inlineStyles.push(...d.getStyle().toJS());
        });
    }
    inlineStyles = [...new Set(inlineStyles)];
    let newContentState = contentState;
    inlineStyles.forEach(ss => newContentState = rule.test(ss) ? Modifier.removeInlineStyle(newContentState, selectState, ss) : newContentState);
    return EditorState.push(editorState, newContentState, 'change-inline-style');
};
const applyInlineStyle = (editorState, styles) => {
    const newEditorState = removeInlineStyle(editorState, /.*/);
    const contentState = newEditorState.getCurrentContent();
    const selectState = newEditorState.getSelection();
    let newContentState = contentState;
    styles.forEach(ss => newContentState = Modifier.applyInlineStyle(newContentState, selectState, ss));
    return EditorState.push(newEditorState, newContentState, 'change-inline-style');
};
const insertText = (editorState, text = '‎', styles) => {
    const inlineStyles = editorState.getCurrentInlineStyle().toJS();
    const contentState = editorState.getCurrentContent();
    const selectState = editorState.getSelection();
    let draftInlineStyle = OrderedSet(inlineStyles);
    styles.forEach(ss => draftInlineStyle = draftInlineStyle.has(ss) ? draftInlineStyle.delete(ss) : draftInlineStyle.add(ss));
    const newContentState = Modifier.insertText(contentState, selectState, text, draftInlineStyle);
    let nextState = EditorState.createWithContent(newContentState);
    const key = selectState.getAnchorKey();
    const length = selectState.getFocusOffset() + text.length;
    const nextSelectState = new SelectionState({
        anchorKey: key,
        anchorOffset: length,
        focusKey: key,
        focusOffset: length,
    });
    nextState = EditorState.acceptSelection(nextState, nextSelectState);
    return nextState;
};
const addEntity = (editorState, url, type) => {
    const urlType = type.toLocaleUpperCase();
    const contentState = editorState.getCurrentContent();
    const contentStateWithEntity = contentState.createEntity(urlType, 'IMMUTABLE', { src: url });
    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
    const newEditorState = AtomicBlockUtils.insertAtomicBlock(editorState, entityKey, ' ');
    return EditorState.forceSelection(newEditorState, newEditorState.getCurrentContent().getSelectionAfter());
};
const createFnHooks = (methodName, plugins) => (...newArgs) => {
    if (methodName === 'blockRendererFn') {
        let block = { props: {} };
        plugins.forEach(plugin => {
            const result = typeof plugin === 'function'
                ? plugin(...newArgs)
                : undefined;
            if (result !== undefined && result !== null) {
                const { props: pluginProps, ...pluginRest } = result;
                const { props, ...rest } = block;
                block = {
                    ...rest,
                    ...pluginRest,
                    props: { ...props, ...pluginProps },
                };
            }
        });
        return block.component ? block : false;
    }
    else if (methodName === 'blockStyleFn') {
        let styles;
        plugins.forEach(plugin => {
            const result = typeof plugin[methodName] === 'function'
                ? plugin[methodName](...newArgs)
                : undefined;
            if (result !== undefined && result !== null) {
                styles = (styles ? `${styles} ` : '') + result;
            }
        });
        return styles || '';
    }
    let result;
    const wasHandled = plugins.some(plugin => {
        result = typeof plugin[methodName] === 'function'
            ? plugin[methodName](...newArgs)
            : undefined;
        return result !== undefined;
    });
    return wasHandled ? result : false;
};

const BlockWrapper = (props) => {
    return (React.createElement(React.Fragment, null, React.Children.map(props.children, (target, i) => {
        const targetChildren = _.get(target, 'props.children', {});
        const block = _.get(targetChildren, 'props.block', {});
        const style = block.data.toJS() || {};
        if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(target.type)) {
            const newChildren = React.Children.map(targetChildren, (child, i) => {
                const block = _.get(child, 'props.block', {});
                const newBlock = removeBlockStyle(block, /^\d{1,2}px$/);
                return React.cloneElement(child, { block: newBlock });
            });
            return React.cloneElement(target, { style: style, key: i, children: newChildren });
        }
        return React.cloneElement(target, { style: style, key: i });
    })));
};

function styleInject(css, ref) {
  if (ref === void 0) ref = {};
  var insertAt = ref.insertAt;

  if (!css || typeof document === 'undefined') {
    return;
  }

  var head = document.head || document.getElementsByTagName('head')[0];
  var style = document.createElement('style');
  style.type = 'text/css';

  if (insertAt === 'top') {
    if (head.firstChild) {
      head.insertBefore(style, head.firstChild);
    } else {
      head.appendChild(style);
    }
  } else {
    head.appendChild(style);
  }

  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }
}

var css_248z = ".style_iconfont__1YWrI {\n  font-family: \"iconfont\" !important;\n  font-size: 16px;\n  font-style: normal;\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n}\n";
var style = {"iconfont":"style_iconfont__1YWrI"};
styleInject(css_248z);

const Icon = (props) => {
    const { fontIcon } = props;
    return React.createElement("span", { className: style.iconfont, dangerouslySetInnerHTML: { __html: `${fontIcon}` } });
};

const blockRenderMap = Immutable.Map({
    'unstyled': {
        element: 'div',
        wrapper: React.createElement("div", null),
        aliasedElements: ['p'],
    },
    'header-one': {
        element: 'h1',
        wrapper: React.createElement(BlockWrapper, null)
    },
    'header-two': {
        element: 'h2',
        wrapper: React.createElement(BlockWrapper, null)
    },
    'header-three': {
        element: 'h3',
        wrapper: React.createElement(BlockWrapper, null)
    },
    'header-four': {
        element: 'h4',
        wrapper: React.createElement(BlockWrapper, null)
    },
    'header-five': {
        element: 'h5',
        wrapper: React.createElement(BlockWrapper, null)
    },
    'header-six': {
        element: 'h6',
        wrapper: React.createElement(BlockWrapper, null)
    },
});
const colors = [
    {
        value: [
            '#000000', '#262626',
            '#595959', '#8c8c8c',
            '#bfbfbf', '#d9d9d9',
            '#e9e9e9', '#f5f5f5',
            '#fafafa', '#ffffff'
        ]
    },
    {
        value: [
            '#f5222d', '#fa541c',
            '#fa8c16', '#fadb14',
            '#52c41a', '#13c2c2',
            '#1890ff', '#2f54eb',
            '#722ed1', '#eb2f96'
        ]
    },
    {
        value: [
            '#ffe8e6', '#ffece0',
            '#ffefd1', '#fff8bd',
            '#e4f7d2', '#d3f5f0',
            '#d4eefc', '#dee8fc',
            '#efe1fa', '#fae1eb'
        ]
    },
    {
        value: [
            '#ffa39e', '#ffbb96',
            '#ffd591', '#fff08f',
            '#b7eb8f', '#87e8de',
            '#91d5ff', '#adc6ff',
            '#d3adf7', '#ffadd2'
        ]
    },
    {
        value: [
            '#ff4d4f', '#ff7a45',
            '#ffa940', '#ffec3d',
            '#73d13d', '#36cfc9',
            '#40a9ff', '#127ef7',
            '#9254de', '#f759ab'
        ]
    },
    {
        value: [
            '#cf1322', '#d4380d',
            '#d46b08', '#d4b106',
            '#389e0d', '#08979c',
            '#096dd9', '#1d39c4',
            '#531dab', '#c41d7f'
        ]
    },
    {
        value: [
            '#820014', '#871400',
            '#873800', '#614700',
            '#135200', '#00474f',
            '#003a8c', '#061178',
            '#22075e', '#780650'
        ]
    }
];
const toolbarArea = [
    {
        action: 'changeEditorState',
        type: 'btn',
        areas: [
            { lable: '保存', icon: React.createElement(Icon, { fontIcon: "\uE6FE" }), value: 'seve' },
            { lable: '撤销', icon: React.createElement(Icon, { fontIcon: "\uE629" }), value: 'undo' },
            { lable: '重做', icon: React.createElement(Icon, { fontIcon: "\uE62A" }), value: 'redo' }
        ]
    }, {
        action: 'format',
        type: 'btn',
        areas: [
            { lable: '格式刷', icon: React.createElement(Icon, { fontIcon: "\uE617" }), value: 'applyStyle' },
            { lable: '清除格式', icon: React.createElement(Icon, { fontIcon: "\uE65B" }), value: 'clearStyle' },
        ]
    },
    [{
            action: 'toggleBlockType',
            type: 'select',
            initValue: 'unstyled',
            lable: '文本和标题',
            areas: [
                { lable: '<div style="margin: 0; display: inline-block; min-width: 120px;">正文</div>', value: 'unstyled' },
                { lable: '<h1 style="margin: 0; display: inline-block; min-width: 120px;">标题 1</h1>', value: 'header-one' },
                { lable: '<h2 style="margin: 0; display: inline-block; min-width: 120px;">标题 2</h2>', value: 'header-two' },
                { lable: '<h3 style="margin: 0; display: inline-block; min-width: 120px;">标题 3</h3>', value: 'header-three' },
                { lable: '<h4 style="margin: 0; display: inline-block; min-width: 120px;">标题 4</h4>', value: 'header-four' },
                { lable: '<h5 style="margin: 0; display: inline-block; min-width: 120px;">标题 5</h4>', value: 'header-five' },
                { lable: '<h6 style="margin: 0; display: inline-block; min-width: 120px;">标题 6</h4>', value: 'header-six' },
            ]
        }, {
            action: 'toggleInlineStyle',
            type: 'select',
            initValue: '12px',
            lable: '字号',
            areas: [
                { lable: '12px', value: '12px' },
                { lable: '13px', value: '13px' },
                { lable: '14px', value: '14px' },
                { lable: '15px', value: '15px' },
                { lable: '16px', value: '16px' },
                { lable: '19px', value: '19px' },
                { lable: '22px', value: '22px' },
                { lable: '24px', value: '24px' },
                { lable: '29px', value: '29px' },
                { lable: '32px', value: '32px' },
                { lable: '40px', value: '40px' },
                { lable: '48px', value: '48px' },
            ]
        }],
    {
        action: 'toggleInlineStyle',
        type: 'btn',
        areas: [
            { lable: '加粗', icon: React.createElement(Icon, { fontIcon: "\uE660" }), value: 'BOLD' },
            { lable: '斜体', icon: React.createElement(Icon, { fontIcon: "\uE700" }), value: 'ITALIC' },
            { lable: '删除线', icon: React.createElement(Icon, { fontIcon: "\uE664" }), value: 'STRIKETHROUGH' },
            { lable: '下划线', icon: React.createElement(Icon, { fontIcon: "\uE701" }), value: 'UNDERLINE' },
            { lable: '更多文本样式', icon: React.createElement(Icon, { fontIcon: "\uE632" }), value: 'dd' },
        ]
    }, [{
            action: 'toggleInlineStyle',
            type: 'color',
            initValue: '#000000',
            lable: '字体颜色',
            icon: React.createElement(Icon, { fontIcon: "\uE601" }),
            areas: colors
        }, {
            action: 'toggleInlineStyle',
            type: 'background',
            initValue: '#ffffff',
            lable: '背景色',
            icon: React.createElement(Icon, { fontIcon: "\uE6F8" }),
            areas: colors
        }],
    {
        action: 'addBlockType',
        type: 'select',
        initValue: JSON.stringify({ textAlign: 'left' }),
        lable: '对齐方式',
        areas: [
            { lable: '左对齐', icon: React.createElement(Icon, { fontIcon: "\uE6CF" }), value: JSON.stringify({ textAlign: 'left' }) },
            { lable: '居中对齐', icon: React.createElement(Icon, { fontIcon: "\uE73E" }), value: JSON.stringify({ textAlign: 'center' }) },
            { lable: '右对齐', icon: React.createElement(Icon, { fontIcon: "\uE6CD" }), value: JSON.stringify({ textAlign: 'right' }) },
        ]
    },
    {
        action: 'addEntity',
        type: 'popover',
        initValue: JSON.stringify({ textAlign: 'left' }),
        areas: [
            { lable: '插入图片', icon: React.createElement(Icon, { fontIcon: "\uE64A" }), value: 'image' },
            { lable: '插入表格', icon: React.createElement(Icon, { fontIcon: "\uE6CC" }), value: JSON.stringify({ textAlign: 'center' }) },
            { lable: '插入公示', icon: React.createElement(Icon, { fontIcon: "\uE600" }), value: JSON.stringify({ textAlign: 'right' }) },
        ]
    }
];
const customStyleMap = {
    '12px': { fontSize: '12px' },
    '13px': { fontSize: '13px' },
    '14px': { fontSize: '14px' },
    '15px': { fontSize: '15px' },
    '16px': { fontSize: '16px' },
    '19px': { fontSize: '19px' },
    '22px': { fontSize: '22px' },
    '24px': { fontSize: '24px' },
    '29px': { fontSize: '29px' },
    '32px': { fontSize: '32px' },
    '40px': { fontSize: '40px' },
    '48px': { fontSize: '48px' },
};
colors.forEach(({ value }) => {
    value.forEach(s => {
        customStyleMap[`color-${s}`] = { color: s };
        customStyleMap[`background-${s}`] = { background: s };
    });
});

var css_248z$1 = ".style_page__2FnF3 {\n  display: flex;\n  height: 100%;\n  flex-direction: column;\n  align-items: center;\n  position: relative;\n  background-color: #f9f9f9;\n}\n.style_page__2FnF3 .style_main__3Jxot {\n  width: 100%;\n  overflow-y: auto;\n  padding-bottom: 64px;\n  display: flex;\n  justify-content: center;\n}\n.style_page__2FnF3 .style_main__3Jxot .style_editor__1Eryk {\n  border: 1px solid #e8e8e8;\n  border-radius: 3px;\n  box-shadow: 0 2px 8px rgba(115, 115, 115, 0.08);\n  width: 872px;\n  height: 1455px;\n  margin-top: 16px;\n  padding: 20px 60px 90px 60px;\n  background-color: white;\n}\n";
var style$1 = {"page":"style_page__2FnF3","main":"style_main__3Jxot","editor":"style_editor__1Eryk"};
styleInject(css_248z$1);

const MyEditor = (props) => {
    const { ederiotRef, editorState, setEditorState, onChange, event, stack, plugins } = props;
    const [formatBrush, setFormatBrush] = React.useState(false);
    const editorRef = React.useRef(null);
    const stateRef = React.useRef(editorState);
    React.useEffect(() => {
        stateRef.current = editorState;
    }, [editorState]);
    const getCurrentStart = () => stateRef.current;
    const [pluginHooks, setPluginHooks] = React.useState({});
    React.useEffect(() => {
        const hooks = {};
        const fnHookKeys = {};
        const params = { getCurrentStart, setEditorState, event, editorRef };
        plugins.forEach(plugin => {
            const result = typeof plugin === 'function' && plugin(params);
            _.keys(result).forEach(attrName => {
                const isFnHookKey = /.*Fn$/.test(attrName);
                if (isFnHookKey) {
                    if (!fnHookKeys[attrName]) {
                        fnHookKeys[attrName] = [];
                    }
                    fnHookKeys[attrName].push(result[attrName]);
                }
            });
        });
        _.keys(fnHookKeys).forEach(attrName => {
            hooks[attrName] = createFnHooks(attrName, fnHookKeys[attrName]);
        });
        setPluginHooks(hooks);
    }, []);
    React.useEffect(() => {
        event.on('toggleInlineStyle', (style) => {
            const selectState = getCurrentStart().getSelection();
            if ((selectState.getEndOffset() - selectState.getStartOffset()) === 0) {
                const state = insertText(getCurrentStart(), '‎', [style]);
                setEditorState(state);
                setTimeout(() => {
                    editorRef.current && editorRef.current.focus();
                });
                return state;
            }
            const newState = RichUtils.toggleInlineStyle(getCurrentStart(), style);
            setEditorState(newState);
            return newState;
        });
        event.on('toggleBlockType', (blockType) => {
            const newState = RichUtils.toggleBlockType(getCurrentStart(), blockType);
            setEditorState(newState);
            return newState;
        });
        event.on('addBlockType', (blockType) => {
            const currentContentState = getCurrentStart().getCurrentContent();
            const selectState = getCurrentStart().getSelection();
            const blockData = Map(JSON.parse(blockType));
            const contentState = Modifier.mergeBlockData(currentContentState, selectState, blockData);
            let state = EditorState.createWithContent(contentState);
            state = EditorState.acceptSelection(state, selectState);
            setEditorState(state);
            return state;
        });
        event.on('format', (action) => {
            if (action === 'clearStyle') {
                const state = removeInlineStyle(getCurrentStart(), /.*/);
                setEditorState(state);
                return state;
            }
            else if (action === 'applyStyle') {
                setFormatBrush(true);
            }
        });
        event.on('addEntity', (atomic) => {
            const newState = addEntity(getCurrentStart(), atomic, 'IMAGE');
            setEditorState(newState);
            return newState;
        });
        event.on('changeEditorState', (action) => {
            if (action === 'undo') {
                const state = stack.undo();
                state && setEditorState(state);
            }
            else if (action === 'redo') {
                const state = stack.redo();
                state && setEditorState(state);
            }
            else if (action === 'seve') {
                const contentState = getCurrentStart().getCurrentContent();
                const json = convertToRaw(contentState);
            }
        });
        event.fireFinish((eventName, params, result) => {
            if (!['changeEditorState'].includes(eventName) && result) {
                stack.push(result);
            }
        });
    }, []);
    const change = (state) => {
        const oldText = editorState.getCurrentContent().getPlainText();
        const newText = state.getCurrentContent().getPlainText();
        if (newText !== oldText) {
            typeof onChange === 'function' && onChange(state);
            stack.push(state);
        }
        if (formatBrush) {
            const inlineStyles = editorState.getCurrentInlineStyle().toJS();
            const newState = applyInlineStyle(state, inlineStyles);
            setFormatBrush(false);
            setEditorState(newState);
            return;
        }
        setEditorState(state);
    };
    return (React.createElement("div", { className: classnames({ formatBrush: formatBrush }, style$1.editor), onClick: (e) => {
            const contentEditable = document.activeElement.contentEditable;
            if (contentEditable !== 'true') {
                setTimeout(() => {
                    editorRef.current && editorRef.current.focus();
                });
            }
        } },
        React.createElement(Editor, Object.assign({ customStyleMap: customStyleMap, blockRenderMap: DefaultDraftBlockRenderMap.merge(blockRenderMap) }, pluginHooks, { editorState: editorState, onChange: change, ref: editor => {
                editorRef.current = editor;
                ederiotRef(editor);
            } }))));
};

const Context = React.createContext({});

var css_248z$2 = ".style_select__Os_gC {\n  position: relative;\n  display: inline-block;\n  outline: none;\n}\n.style_select__Os_gC .style_lake__8HnBa {\n  display: inline-block;\n  height: 100%;\n  padding-right: 20px;\n  white-space: nowrap;\n}\n.style_select__Os_gC .style_lake__8HnBa > i {\n  position: relative;\n}\n.style_select__Os_gC .style_lake__8HnBa > i:after {\n  display: block;\n  content: '';\n  position: absolute;\n  top: 7px;\n  left: 10px;\n  border-width: 8px 5px 8px 5px;\n  border-style: solid;\n  border-color: #555 transparent transparent transparent;\n}\n.style_select__Os_gC .style_dropDown__ZSRCu {\n  position: absolute;\n  padding: 5px 0;\n  top: 40px;\n  left: -8px;\n  border: 1px solid #e8e8e8;\n  background-color: white;\n  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.12);\n  flex-direction: column;\n  justify-content: space-evenly;\n  z-index: 1000;\n}\n.style_select__Os_gC .style_option__g9LRZ {\n  padding: 3px 8px;\n  white-space: nowrap;\n  cursor: pointer;\n}\n.style_select__Os_gC .style_option__g9LRZ:hover {\n  background-color: #f5f5f5;\n}\n";
var styl = {"select":"style_select__Os_gC","lake":"style_lake__8HnBa","dropDown":"style_dropDown__ZSRCu","option":"style_option__g9LRZ"};
styleInject(css_248z$2);

const Option = props => {
    const { value, children, lable, className, style } = props;
    let optlable = children;
    if (!children) {
        optlable = React.createElement("div", null, lable);
    }
    return (React.createElement(Context.Consumer, null, ({ v, setV }) => (React.createElement("div", { className: `${styl.option} ${className}`, style: style }, typeof optlable === 'function'
        ? React.createElement("div", null, optlable(v, setV))
        : (React.createElement("div", { onMouseDown: (e) => {
                e.preventDefault();
                setV(value);
            } }, optlable))))));
};

const Select = props => {
    let { disabled, className, tooltip, children, initValue, value, lable, onChange, automatic = true } = props;
    if (!React.Children.count(children)) {
        return React.createElement("div", null);
    }
    let initSelect = {};
    const currentValue = value || initValue;
    if (currentValue) {
        initSelect = children.find(({ props }) => props.value === currentValue) || {};
    }
    const [visible, setVisible] = React.useState(false);
    const [selectOption, changeSelect] = React.useState((initSelect.props || {}));
    const selectRef = React.useRef(null);
    React.useEffect(() => {
        const globalClick = (e) => {
            let target = e.target;
            while (target && target.nodeName !== 'BODY') {
                if (target === selectRef.current) {
                    e.preventDefault();
                    break;
                }
                target = target.parentElement;
            }
            if (!target || target.nodeName === 'BODY') {
                e.preventDefault();
                setVisible(false);
                return;
            }
        };
        if (document.querySelector('body')) {
            document.querySelector('body').addEventListener('click', globalClick, false);
        }
        return () => {
            if (document.querySelector('body')) {
                document.querySelector('body').removeEventListener('click', globalClick);
            }
        };
    }, []);
    React.useEffect(() => {
        if (value) {
            initSelect = children.find(({ props }) => props.value === value);
            initSelect && changeSelect(initSelect.props);
        }
    }, [value]);
    const contextValue = {
        v: currentValue || selectOption.value,
        setV: (v) => {
            const selected = children.find(({ props }) => props.value === v) || {};
            changeSelect(selected.props || { value: v });
            typeof onChange === 'function' && onChange(v);
            automatic && setVisible(false);
        },
    };
    return (React.createElement("div", { ref: ref => selectRef.current = ref, className: styl.select, disabled: disabled },
        React.createElement("div", { className: className, tooltip: tooltip, onMouseDown: (e) => {
                e.preventDefault();
                setVisible(disabled ? false : !visible);
            } },
            React.createElement("span", { className: styl.lake },
                lable || selectOption.lable || selectOption.value || currentValue,
                React.createElement("i", null))),
        React.createElement(Context.Provider, { value: contextValue },
            React.createElement("div", { className: styl.dropDown, style: {
                    display: `${visible ? "inline-flex" : "none"}`,
                } }, children))));
};
Select.Option = Option;

var css_248z$3 = ".style_popover__2RxA8 {\n  position: relative;\n}\n.style_popover__2RxA8 .style_btn__1-e3m {\n  padding: 0;\n  margin: 0;\n  border: none;\n  outline: none;\n  background-color: transparent;\n}\n.style_popover__2RxA8 .style_dropDown__2LkP4 {\n  cursor: auto;\n  padding: 5px 10px;\n  position: absolute;\n  top: 40px;\n  left: -8px;\n  border: 1px solid #e8e8e8;\n  background-color: white;\n  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.12);\n  flex-direction: column;\n  justify-content: space-evenly;\n  z-index: 1000;\n}\n";
var style$2 = {"popover":"style_popover__2RxA8","btn":"style_btn__1-e3m","dropDown":"style_dropDown__2LkP4"};
styleInject(css_248z$3);

const Popover = (props) => {
    const { className, lable, icon, children, disabled = false, tooltip } = props;
    const popoverRef = React.useRef(null);
    const [visible, setVisible] = React.useState(false);
    React.useEffect(() => {
        const globalClick = (e) => {
            let target = e.target;
            while (target && target.nodeName !== 'BODY') {
                if (target === popoverRef.current) {
                    e.preventDefault();
                    return;
                }
                target = target.parentElement;
            }
            if (!target || target.nodeName === 'BODY') {
                e.preventDefault();
                setVisible(false);
                return;
            }
        };
        if (document.querySelector('body')) {
            document.querySelector('body').addEventListener('click', globalClick, false);
        }
        return () => {
            if (document.querySelector('body')) {
                document.querySelector('body').removeEventListener('click', globalClick);
            }
        };
    }, []);
    return (React.createElement("div", { ref: (ref) => popoverRef.current = ref, className: classnames(className, style$2.popover, { tooltip: (!disabled && !visible) }), disabled: disabled, tooltip: tooltip, onMouseDown: (e) => {
            e.stopPropagation();
            setVisible(disabled ? false : !visible);
        } },
        icon,
        React.createElement("div", { className: style$2.dropDown, style: {
                display: `${visible ? "inline-flex" : "none"}`,
            }, onMouseDown: (e) => {
                e.stopPropagation();
            } }, children)));
};

var css_248z$4 = ".style_lable__2qU9T {\n  display: inline-block;\n}\n.style_lable__2qU9T > em {\n  display: block;\n  width: 16px;\n  height: 2px;\n}\n.style_option__YhK-o {\n  font-size: 0;\n}\n.style_option__YhK-o:hover {\n  cursor: auto;\n  background-color: transparent !important;\n}\n.style_option__YhK-o .style_colorItem__3Fi51 {\n  position: relative;\n  display: inline-block;\n  width: 25px;\n  height: 25px;\n  margin: 0 4px;\n  padding: 1px;\n  border-radius: 3px;\n  border: 1px solid transparent;\n}\n.style_option__YhK-o .style_colorItem__3Fi51:hover {\n  border-color: #fa541c;\n}\n.style_option__YhK-o .style_colorItem__3Fi51 span {\n  display: inline-block;\n  margin: 2px;\n  width: 21px;\n  height: 21px;\n  cursor: pointer;\n  border-radius: 3px;\n}\n.style_option__YhK-o .style_colorItem__3Fi51 span + span {\n  position: absolute;\n  color: white;\n  z-index: 99;\n  top: 2px;\n  left: 3px;\n}\n";
var style$3 = {"lable":"style_lable__2qU9T","option":"style_option__YhK-o","colorItem":"style_colorItem__3Fi51"};
styleInject(css_248z$4);

const ColorPanel = (props) => {
    const { disabled, change, areas, lable, icon, value, initValue = '#000000' } = props;
    const currentValue = value || initValue;
    const [selectColor, setColor] = React.useState(currentValue);
    React.useEffect(() => setColor(currentValue), [currentValue]);
    const colorLable = (React.createElement("span", { className: style$3.lable },
        icon,
        React.createElement("em", { style: { backgroundColor: selectColor } })));
    return (React.createElement(Select, { disabled: disabled, className: classnames({ tooltip: !disabled }), initValue: initValue, value: currentValue, onChange: change, tooltip: lable, lable: colorLable }, areas.map(({ value }, idx) => (React.createElement(Select.Option, { className: style$3.option, key: idx }, (v, setv) => {
        return value.map((colorHex, i) => (React.createElement("span", { className: style$3.colorItem, key: `${idx}-${i}`, onMouseDown: (e) => {
                e.preventDefault();
                if (colorHex !== v) {
                    setv(colorHex);
                    setColor(colorHex);
                }
            } },
            React.createElement("span", { style: {
                    backgroundColor: colorHex
                } }),
            v === colorHex
                ? React.createElement(Icon, { fontIcon: "\uE61C" })
                : '')));
    })))));
};

var css_248z$5 = ".style_input__Ohlyv {\n  display: inline-block;\n  color: rgba(0, 0, 0, 0.85);\n  font-size: 14px;\n  padding: 1px 8px;\n  line-height: 1.33;\n  border: 1px solid #d9d9d9;\n  border-radius: 2px;\n  transition: all 0.3s;\n}\n.style_input__Ohlyv:focus {\n  border-color: #40a9ff;\n  border-right-width: 1px!important;\n  outline: 0;\n  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);\n}\n";
var style$4 = {"input":"style_input__Ohlyv"};
styleInject(css_248z$5);

const Input = (props, ref) => {
    const { className, placeholder, onChange = () => { }, onBlur = () => { }, onFocus } = props;
    return React.createElement("input", { ref: ref, className: classnames(className, style$4.input), onChange: onChange, onBlur: onBlur, onFocus: onFocus, placeholder: placeholder });
};
var Input$1 = React.forwardRef(Input);

var css_248z$6 = ".style_editorToolbar__3gucq {\n  width: 100%;\n  height: 42px;\n  border: 1px solid #e8e8e8;\n  display: flex;\n  justify-content: center;\n  background-color: white;\n  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08);\n  position: sticky;\n  top: 0;\n}\n.style_editorToolbar__3gucq button {\n  background-color: white;\n}\n.style_editorToolbar__3gucq .style_barArea__1hKog {\n  height: 100%;\n  padding: 3px 0;\n  display: inline-block;\n  border-right: 1px solid #e8e8e8;\n  box-sizing: border-box;\n  vertical-align: middle;\n}\n.style_editorToolbar__3gucq .style_barArea__1hKog:nth-child(1) {\n  border-left: 1px solid #e8e8e8;\n}\n.style_editorToolbar__3gucq .style_barArea__1hKog > * {\n  box-sizing: border-box;\n  display: inline-block;\n  height: 100%;\n  font-size: 16px;\n  margin: 0 5px;\n  padding: 5px 11px;\n  border: none;\n  border-radius: 5px;\n  outline: none;\n  cursor: pointer;\n}\n.style_editorToolbar__3gucq .style_barArea__1hKog > *:hover {\n  background-color: #f5f5f5;\n}\n.style_editorToolbar__3gucq .style_barArea__1hKog > *[active='true'] {\n  color: #3cb034;\n  font-weight: bold;\n}\n.style_editorToolbar__3gucq .style_barArea__1hKog > *[disabled] {\n  background-color: transparent;\n  opacity: 0.4;\n  text-shadow: none;\n  box-shadow: none;\n  cursor: not-allowed;\n}\n";
var style$5 = {"editorToolbar":"style_editorToolbar__3gucq","barArea":"style_barArea__1hKog"};
styleInject(css_248z$6);

const ToolBar = (props) => {
    const { event, editorState, stack } = props;
    const inlineStyles = editorState.getCurrentInlineStyle().toJS();
    const selection = editorState.getSelection();
    const blockType = editorState
        .getCurrentContent()
        .getBlockForKey(selection.getStartKey())
        .getType();
    const blockData = editorState
        .getCurrentContent()
        .getBlockForKey(selection.getStartKey())
        .getData()
        .toJS();
    const renderBtn = (area, action, key) => {
        const { value, lable } = area;
        let active = inlineStyles.includes(value) ? 'true' : 'false';
        let disabled = false;
        if ('撤销' === lable) {
            disabled = stack.isBottom();
            active = `${!disabled}`;
        }
        else if ('重做' === lable) {
            disabled = stack.isTop();
            active = `${!disabled}`;
        }
        return (React.createElement("button", { key: key, disabled: disabled, className: classnames({ tooltip: !disabled }), active: active, tooltip: lable, onMouseDown: e => {
                e.preventDefault();
                event.fire(`${action}`, value);
            } }, area.icon));
    };
    const renderToolbarArea = (area, key) => {
        let disabled = false;
        const { action, type, areas, initValue, lable, icon } = area;
        let currentValue = undefined;
        if (lable === '文本和标题') {
            currentValue = blockType;
        }
        else if (lable === '字号') {
            disabled = ['header-one', 'header-two', 'header-three', 'header-four', 'header-five', 'header-six'].includes(blockType);
            currentValue = _.findLast(inlineStyles, style => /^\d{1,2}px$/.test(style)) || initValue;
        }
        else if (lable === '对齐方式') {
            try {
                const textAlign = _.get(blockData, 'textAlign');
                currentValue = textAlign ? JSON.stringify({ textAlign }) : initValue;
            }
            catch (e) { }
        }
        else if (lable === '字体颜色') {
            const colorValue = _.findLast(inlineStyles, style => /^color-#\w{6}$/.test(style)) || '';
            const color = colorValue.match(/^color-(#\w{6})$/);
            currentValue = color ? color[1] : initValue;
        }
        else if (lable === '背景色') {
            const colorValue = _.findLast(inlineStyles, style => /^background-#\w{6}$/.test(style)) || '';
            const color = colorValue.match(/^background-(#\w{6})$/);
            currentValue = color ? color[1] : initValue;
        }
        switch (type) {
            case 'btn':
                return areas.map((itemArea, idx) => renderBtn(itemArea, action, `${key}-${idx}`));
            case 'select':
                return (React.createElement(Select, { disabled: disabled, className: classnames({ tooltip: !disabled }), key: key, onChange: (style) => event.fire(`${action}`, style), initValue: initValue, value: currentValue, tooltip: lable }, areas.map(({ icon, lable = '', value }, i) => (React.createElement(Select.Option, { key: `${key}-${i}`, value: value, lable: icon
                        ? icon
                        : React.createElement("span", { style: { width: '45px', display: 'inline-block' }, dangerouslySetInnerHTML: { __html: lable.replace(/<[^>]+>/g, "") } }) }, (v, setV) => (React.createElement("span", { onMouseDown: (e) => {
                        e.preventDefault();
                        if (value !== v) {
                            setV(value);
                        }
                    } },
                    icon,
                    React.createElement("span", { style: { minWidth: '75px', display: 'inline-block', marginLeft: '8px', verticalAlign: 'middle' }, dangerouslySetInnerHTML: { __html: `${lable}` } }),
                    v === value
                        ? React.createElement(Icon, { fontIcon: "\uE61C" })
                        : '')))))));
            case 'color':
            case 'background':
                return (React.createElement(ColorPanel, { key: key, disabled: disabled, initValue: initValue, value: currentValue, change: (s) => event.fire(`${action}`, `${type}-${s}`), areas: areas, lable: lable, icon: icon }));
            case 'popover':
                return areas.map(({ icon, lable, }, idx) => React.createElement(Popover, { key: `${key}-${idx}`, icon: icon, tooltip: lable },
                    React.createElement(Input$1, { onBlur: (e) => {
                            const inputText = e.target.value;
                            event.fire(`${action}`, inputText);
                        } })));
            default:
                return '';
        }
    };
    return (React.createElement("div", { className: style$5.editorToolbar }, toolbarArea.map((toolbarArea, idx) => (React.createElement("div", { className: style$5.barArea, key: idx }, Array.isArray(toolbarArea)
        ? toolbarArea.map((area, i) => renderToolbarArea(area, `${idx}-${i}`))
        : renderToolbarArea(toolbarArea, idx))))));
};

const Image = (props) => {
    const { blockProps: { src } } = props;
    return React.createElement("img", { style: { width: '100%' }, src: src });
};

var imagePlugin = (props) => {
    const { getCurrentStart, setEditorState, event, editorRef } = props;
    return {
        blockRendererFn: (block) => {
            if (block.getType() === 'atomic') {
                const contentState = getCurrentStart().getCurrentContent();
                const entity = block.getEntityAt(0);
                if (!entity)
                    return null;
                const type = contentState.getEntity(entity).getType();
                const data = contentState.getEntity(entity).getData();
                if (type === 'IMAGE' || type === 'image') {
                    const { src } = data || {};
                    return {
                        component: Image,
                        props: {
                            src
                        },
                        editable: false,
                    };
                }
                return null;
            }
            return null;
        },
        blockStyleFn: (contentBlock) => ''
    };
};

var css_248z$7 = "html,\nbody,\ndiv {\n  margin: 0;\n  padding: 0;\n}\n#root {\n  overflow: auto;\n}\n@font-face {\n  font-family: 'iconfont';\n  /* project id 1749590 */\n  src: url('//at.alicdn.com/t/font_1749590_pinxwu32l5l.eot');\n  src: url('//at.alicdn.com/t/font_1749590_pinxwu32l5l.eot?#iefix') format('embedded-opentype'), url('//at.alicdn.com/t/font_1749590_pinxwu32l5l.woff2') format('woff2'), url('//at.alicdn.com/t/font_1749590_pinxwu32l5l.woff') format('woff'), url('//at.alicdn.com/t/font_1749590_pinxwu32l5l.ttf') format('truetype'), url('//at.alicdn.com/t/font_1749590_pinxwu32l5l.svg#iconfont') format('svg');\n}\n/* 编辑器的高度*/\n/*文字选中效果*/\n*::selection {\n  background-color: #e1f0fe;\n  color: inherit;\n}\n*::-moz-selection {\n  background-color: #e1f0fe;\n  color: inherit;\n}\n*::-webkit-selection {\n  background-color: #e1f0fe;\n  color: inherit;\n}\n.formatBrush {\n  cursor: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAUCAYAAACTQC2+AAAABGdBTUEAALGPC/xhBQAAATtJREFUSA3dlTFLA0EQhU+jlSkEG63EYGdlZZFG7QUbSyG/QP/C/Q0rqzQWQX+BwUKwtrexEFRQtFSI35NZWDa3soOHhQ8eM/v2zWw2N9xVVVUdwXUYoFxaq5il2wa8hvtG5dJaxYx16xFvLN8i3lmehiFC6Y94wbsTGsxZosajKA/7aewjrKZiyTocJO9DSYHT82r+YXyQs0eRfYBrD/Y1DB58OMyfeM/hrWq8N9qlZkmFBXiPPd6D7ikWUxwjrKWirTeJkzDeNYttKIxhDUuxiFGjfAnfMkUX3hs19emYqFt9P48mU6zVLEQPFjCfwgk8gyuwEd6pS5t0EQYmHhCXLZ8Kvz1oqmFO+H8HxVOXfZC5vwNd46y3xbx5ni1mQ4+dJ6NyDw4xX0GN9484YfcRhg+fcmmt408+5V99wSyVTWN94gAAAABJRU5ErkJggg==) 5 10, text;\n}\n.tooltip {\n  position: relative;\n}\n.tooltip:hover:after {\n  content: attr(tooltip);\n  white-space: nowrap;\n  position: absolute;\n  top: 45px;\n  left: calc(50% - 17px);\n  background-color: #555;\n  padding: 8px 8px;\n  border-radius: 5px;\n  color: white;\n  font-size: 12px;\n  line-height: 1.5;\n}\n.tooltip:hover:before {\n  display: block;\n  content: '';\n  position: absolute;\n  top: 38px;\n  left: calc(50% - 5px);\n  border-width: 0 5px 8px 5px;\n  border-style: solid;\n  border-color: transparent transparent #555 transparent;\n}\n";
styleInject(css_248z$7);

const Index = () => {
    const state = EditorState.createEmpty();
    const [editorState, setEditorState] = React.useState(state);
    const editorRef = React.useRef(null);
    const eventRef = React.useRef(new MyEvent());
    const stackRef = React.useRef(new Stack(100, editorState));
    const toolBarProps = {
        editorState,
        stack: stackRef.current,
        event: eventRef.current,
    };
    const editorProps = {
        plugins: [imagePlugin],
        event: eventRef.current,
        stack: stackRef.current,
        ederiotRef: (editor) => editorRef.current = editor,
        editorState,
        setEditorState
    };
    return (React.createElement("div", { className: style$1.page },
        React.createElement(ToolBar, Object.assign({}, toolBarProps)),
        React.createElement("div", { className: style$1.main },
            React.createElement(MyEditor, Object.assign({}, editorProps)))));
};

export default Index;
