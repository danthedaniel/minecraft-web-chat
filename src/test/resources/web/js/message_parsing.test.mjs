import { expect, test } from 'vitest'
import { assertIsComponent, formatComponent } from '~/message_parsing.mjs';
/**
 * @typedef {import('~/message_parsing.mjs').Component} Component
 */

/**
 * @type {readonly [string, unknown, string | undefined][]}
 */
const COMPONENT_VALIDATION_TESTS = [
    // Basic validation
    ['empty object is not a component', {}, "Component does not have a text, translate, or extra property"],
    ['object with text is a component', { text: 'test' }, undefined],
    ['object with translate is a component', { translate: 'test' }, undefined],
    ['object with extra is a component', { extra: ['test'] }, undefined],

    // Text property validation
    ['text must be string', { text: 42 }, "Component.text is not a string"],
    ['text can be empty string', { text: '' }, undefined],

    // Translate property validation
    ['translate must be string', { translate: 42 }, "Component.translate is not a string"],
    ['translate can be empty string', { translate: '' }, undefined],

    // Color validation
    ['color must be string', { text: 'test', color: 42 }, "Component.color is not a string"],
    ['color can be any string', { text: 'test', color: 'invalid_color' }, undefined],

    // Boolean property validation
    ['bold must be boolean', { text: 'test', bold: 'true' }, "Component.bold is not a boolean"],
    ['italic must be boolean', { text: 'test', italic: 'true' }, "Component.italic is not a boolean"],
    ['underlined must be boolean', { text: 'test', underlined: 'true' }, "Component.underlined is not a boolean"],
    ['strikethrough must be boolean', { text: 'test', strikethrough: 'true' }, "Component.strikethrough is not a boolean"],
    ['obfuscated must be boolean', { text: 'test', obfuscated: 'true' }, "Component.obfuscated is not a boolean"],

    // Extra array validation
    ['extra must be array', { text: 'test', extra: 'not array' }, "Component.extra is not an array"],
    ['extra can contain strings', { text: 'test', extra: ['string'] }, undefined],
    ['extra can contain valid components', { text: 'test', extra: [{ text: 'nested' }] }, undefined],
    ['extra cannot contain invalid components',
        { text: 'test', extra: [{ invalid: true }] },
        "Component does not have a text, translate, or extra property"],
    ['extra can contain numbers', { text: 'test', extra: [42] }, undefined],

    // With array validation
    ['with must be array', { translate: 'test', with: 'not array' }, "Component.with is not an array"],
    ['with can contain strings', { translate: 'test', with: ['string'] }, undefined],
    ['with can contain valid components', { translate: 'test', with: [{ text: 'param' }] }, undefined],
    ['with cannot contain invalid components',
        { translate: 'test', with: [{ invalid: true }] },
        "Component does not have a text, translate, or extra property"],
    ['with can contain numbers', { translate: 'test', with: [42] }, undefined],

    // Hover event validation
    ['hoverEvent must be object', { text: 'test', hoverEvent: 'not object' }, "HoverEvent is not an object"],
    ['hoverEvent requires action', { text: 'test', hoverEvent: {} }, "HoverEvent.action is not present"],
    ['hoverEvent action must be string', { text: 'test', hoverEvent: { action: 42 } }, "HoverEvent.action is not a string"],
    ['hoverEvent action must be one of show_text, show_item, show_entity',
        { text: 'test', hoverEvent: { action: 'invalid' } },
        "HoverEvent.action is not a valid hover event: invalid"],

    // show_text hover event validation
    ['show_text requires contents or value',
        { text: 'test', hoverEvent: { action: 'show_text' } },
        "HoverEvent does not have a contents or value property"],
    ['show_text contents can be string',
        { text: 'test', hoverEvent: { action: 'show_text', contents: 'hover' } },
        undefined],
    ['show_text contents can be component',
        { text: 'test', hoverEvent: { action: 'show_text', contents: { text: 'hover' } } },
        undefined],
    ['show_text contents can be an array',
        { text: 'test', hoverEvent: { action: 'show_text', contents: ['hover', 'test'] } },
        undefined],
    ['show_text value can be a component',
        { text: 'test', hoverEvent: { action: 'show_text', value: { text: 'hover' } } },
        undefined],
    ['show_text value can be a string',
        { text: 'test', hoverEvent: { action: 'show_text', value: 'hover' } },
        undefined],
    ['show_text value can be an array',
        { text: 'test', hoverEvent: { action: 'show_text', value: ['hover', 'test'] } },
        undefined],
    ['show_text contents can be number',
        { text: 'test', hoverEvent: { action: 'show_text', contents: 42 } },
        undefined],
    ['show_text value can be number',
        { text: 'test', hoverEvent: { action: 'show_text', value: 42 } },
        undefined],

    // show_item hover event validation
    ['show_item requires contents or value',
        { text: 'test', hoverEvent: { action: 'show_item' } },
        "HoverEvent does not have a contents or value property"],
    ['show_item contents must be object',
        { text: 'test', hoverEvent: { action: 'show_item', contents: 'not object' } },
        "HoverEvent.contents is not an object"],
    ['show_item contents requires id',
        { text: 'test', hoverEvent: { action: 'show_item', contents: {} } },
        "HoverEvent.contents.id is not present"],
    ['show_item id must be string',
        { text: 'test', hoverEvent: { action: 'show_item', contents: { id: 42 } } },
        "HoverEvent.contents.id is not a string"],
    ['show_item value can be a string',
        { text: 'test', hoverEvent: { action: 'show_item', value: 'hover' } },
        undefined],

    // show_entity hover event validation
    ['show_entity requires contents or value',
        { text: 'test', hoverEvent: { action: 'show_entity' } },
        "HoverEvent does not have a contents or value property"],
    ['show_entity contents must be object',
        { text: 'test', hoverEvent: { action: 'show_entity', contents: 'not object' } },
        "HoverEvent.contents is not an object"],
    ['show_entity contents requires type',
        { text: 'test', hoverEvent: { action: 'show_entity', contents: {} } },
        "HoverEvent.contents.type is not present"],
    ['show_entity type must be string',
        { text: 'test', hoverEvent: { action: 'show_entity', contents: { type: 42 } } },
        "HoverEvent.contents.type is not a string"],
    ['show_entity value can be a string',
        { text: 'test', hoverEvent: { action: 'show_entity', value: 'hover' } },
        undefined],

    // Component is too deep
    ['component is too deep',
        {
            text: 'level 1',
            extra: [{
                text: 'level 2',
                extra: [{
                    text: 'level 3',
                    extra: [{
                        text: 'level 4',
                        extra: [{
                            text: 'level 5',
                            extra: [{
                                text: 'level 6',
                                extra: [{
                                    text: 'level 7',
                                    extra: [{
                                        text: 'level 8',
                                        extra: [{
                                            text: 'level 9'
                                        }]
                                    }]
                                }]
                            }]
                        }]
                    }]
                }]
            }]
        },
        "Maximum chat depth exceeded"
    ],
];

