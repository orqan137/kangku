import {AnnotationOperation, Stroke} from '../types';

export function resolveAnnotationStrokes(
  operations: AnnotationOperation[],
  lectureId: string,
  materialVersionId: string,
) {
  const strokes = new Map<string, Stroke>();

  operations
    .filter(
      operation =>
        operation.lectureId === lectureId &&
        operation.materialVersionId === materialVersionId,
    )
    .forEach(operation => {
      if (operation.kind === 'stroke.upsert') {
        strokes.set(operation.stroke.id, operation.stroke);
        return;
      }
      if (operation.kind === 'stroke.delete') {
        strokes.delete(operation.strokeId);
        return;
      }
      for (const [strokeId, stroke] of strokes) {
        if (stroke.authorId === operation.actorId) {
          strokes.delete(strokeId);
        }
      }
    });

  return [...strokes.values()];
}
