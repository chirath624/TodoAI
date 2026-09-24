import { Text, TextInput } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import type { Note } from '../src/features/notes/types';
import { storage } from '../src/storage/mmkv';

const note = (id: string, title: string, pinned: boolean): Note => ({
  id,
  title,
  body: '',
  color: 'default',
  pinned,
  createdAt: 1,
  updatedAt: 1,
  syncStatus: 'synced',
  syncedAt: 1,
});

// Seed storage *before* the store module loads, as on a real cold start.
storage.set(
  'notes.v1',
  JSON.stringify({
    ids: ['b', 'a'],
    entities: {
      a: note('a', 'Pinned note', true),
      b: note('b', 'Regular note', false),
    },
  }),
);
const App = require('../App').default;
const { store } = require('../src/app/store');

const mounted: ReactTestRenderer.ReactTestRenderer[] = [];
afterEach(() => {
  ReactTestRenderer.act(() => mounted.splice(0).forEach(t => t.unmount()));
});

const textsOf = (tree: ReactTestRenderer.ReactTestRenderer) =>
  tree.root
    .findAllByType(Text)
    .map(t => [t.props.children].flat().join(''));

test('persisted notes are on the first render, pinned section first', async () => {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(<App />);
  });
  mounted.push(tree);

  const texts = textsOf(tree);
  const order = ['Pinned', 'Pinned note', 'Others', 'Regular note'].map(t =>
    texts.indexOf(t),
  );
  expect(order).not.toContain(-1);
  expect([...order].sort((x, y) => x - y)).toEqual(order);
});

test('quick entry bar saves a new note', async () => {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(<App />);
  });
  mounted.push(tree);

  const input = tree.root.findByProps({ accessibilityLabel: 'New note' });
  expect(input.type).toBe(TextInput);
  await ReactTestRenderer.act(() => input.props.onChangeText('Buy milk'));
  await ReactTestRenderer.act(() => input.props.onSubmitEditing());

  const bodies = Object.values(store.getState().notes.entities).map(
    n => (n as Note).body,
  );
  expect(bodies).toContain('Buy milk');
  expect(textsOf(tree)).toContain('Buy milk');
});