for (const [name, component, expectedError] of COMPONENT_VALIDATION_TESTS) {
    test(name, () => {
        if (expectedError) {
            expect(() => assertIsComponent(component)).toThrow(expectedError);
        } else {
            expect(() => assertIsComponent(component)).not.toThrow();
        }
    });
}

/**
 * @type {readonly [string, Component, string][]}
 */
const COMPONENT_FORMATTING_TESTS = [
    // Basic text formatting
    ['empty component', { text: '' }, '<span></span>'],
    ['component with text', { text: 'test' }, '<span>test</span>'],
    ['component with translation', { translate: 'argument.id.invalid' }, '<span>Invalid ID</span>'],

    // Color formatting
    ['named color', { text: 'colored', color: 'red' }, '<span class="mc-red">colored</span>'],
    ['hex color', { text: 'hex', color: '#ff0000' }, '<span style="color: rgb(255, 0, 0);">hex</span>'],
    ['invalid color is ignored', { text: 'bad', color: 'invalid' }, '<span>bad</span>'],

    // Text styling
    ['bold text', { text: 'bold', bold: true }, '<span class="mc-bold">bold</span>'],
    ['italic text', { text: 'italic', italic: true }, '<span class="mc-italic">italic</span>'],
    ['underlined text', { text: 'underline', underlined: true }, '<span class="mc-underlined">underline</span>'],
    ['strikethrough text', { text: 'strike', strikethrough: true }, '<span class="mc-strikethrough">strike</span>'],
    ['obfuscated text', { text: 'hidden', obfuscated: true }, '<span class="mc-obfuscated">hidden</span>'],

    // Multiple styles
    ['multiple styles',
        { text: 'multi', bold: true, italic: true, color: 'blue' },
        '<span class="mc-blue mc-bold mc-italic">multi</span>'
    ],

    // Extra components
    ['extra string',
        { text: 'main', extra: ['extra'] },
        '<span>mainextra</span>'
    ],
    ['extra component',
        { text: 'main', extra: [{ text: 'extra', bold: true }] },
        '<span>main<span class="mc-bold">extra</span></span>'
    ],
    ['multiple extra',
        { text: 'main', extra: [{ text: '1', bold: true }, { text: '2', italic: true }] },
        '<span>main<span class="mc-bold">1</span><span class="mc-italic">2</span></span>'
    ],
    ['extra number',
        { text: 'main', extra: [42] },
        '<span>main42</span>'
    ],

    // Translation with parameters
    ['translation with string param',
        { translate: 'argument.id.unknown', with: ['test'] },
        '<span>Unknown ID: test</span>'
    ],
    ['translation with component param',
        { translate: 'argument.id.unknown', with: [{ text: 'test', bold: true }] },
        '<span>Unknown ID: <span class="mc-bold">test</span></span>'
    ],
    ['translation with number param',
        { translate: 'argument.id.unknown', with: [42] },
        '<span>Unknown ID: 42</span>'
    ],

    // URLs in text
    ['text with URL',
        { text: 'Visit https://example.com now' },
        '<span>Visit <a href="https://example.com" rel="noopener noreferrer" target="_blank">https://example.com</a> now</span>'
    ],

    // Hover events
    ['hover text',
        { text: 'hover', hoverEvent: { action: 'show_text', contents: 'tooltip' } },
        '<span title="tooltip">hover</span>'
    ],
    ['hover item',
        { text: 'item', hoverEvent: { action: 'show_item', contents: { id: 'minecraft:diamond' } } },
        '<span title="minecraft:diamond">item</span>'
    ],
    ['hover item with count',
        { text: 'items', hoverEvent: { action: 'show_item', contents: { id: 'minecraft:diamond', count: 64 } } },
        '<span title="64x minecraft:diamond">items</span>'
    ],
    ['hover entity',
        { text: 'entity', hoverEvent: { action: 'show_entity', contents: { type: 'minecraft:pig', id: '123', name: 'Mr. Pig' } } },
        '<span title="Mr. Pig">entity</span>'
    ],
    ['hover text with number',
        { text: 'hover', hoverEvent: { action: 'show_text', contents: 42 } },
        '<span title="42">hover</span>'
    ],


    // Complex nested components
    ['complex nested',
        {
            translate: 'argument.entity.selector.allPlayers',
            color: 'gold',
            extra: [
                { text: ' [', color: 'gray' },
                { text: '@a', color: 'aqua', bold: true },
                { text: ']', color: 'gray' }
            ]
        },
        '<span class="mc-gold">' +
            'All players' +
            '<span class="mc-gray"> [</span>' +
            '<span class="mc-aqua mc-bold">@a</span>' +
            '<span class="mc-gray">]</span>' +
        '</span>'
    ],
    ['deeply nested with multiple styles',
        {
            text: 'Level 1 ',
            color: 'gold',
            extra: [{
                text: 'Level 2 ',
                bold: true,
                extra: [{
                    text: 'Level 3',
                    color: 'aqua',
                    italic: true,
                    strikethrough: true
                }]
            }]
        },
        '<span class="mc-gold">' +
            'Level 1 ' +
            '<span class="mc-bold">' +
                'Level 2 ' +
                '<span class="mc-aqua mc-italic mc-strikethrough">' +
                    'Level 3' +
                '</span>' +
            '</span>' +
        '</span>'
    ],
    ['complex translation with nested components',
        {
            translate: 'argument.block.property.invalid',
            color: 'red',
            with: [
                { text: 'stone', color: 'gray', italic: true },
                { text: 'waterlogged', bold: true, underlined: true },
                { text: 'enabled', color: 'green' }
            ]
        },
        '<span class="mc-red">' +
            'Block ' +
            '<span class="mc-gray mc-italic">stone</span> ' +
            'does not accept \'' +
            '<span class="mc-bold mc-underlined">waterlogged</span>\' ' +
            'for ' +
            '<span class="mc-green">enabled</span> ' +
            'property' +
        '</span>'
    ],
    ['mixed text and translation with hover',
        {
            text: 'Found item: ',
            color: 'yellow',
            extra: [{
                translate: 'argument.item.id.invalid',
                with: [{
                    text: 'diamond_pickaxe',
                    color: 'aqua',
                    hoverEvent: {
                        action: 'show_item',
                        contents: {
                            id: 'minecraft:diamond_pickaxe',
                            count: 1
                        }
                    }
                }],
                italic: true
            }]
        },
        '<span class="mc-yellow">' +
            'Found item: ' +
            '<span class="mc-italic">' +
                'Unknown item \'' +
                '<span class="mc-aqua" title="1x minecraft:diamond_pickaxe">' +
                    'diamond_pickaxe' +
                '</span>\'' +
            '</span>' +
        '</span>'
    ],
    ['multiple nested translations',
        {
            translate: 'argument.entity.invalid',
            color: 'red',
            extra: [
                { text: ' - ', color: 'gray' },
                {
                    translate: 'argument.player.toomany',
                    color: 'yellow',
                    italic: true
                }
            ]
        },
        '<span class="mc-red">' +
            'Invalid name or UUID' +
            '<span class="mc-gray"> - </span>' +
            '<span class="mc-yellow mc-italic">' +
                'Only one player is allowed, but the provided selector allows more than one' +
            '</span>' +
        '</span>'
    ],
];

for (const [name, component, expected] of COMPONENT_FORMATTING_TESTS) {
    test(name, () => {
        expect(() => assertIsComponent(component)).not.toThrow();

        const element = formatComponent(component);
        if (element instanceof Text) {
            expect(element.textContent).toBe(expected);
        } else {
            expect(element.outerHTML).toBe(expected);
        }
    });
}
