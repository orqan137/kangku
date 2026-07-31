import {
  errorCodes,
  isErrorWithCode,
  keepLocalCopy,
  pick,
  types,
} from '@react-native-documents/picker';
import {NewLectureMaterial} from '../types';

export type PdfSelectionResult =
  | {status: 'selected'; material: NewLectureMaterial}
  | {status: 'cancelled'}
  | {status: 'error'; message: string};

export async function pickPersistentPdf(): Promise<PdfSelectionResult> {
  try {
    const [file] = await pick({type: [types.pdf]});
    const fileName = file.name?.trim() || `강의자료-${Date.now()}.pdf`;
    const isPdf =
      file.hasRequestedType !== false &&
      (file.type === 'application/pdf' ||
        fileName.toLowerCase().endsWith('.pdf'));

    if (!isPdf) {
      return {status: 'error', message: 'PDF 파일만 강의자료로 올릴 수 있어요.'};
    }

    const [copy] = await keepLocalCopy({
      files: [
        {
          uri: file.uri,
          fileName,
          convertVirtualFileToType: file.isVirtual
            ? 'application/pdf'
            : undefined,
        },
      ],
      destination: 'documentDirectory',
    });

    if (copy.status === 'error') {
      return {
        status: 'error',
        message: '선택한 PDF를 앱 보관함에 복사하지 못했어요.',
      };
    }

    return {
      status: 'selected',
      material: {
        name: fileName,
        uri: copy.localUri,
        mimeType: 'application/pdf',
        size: file.size ?? undefined,
      },
    };
  } catch (error) {
    if (
      isErrorWithCode(error) &&
      error.code === errorCodes.OPERATION_CANCELED
    ) {
      return {status: 'cancelled'};
    }
    return {
      status: 'error',
      message: '파일을 불러오지 못했어요. 다시 시도해 주세요.',
    };
  }
}
