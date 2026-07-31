import {resolveAnnotationStrokes} from '../src/sync/annotationReducer';
import {AnnotationOperation, Stroke} from '../src/types';

const stroke = (id: string, authorId: string): Stroke => ({
  id,
  authorId,
  materialVersionId: 'material-v1',
  pageIndex: 0,
  color: '#EE5E86',
  size: 7,
  points: [{x: 10, y: 10}],
  createdAt: '2026-07-29T00:00:00.000Z',
});

const upsert = (
  id: string,
  value: Stroke,
  sequence: number,
): AnnotationOperation => ({
  id,
  lectureId: 'lecture-1',
  materialVersionId: 'material-v1',
  actorId: value.authorId ?? 'unknown',
  clientId: value.authorId ?? 'unknown',
  clientSequence: sequence,
  kind: 'stroke.upsert',
  stroke: value,
  createdAt: '2026-07-29T00:00:00.000Z',
});

test('keeps concurrent users strokes without overwriting', () => {
  const operations = [
    upsert('op-1', stroke('stroke-a', 'user-a'), 1),
    upsert('op-2', stroke('stroke-b', 'user-b'), 1),
  ];

  expect(
    resolveAnnotationStrokes(operations, 'lecture-1', 'material-v1').map(
      item => item.id,
    ),
  ).toEqual(['stroke-a', 'stroke-b']);
});

test('clear removes only the actors own layer', () => {
  const operations: AnnotationOperation[] = [
    upsert('op-1', stroke('stroke-a', 'user-a'), 1),
    upsert('op-2', stroke('stroke-b', 'user-b'), 1),
    {
      id: 'op-3',
      lectureId: 'lecture-1',
      materialVersionId: 'material-v1',
      actorId: 'user-a',
      clientId: 'user-a',
      clientSequence: 2,
      kind: 'actor.clear',
      createdAt: '2026-07-29T00:00:01.000Z',
    },
  ];

  expect(
    resolveAnnotationStrokes(operations, 'lecture-1', 'material-v1').map(
      item => item.id,
    ),
  ).toEqual(['stroke-b']);
});

test('does not mix annotations from another material version', () => {
  const otherVersion = {
    ...upsert('op-2', stroke('stroke-b', 'user-b'), 1),
    materialVersionId: 'material-v2',
  } as AnnotationOperation;

  expect(
    resolveAnnotationStrokes(
      [upsert('op-1', stroke('stroke-a', 'user-a'), 1), otherVersion],
      'lecture-1',
      'material-v1',
    ).map(item => item.id),
  ).toEqual(['stroke-a']);
});
