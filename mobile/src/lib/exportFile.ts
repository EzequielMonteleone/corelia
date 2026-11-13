import {Platform} from 'react-native';
import * as Sharing from 'expo-sharing';
import {File, Paths} from 'expo-file-system';
import {apiClient} from '@/api/client';

export type ExportFormat = 'csv' | 'pdf';

const MIME_TYPES: Record<ExportFormat, string> = {
  csv: 'text/csv',
  pdf: 'application/pdf',
};

export async function downloadExpensePeriodExport(
  periodId: string,
  format: ExportFormat,
): Promise<void> {
  const response = await apiClient.get<ArrayBuffer>(
    `/expense-periods/${periodId}/export`,
    {
      params: {format},
      responseType: 'arraybuffer',
    },
  );

  const filename = `expense-period-${periodId}.${format}`;
  const mimeType = MIME_TYPES[format];

  if (Platform.OS === 'web') {
    const blob = new Blob([response.data], {type: mimeType});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return;
  }

  const file = new File(Paths.cache, filename);
  if (file.exists) file.delete();
  await file.write(new Uint8Array(response.data));

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('SHARING_UNAVAILABLE');
  }
  await Sharing.shareAsync(file.uri, {
    mimeType,
    dialogTitle: filename,
    UTI: format === 'pdf' ? 'com.adobe.pdf' : 'public.comma-separated-values-text',
  });
}
