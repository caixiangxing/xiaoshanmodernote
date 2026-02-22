import { Node, mergeAttributes } from '@tiptap/core';

export const AudioNode = Node.create({
  name: 'audioBlock',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      title: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="audio-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'audio-block', class: 'my-3' }),
      [
        'audio',
        {
          controls: '',
          class: 'w-full rounded-lg',
          src: HTMLAttributes.src,
        },
      ],
    ];
  },
});

export const VideoNode = Node.create({
  name: 'videoBlock',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      title: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="video-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'video-block', class: 'my-3' }),
      [
        'video',
        {
          controls: '',
          class: 'w-full max-w-full rounded-lg',
          src: HTMLAttributes.src,
        },
      ],
    ];
  },
});
